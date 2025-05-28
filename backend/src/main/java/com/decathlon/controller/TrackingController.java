package com.decathlon.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    @Autowired
    private JdbcTemplate jdbc;

    public TrackingController(JdbcTemplate jdbcTemplate) {
        this.jdbc = jdbcTemplate;
    }

    @PostMapping
    public ResponseEntity<String> receiveTracking(@RequestBody Map<String, Object> body) {
        try {
            String timestampStr = (String) body.get("timestamp");
            Timestamp currentTimestamp = Timestamp.from(Instant.parse(timestampStr));

            List<Map<String, Object>> objects = (List<Map<String, Object>>) body.get("objects");

            for (Map<String, Object> obj : objects) {
                int customerId = (Integer) obj.get("track_id");
                String currentZone = (String) obj.get("current_zone");
                boolean purchase = (Boolean) obj.get("purchase");
                List<String> pathHistory = (List<String>) obj.get("path_history");

                // JSON 형태로 path 저장
                String pathHistoryJson = new ObjectMapper().writeValueAsString(pathHistory);

                // 고객 정보 upsert
                jdbc.update("""
                    INSERT INTO Customers (customer_id, purchase_state, path_history)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE purchase_state = ?, path_history = ?
                """, customerId, purchase, pathHistoryJson, purchase, pathHistoryJson);

                // 이전 zone과 현재 zone이 다르면 → 이전 zone 처리
                if (pathHistory.size() >= 2) {
                    String prevZone = pathHistory.get(pathHistory.size() - 2);
                    if (!prevZone.equals(currentZone)) {
                        Integer prevZoneId = getZoneIdByName(prevZone);
                        if (prevZoneId != null) {
                            jdbc.update("""
                                UPDATE ZoneStayTimes
                                SET left_at = ?, 
                                    stay_time_seconds = stay_time_seconds + TIMESTAMPDIFF(SECOND, visited_at, ?)
                                WHERE customer_id = ? AND zone_id = ? AND left_at IS NULL
                            """, currentTimestamp, currentTimestamp, customerId, prevZoneId);
                        }
                    }
                }

                // 현재 zone은 항상 기록
                Integer currentZoneId = getZoneIdByName(currentZone);
                if (currentZoneId != null) {
                    int nextStayId = getNextStayId();
                    jdbc.update("""
                        INSERT INTO ZoneStayTimes (stay_id, customer_id, zone_id, visited_at, log_date, stay_time_seconds)
                        VALUES (?, ?, ?, ?, CURDATE(), 0)
                    """, nextStayId, customerId, currentZoneId, currentTimestamp);
                }
            }

            return ResponseEntity.ok("Receive Success");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Receive Failed");
        }
    }

    private Integer getZoneIdByName(String zoneName) {
        try {
            return jdbc.queryForObject(
                    "SELECT zone_id FROM Zones WHERE zone_name = ?",
                    Integer.class,
                    zoneName
            );
        } catch (Exception e) {
            return null;
        }
    }

    // stay_id 다음 값 구하는 메서드
    private int getNextStayId() {
        Integer maxId = jdbc.queryForObject("SELECT MAX(stay_id) FROM ZoneStayTimes", Integer.class);
        if (maxId == null) return 1; // 아직 레코드가 없으면 1부터 시작
        return maxId + 1;
    }
}
