package com.bca.carbonfootprint.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "zones")
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private double minLatitude;

    @Column(nullable = false)
    private double maxLatitude;

    @Column(nullable = false)
    private double minLongitude;

    @Column(nullable = false)
    private double maxLongitude;

    @Column(name = "emission_limit_min_kg")
    private Double emissionLimitMinKg;

    @Column(name = "emission_limit_max_kg")
    private Double emissionLimitMaxKg;

    @Column(name = "overlay_image_url", length = 1200)
    private String overlayImageUrl;

    @Column(name = "overlay_opacity")
    private Double overlayOpacity;

    @Column(name = "overlay_fit", length = 20)
    private String overlayFit;

    @OneToMany(mappedBy = "zone")
    @JsonIgnore
    private List<User> users;

    public Zone() {}

    public Zone(String name,
                double minLatitude,
                double maxLatitude,
                double minLongitude,
                double maxLongitude) {

        this.name = name;
        this.minLatitude = minLatitude;
        this.maxLatitude = maxLatitude;
        this.minLongitude = minLongitude;
        this.maxLongitude = maxLongitude;
    }

    public Long getId() { return id; }

    public String getName() { return name; }

    public void setName(String name) { this.name = name; }

    public double getMinLatitude() { return minLatitude; }

    public void setMinLatitude(double minLatitude) { this.minLatitude = minLatitude; }

    public double getMaxLatitude() { return maxLatitude; }

    public void setMaxLatitude(double maxLatitude) { this.maxLatitude = maxLatitude; }

    public double getMinLongitude() { return minLongitude; }

    public void setMinLongitude(double minLongitude) { this.minLongitude = minLongitude; }

    public double getMaxLongitude() { return maxLongitude; }

    public void setMaxLongitude(double maxLongitude) { this.maxLongitude = maxLongitude; }

    public Double getEmissionLimitMinKg() { return emissionLimitMinKg; }

    public void setEmissionLimitMinKg(Double emissionLimitMinKg) { this.emissionLimitMinKg = emissionLimitMinKg; }

    public Double getEmissionLimitMaxKg() { return emissionLimitMaxKg; }

    public void setEmissionLimitMaxKg(Double emissionLimitMaxKg) { this.emissionLimitMaxKg = emissionLimitMaxKg; }

    public String getOverlayImageUrl() { return overlayImageUrl; }

    public void setOverlayImageUrl(String overlayImageUrl) { this.overlayImageUrl = overlayImageUrl; }

    public Double getOverlayOpacity() { return overlayOpacity; }

    public void setOverlayOpacity(Double overlayOpacity) { this.overlayOpacity = overlayOpacity; }

    public String getOverlayFit() { return overlayFit; }

    public void setOverlayFit(String overlayFit) { this.overlayFit = overlayFit; }

    public List<User> getUsers() { return users; }

    public void setUsers(List<User> users) { this.users = users; }
}
