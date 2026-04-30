package com.bca.carbonfootprint.controller;

import com.bca.carbonfootprint.service.OpenStreetMapService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/location")
@CrossOrigin
public class LocationController {

    private final OpenStreetMapService openStreetMapService;

    public LocationController(OpenStreetMapService openStreetMapService) {
        this.openStreetMapService = openStreetMapService;
    }

    @GetMapping("/geocode")
    public double[] getLatLong(@RequestParam("address") String address) {
        return openStreetMapService.getLatLongFromAddress(address);
    }

    @GetMapping("/reverse-geocode")
    public String getAddress(
            @RequestParam("lat") double latitude,
            @RequestParam("lon") double longitude) {
        return openStreetMapService.getAddressFromLatLong(latitude, longitude);
    }
}
