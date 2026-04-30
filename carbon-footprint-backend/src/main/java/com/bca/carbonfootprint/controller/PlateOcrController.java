package com.bca.carbonfootprint.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bca.carbonfootprint.dto.PlateOcrRequest;
import com.bca.carbonfootprint.dto.PlateOcrResponse;
import com.bca.carbonfootprint.service.PlateOcrService;

@RestController
@RequestMapping("/api/ocr")
public class PlateOcrController {

    private final PlateOcrService plateOcrService;

    public PlateOcrController(PlateOcrService plateOcrService) {
        this.plateOcrService = plateOcrService;
    }

    @PostMapping("/vehicle-plate")
    public PlateOcrResponse recognizeVehiclePlate(@RequestBody PlateOcrRequest request) {
        return plateOcrService.recognizePlate(request.getImageDataUrl());
    }
}
