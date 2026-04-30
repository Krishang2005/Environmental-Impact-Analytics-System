package com.bca.carbonfootprint.dto;

import java.util.List;

public class UserChatResponse {

    private String answer;
    private String riskLevel;
    private List<String> insights;
    private List<String> followUpPrompts;

    public UserChatResponse(
            String answer,
            String riskLevel,
            List<String> insights,
            List<String> followUpPrompts
    ) {
        this.answer = answer;
        this.riskLevel = riskLevel;
        this.insights = insights;
        this.followUpPrompts = followUpPrompts;
    }

    public String getAnswer() {
        return answer;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public List<String> getInsights() {
        return insights;
    }

    public List<String> getFollowUpPrompts() {
        return followUpPrompts;
    }
}
