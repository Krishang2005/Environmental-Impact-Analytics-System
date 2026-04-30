package com.bca.carbonfootprint.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    private String address;

    private Double latitude;
    private Double longitude;

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SectorCategory sectorCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SectorType sectorType;

    // ✅ ADD THIS (REQUIRED FOR JPQL JOIN)
    @OneToMany(mappedBy = "user")
    private List<CarbonEntry> carbonEntries;

    // -------- GETTERS & SETTERS --------

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Zone getZone() { return zone; }
    public void setZone(Zone zone) { this.zone = zone; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public SectorCategory getSectorCategory() { return sectorCategory; }
    public void setSectorCategory(SectorCategory sectorCategory) {
        this.sectorCategory = sectorCategory;
    }

    public SectorType getSectorType() { return sectorType; }
    public void setSectorType(SectorType sectorType) {
        this.sectorType = sectorType;
    }

    public List<CarbonEntry> getCarbonEntries() { return carbonEntries; }
    public void setCarbonEntries(List<CarbonEntry> carbonEntries) {
        this.carbonEntries = carbonEntries;
    }
}