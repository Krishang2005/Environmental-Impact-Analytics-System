package com.bca.carbonfootprint.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.repository.ZoneRepository;

@Configuration
public class ZoneInitializer {

    @Bean
    CommandLineRunner initZones(ZoneRepository zoneRepository) {
        return args -> {

            if (zoneRepository.count() == 0) {

                zoneRepository.save(
                    new Zone("Bangalore North", 13.02, 13.2, 77.4, 77.8)
                );

                zoneRepository.save(
                    new Zone("Bangalore South", 12.8, 12.93, 77.4, 77.8)
                );

                zoneRepository.save(
                    new Zone("Bangalore East", 12.8, 13.2, 77.65, 77.8)
                );

                zoneRepository.save(
                    new Zone("Bangalore West", 12.8, 13.2, 77.4, 77.55)
                );

                zoneRepository.save(
                    new Zone("Bangalore Central", 12.93, 13.02, 77.55, 77.65)
                );

                zoneRepository.save(
                    new Zone("Bangalore Outskirts", 12.7, 13.3, 77.3, 77.9)
                );

                System.out.println("Zones Initialized Successfully");
            }
        };
    }
}