package com.bca.carbonfootprint.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import com.bca.carbonfootprint.dto.ActionRecommendationResponse;
import com.bca.carbonfootprint.dto.AssistantChatMessage;
import com.bca.carbonfootprint.dto.CarbonBreakdownResponse;
import com.bca.carbonfootprint.model.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * AI-powered Carbon Assistant Service using DeepSeek v4 Pro via NVIDIA API
 * 
 * Features:
 * - Personalized carbon emission analysis
 * - Real-time recommendations for emission reduction
 * - Rate limiting (20 requests per user per hour)
 * - 30-minute response caching for performance
 * - Fallback graceful degradation if API fails
 */
@Service
public class PersonalCarbonAssistantService {

    private static final Logger logger = LoggerFactory.getLogger(PersonalCarbonAssistantService.class);
    private static final int HISTORY_LIMIT = 6;
    private static final int MAX_REQUESTS_PER_USER_PER_HOUR = 20;
    private static final int CACHE_TTL_MINUTES = 30;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiUrl;
    private final String apiKey;
    private final String model;
    private final Map<String, CachedAssistantAnswer> responseCache = new ConcurrentHashMap<>();
    private final Map<String, UserRateWindow> rateWindows = new ConcurrentHashMap<>();

    /**
     * Constructor - loads DeepSeek API configuration from environment variables
     * 
     * @param objectMapper JSON parser
     * @param apiUrl DeepSeek API endpoint (NVIDIA hosted)
     * @param apiKey NVIDIA API key (starts with nvapi-)
     * @param model Model identifier (deepseek-ai/deepseek-v4-pro)
     */
    public PersonalCarbonAssistantService(
            ObjectMapper objectMapper,
            @Value("${deepseek.api.url:https://integrate.api.nvidia.com/v1}") String apiUrl,
            @Value("${deepseek.api.key:}") String apiKey,
            @Value("${deepseek.model:deepseek-ai/deepseek-v4-pro}") String model
    ) {
        this.restClient = RestClient.builder().build();
        this.objectMapper = objectMapper;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.model = model;
        logger.info("PersonalCarbonAssistantService initialized with model: {}", model);
    }

    /**
     * Generate personalized carbon assistant response using DeepSeek AI
     * 
     * @param question User's question or prompt
     * @param history Previous chat messages for context
     * @param user Current user object
     * @param monthlyEmission User's monthly CO2 emissions in kg
     * @param todayEmission Today's CO2 emissions in kg
     * @param projectedEmission Projected month-end emissions in kg
     * @param zoneTargetMin Minimum zone-based target in kg
     * @param zoneTargetMax Maximum zone-based target in kg
     * @param remainingBudget Remaining carbon budget before max cap in kg
     * @param riskLevel Risk assessment (LOW, MEDIUM, HIGH, CRITICAL)
     * @param topSource User's primary emission source
     * @param topRecommendation Top recommended action
     * @return AI-generated response or null if API unavailable
     */
    public String generateAnswer(
            String question,
            List<AssistantChatMessage> history,
            User user,
            double monthlyEmission,
            double todayEmission,
            double projectedEmission,
            double zoneTargetMin,
            double zoneTargetMax,
            double remainingBudget,
            String riskLevel,
            CarbonBreakdownResponse topSource,
            ActionRecommendationResponse topRecommendation
    ) {
        // Validate inputs
        if (!StringUtils.hasText(question) || !StringUtils.hasText(apiKey)) {
            logger.debug("Question or API key missing. Skipping AI assistant.");
            return null;
        }

        // Rate limiting check
        if (!allowRequest(user.getEmail())) {
            logger.warn("Rate limit exceeded for user: {}", user.getEmail());
            return "You have reached the assistant limit for this hour. Please try again later so we can keep AI usage available for everyone.";
        }

        // Check response cache
        String cacheKey = buildCacheKey(question, user, monthlyEmission, todayEmission, projectedEmission, riskLevel, topSource);
        CachedAssistantAnswer cached = responseCache.get(cacheKey);
        if (cached != null && cached.createdAt.plusMinutes(CACHE_TTL_MINUTES).isAfter(LocalDateTime.now())) {
            logger.debug("Cache hit for user: {}", user.getEmail());
            return cached.answer;
        }

        try {
            // Build message list in OpenAI format (compatible with DeepSeek)
            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(message("system", buildSystemPrompt()));

            // Add chat history
            for (AssistantChatMessage historyItem : sanitizeHistory(history)) {
                messages.add(message(
                        normalizeRole(historyItem.getRole()),
                        safeText(historyItem.getText())
                ));
            }

            // Add current user question with context
            messages.add(message("user", buildUserPrompt(
                    question,
                    user,
                    monthlyEmission,
                    todayEmission,
                    projectedEmission,
                    zoneTargetMin,
                    zoneTargetMax,
                    remainingBudget,
                    riskLevel,
                    topSource,
                    topRecommendation
            )));

            // Build payload for DeepSeek API (OpenAI-compatible format)
            Map<String, Object> payload = Map.of(
                    "model", model,
                    "messages", messages,
                    "temperature", 1,
                    "top_p", 0.95,
                    "max_tokens", 16384,
                    "extra_body", Map.of(
                            "chat_template_kwargs", Map.of("thinking", false)
                    )
            );

            // Make API call to DeepSeek via NVIDIA endpoint
            String responseBody = restClient.post()
                    .uri(apiUrl + "/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            // Extract response text
            String answer = extractOutputText(responseBody);
            if (StringUtils.hasText(answer)) {
                responseCache.put(cacheKey, new CachedAssistantAnswer(answer, LocalDateTime.now()));
                logger.info("AI response generated for user: {}", user.getEmail());
            }
            return answer;

        } catch (Exception exception) {
            logger.warn("DeepSeek API call failed for user {}: {}. Using fallback.", user.getEmail(), exception.getMessage());
            return null; // Frontend will show built-in recommendation
        }
    }

    /**
     * Rate limiting: Allow max 20 requests per user per hour
     */
    private boolean allowRequest(String email) {
        String key = StringUtils.hasText(email) ? email.trim().toLowerCase() : "anonymous";
        LocalDateTime now = LocalDateTime.now();
        UserRateWindow window = rateWindows.compute(key, (ignored, existing) -> {
            if (existing == null || existing.windowStart.plusHours(1).isBefore(now)) {
                return new UserRateWindow(now, 1);
            }
            existing.count += 1;
            return existing;
        });
        return window.count <= MAX_REQUESTS_PER_USER_PER_HOUR;
    }

    /**
     * Build cache key based on user context and question
     */
    private String buildCacheKey(
            String question,
            User user,
            double monthlyEmission,
            double todayEmission,
            double projectedEmission,
            String riskLevel,
            CarbonBreakdownResponse topSource
    ) {
        String source = topSource != null ? topSource.getActivityType() + ":" + round(topSource.getCarbonAmount()) : "none";
        return String.join("|",
                safeText(user.getEmail()).toLowerCase(),
                safeText(question).toLowerCase(),
                String.valueOf(round(monthlyEmission)),
                String.valueOf(round(todayEmission)),
                String.valueOf(round(projectedEmission)),
                safeText(riskLevel),
                source
        );
    }

    /**
     * Create a message object in OpenAI/DeepSeek format
     */
    private Map<String, Object> message(String role, String text) {
        return Map.of(
                "role", role,
                "content", text
        );
    }

    /**
     * Keep only last 6 history messages to avoid token limits
     */
    private List<AssistantChatMessage> sanitizeHistory(List<AssistantChatMessage> history) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }

        return history.stream()
                .filter(item -> item != null && StringUtils.hasText(item.getText()))
                .skip(Math.max(0, history.size() - HISTORY_LIMIT))
                .toList();
    }

    /**
     * System prompt: Define AI assistant personality and behavior
     */
    private String buildSystemPrompt() {
        return """
                You are Carbon Copilot, a practical personal sustainability assistant inside the CarbonTrack app.
                Your job is to help one logged-in user understand their profile, daily carbon habits, monthly emission risk, and the best next actions.
                Use only the data provided in the prompt. Do not invent account changes, profile details, or measurements.
                If the user asks to change profile data or perform an action, explain what they should do in the app instead of pretending the change already happened.
                If the user sends a simple greeting like hi or hello, reply with a short friendly greeting first instead of jumping into analytics immediately.
                Keep answers supportive, specific, and concise. Prefer 3 short paragraphs or less.
                Focus on day-to-day carbon decisions, emissions reduction, zone-limit awareness, profile guidance, and healthy routines.
                """;
    }

    /**
     * Build user prompt with full carbon context and data
     */
    private String buildUserPrompt(
            String question,
            User user,
            double monthlyEmission,
            double todayEmission,
            double projectedEmission,
            double zoneTargetMin,
            double zoneTargetMax,
            double remainingBudget,
            String riskLevel,
            CarbonBreakdownResponse topSource,
            ActionRecommendationResponse topRecommendation
    ) {
        String zoneName = user.getZone() != null ? user.getZone().getName() : "Unassigned";
        String topSourceSummary = topSource != null
                ? formatLabel(topSource.getActivityType()) + " (" + round(topSource.getCarbonAmount()) + " kg)"
                : "Not enough data yet";
        String recommendationSummary = topRecommendation != null
                ? topRecommendation.getTitle() + " - " + topRecommendation.getDescription()
                : "No recommendation yet. Ask the user to log more activities.";

        return """
                User profile:
                - Name: %s
                - Email: %s
                - Sector category: %s
                - Sector type: %s
                - Zone: %s
                - Address: %s

                Carbon snapshot:
                - Monthly emission: %s kg
                - Today's emission: %s kg
                - Projected month-end emission: %s kg
                - Zone target range: %s to %s kg
                - Remaining budget before max zone cap: %s kg
                - Risk level: %s
                - Top emission source: %s
                - Best recommended next action: %s

                Respond to the user's latest message using this context.
                Latest user message: %s
                """.formatted(
                safeText(user.getName()),
                safeText(user.getEmail()),
                user.getSectorCategory() != null ? user.getSectorCategory().name() : "Unknown",
                user.getSectorType() != null ? user.getSectorType().name() : "Unknown",
                safeText(zoneName),
                safeText(user.getAddress()),
                round(monthlyEmission),
                round(todayEmission),
                round(projectedEmission),
                round(zoneTargetMin),
                round(zoneTargetMax),
                round(remainingBudget),
                safeText(riskLevel),
                topSourceSummary,
                recommendationSummary,
                safeText(question)
        );
    }

    /**
     * Parse response from DeepSeek API
     * Expected format: {"choices": [{"message": {"content": "response text"}}]}
     */
    private String extractOutputText(String responseBody) throws Exception {
        if (!StringUtils.hasText(responseBody)) {
            logger.warn("Empty response from DeepSeek API");
            return null;
        }

        JsonNode root = objectMapper.readTree(responseBody);

        // Handle standard OpenAI/DeepSeek response format
        JsonNode choices = root.path("choices");
        if (choices.isArray() && choices.size() > 0) {
            String content = choices.get(0)
                    .path("message")
                    .path("content")
                    .asText();
            if (StringUtils.hasText(content)) {
                return content.trim();
            }
        }

        // Fallback parsing for alternative response formats
        if (root.hasNonNull("output_text") && StringUtils.hasText(root.get("output_text").asText())) {
            return root.get("output_text").asText().trim();
        }

        JsonNode output = root.path("output");
        if (output.isArray()) {
            StringBuilder answer = new StringBuilder();
            for (JsonNode item : output) {
                JsonNode content = item.path("content");
                if (!content.isArray()) {
                    continue;
                }
                for (JsonNode contentItem : content) {
                    if ("output_text".equals(contentItem.path("type").asText())) {
                        String text = contentItem.path("text").asText();
                        if (StringUtils.hasText(text)) {
                            if (!answer.isEmpty()) {
                                answer.append("\n");
                            }
                            answer.append(text.trim());
                        }
                    }
                }
            }
            if (!answer.isEmpty()) {
                return answer.toString().trim();
            }
        }

        logger.warn("Could not extract response text from DeepSeek API response");
        return null;
    }

    /**
     * Normalize role to either "user" or "assistant"
     */
    private String normalizeRole(String role) {
        if ("assistant".equalsIgnoreCase(role)) {
            return "assistant";
        }
        return "user";
    }

    /**
     * Safe text extraction with fallback
     */
    private String safeText(String value) {
        return StringUtils.hasText(value) ? value.trim() : "Not provided";
    }

    /**
     * Format activity labels for display
     */
    private String formatLabel(String value) {
        return value == null ? "Unknown" : value.toLowerCase().replace('_', ' ');
    }

    /**
     * Round decimal values to 1 decimal place
     */
    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    /**
     * Cache entry for responses
     */
    private static class CachedAssistantAnswer {
        private final String answer;
        private final LocalDateTime createdAt;

        private CachedAssistantAnswer(String answer, LocalDateTime createdAt) {
            this.answer = answer;
            this.createdAt = createdAt;
        }
    }

    /**
     * Rate limiting window tracker
     */
    private static class UserRateWindow {
        private final LocalDateTime windowStart;
        private int count;

        private UserRateWindow(LocalDateTime windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
