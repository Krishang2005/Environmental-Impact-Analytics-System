package com.bca.carbonfootprint.dto;

import java.time.LocalDate;

public class AdminAllUserResponse {

    private Long id;
    private String name;
    private String email;
    private String address;
    private String zoneName;
    private String zoneStatus;
    private Double monthlyEmission;
    private String latestActivityType;
    private Double latestEmissionAmount;
    private LocalDate latestEmissionDate;

    public AdminAllUserResponse(
            Long id,
            String name,
            String email,
            String address,
            String zoneName,
            String zoneStatus,
            Double monthlyEmission,
            String latestActivityType,
            Double latestEmissionAmount,
            LocalDate latestEmissionDate
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.address = address;
        this.zoneName = zoneName;
        this.zoneStatus = zoneStatus;
        this.monthlyEmission = monthlyEmission;
        this.latestActivityType = latestActivityType;
        this.latestEmissionAmount = latestEmissionAmount;
        this.latestEmissionDate = latestEmissionDate;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getAddress() { return address; }
    public String getZoneName() { return zoneName; }
    public String getZoneStatus() { return zoneStatus; }
    public Double getMonthlyEmission() { return monthlyEmission; }
    public String getLatestActivityType() { return latestActivityType; }
    public Double getLatestEmissionAmount() { return latestEmissionAmount; }
    public LocalDate getLatestEmissionDate() { return latestEmissionDate; }
}
