package com.bca.carbonfootprint.dto;

import java.util.List;

public class UserNotificationSummaryResponse {

    private long unreadCount;
    private List<UserNotificationResponse> notifications;

    public UserNotificationSummaryResponse(long unreadCount, List<UserNotificationResponse> notifications) {
        this.unreadCount = unreadCount;
        this.notifications = notifications;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public List<UserNotificationResponse> getNotifications() {
        return notifications;
    }
}
