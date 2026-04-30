package com.bca.carbonfootprint;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CarbonFootprintBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CarbonFootprintBackendApplication.class, args);
    }
}
