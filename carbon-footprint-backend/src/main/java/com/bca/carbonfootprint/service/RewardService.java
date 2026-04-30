package com.bca.carbonfootprint.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.dto.RewardEventResponse;
import com.bca.carbonfootprint.dto.RewardSummaryResponse;
import com.bca.carbonfootprint.model.RewardEvent;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.RewardEventRepository;

@Service
public class RewardService {

    private final RewardEventRepository rewardEventRepository;

    public RewardService(RewardEventRepository rewardEventRepository) {
        this.rewardEventRepository = rewardEventRepository;
    }

    public int awardPoints(User user, String source, String referenceKey, int points, String description) {
        if (points <= 0) {
            return 0;
        }

        boolean alreadyGranted = rewardEventRepository.existsByUser_IdAndSourceAndReferenceKey(
                user.getId(),
                source,
                referenceKey
        );

        if (alreadyGranted) {
            return 0;
        }

        RewardEvent event = new RewardEvent();
        event.setUser(user);
        event.setSource(source);
        event.setReferenceKey(referenceKey);
        event.setPoints(points);
        event.setDescription(description);
        event.setCreatedAt(LocalDateTime.now());

        rewardEventRepository.save(event);
        return points;
    }

    public int getTotalPoints(Long userId) {
        Integer points = rewardEventRepository.getTotalPointsByUser(userId);
        return points != null ? points : 0;
    }

    public RewardSummaryResponse getSummary(User user) {
        int total = getTotalPoints(user.getId());
        List<RewardEventResponse> events = rewardEventRepository
                .findTop20ByUser_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(event -> new RewardEventResponse(
                        event.getSource(),
                        event.getPoints(),
                        event.getDescription(),
                        event.getCreatedAt()
                ))
                .toList();
        return new RewardSummaryResponse(total, events);
    }
}
