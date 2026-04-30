package com.bca.carbonfootprint.dto;

public class IssueStatusUpdateRequest {

    private String note;
    private String proofImageUrl;

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getProofImageUrl() {
        return proofImageUrl;
    }

    public void setProofImageUrl(String proofImageUrl) {
        this.proofImageUrl = proofImageUrl;
    }
}
