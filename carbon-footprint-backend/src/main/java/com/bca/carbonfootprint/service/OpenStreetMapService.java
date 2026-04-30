package com.bca.carbonfootprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class OpenStreetMapService {

    public double[] getLatLongFromAddress(String address) {

        try {
            String url = "https://nominatim.openstreetmap.org/search?q="
                    + java.net.URLEncoder.encode(address, "UTF-8")
                    + "&format=json&limit=1";

            JsonNode location = performRequest(url, true).get(0);

            double lat = location.get("lat").asDouble();
            double lon = location.get("lon").asDouble();

            return new double[]{lat, lon};

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch geolocation", e);
        }
    }

    public String getAddressFromLatLong(double latitude, double longitude) {
        try {
            String url = "https://nominatim.openstreetmap.org/reverse?lat="
                    + latitude
                    + "&lon="
                    + longitude
                    + "&format=jsonv2";

            JsonNode root = performRequest(url, false);
            JsonNode displayName = root.get("display_name");

            if (displayName == null || displayName.isNull() || displayName.asText().isBlank()) {
                throw new RuntimeException("Address not found");
            }

            return displayName.asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch address", e);
        }
    }

    private JsonNode performRequest(String url, boolean expectArray) throws Exception {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "carbon-footprint-app");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
        );

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(response.getBody());

        if (expectArray && root.isEmpty()) {
            throw new RuntimeException("Address not found");
        }

        return root;
    }
}
