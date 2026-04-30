package com.bca.carbonfootprint.dto;

import java.util.List;

public class UserChatRequest {

    private String message;
    private List<AssistantChatMessage> history;

    public UserChatRequest() {
    }

    public UserChatRequest(String message) {
        this.message = message;
    }

    public UserChatRequest(String message, List<AssistantChatMessage> history) {
        this.message = message;
        this.history = history;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<AssistantChatMessage> getHistory() {
        return history;
    }

    public void setHistory(List<AssistantChatMessage> history) {
        this.history = history;
    }
}
