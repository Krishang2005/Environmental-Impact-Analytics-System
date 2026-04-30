package com.bca.carbonfootprint.dto;

public class ZoneEmissionReportDTO {

    private String zoneName;
    private Double totalEmission;

    public ZoneEmissionReportDTO(String zoneName, Double totalEmission) {
        this.zoneName = zoneName;
        this.totalEmission = totalEmission;
    }

    public String getZoneName() {
        return zoneName;
    }

    public Double getTotalEmission() {
        return totalEmission;
    }
}