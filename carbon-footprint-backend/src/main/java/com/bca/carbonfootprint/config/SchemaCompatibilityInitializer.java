package com.bca.carbonfootprint.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaCompatibilityInitializer {

    @Bean
    CommandLineRunner normalizeIssueStatusColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            alterColumnIfPresent(
                    jdbcTemplate,
                    "environmental_issue",
                    "status",
                    "ALTER TABLE environmental_issue MODIFY status VARCHAR(40) NOT NULL"
            );
            alterColumnIfPresent(
                    jdbcTemplate,
                    "issue_status_history",
                    "previous_status",
                    "ALTER TABLE issue_status_history MODIFY previous_status VARCHAR(40) NULL"
            );
            alterColumnIfPresent(
                    jdbcTemplate,
                    "issue_status_history",
                    "new_status",
                    "ALTER TABLE issue_status_history MODIFY new_status VARCHAR(40) NOT NULL"
            );
        };
    }

    private void alterColumnIfPresent(
            JdbcTemplate jdbcTemplate,
            String tableName,
            String columnName,
            String alterSql
    ) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND column_name = ?
                """,
                Integer.class,
                tableName,
                columnName
        );

        if (count != null && count > 0) {
            jdbcTemplate.execute(alterSql);
        }
    }
}
