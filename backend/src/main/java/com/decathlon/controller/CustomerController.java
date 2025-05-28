package com.decathlon.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
public class CustomerController {
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public CustomerController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 스코어 계산 함수
    private int calculateScore(Map<String, Object> row) {
        int score = 0;
        // 15초당 1점 계산 (각 zone별)
        score += ((Number) row.getOrDefault("zone_entrance", 0)).intValue() / 15;
        score += ((Number) row.getOrDefault("zone_checkout", 0)).intValue() / 15;
        score += ((Number) row.getOrDefault("zone_A", 0)).intValue() / 15;
        score += ((Number) row.getOrDefault("zone_B", 0)).intValue() / 15;

        String movementPathStr = (String) row.get("movement_path");
        if (movementPathStr != null) {
            List<String> pathList = Arrays.asList(movementPathStr.split(","));
            Set<String> visited = new HashSet<>();
            String prevZone = null;
            for (String zone : pathList) {
                if (prevZone != null && !zone.equals(prevZone)) {
                    if (visited.contains(zone)) {
                        score += 1; // 재방문 점수 추가
                    }
                    visited.add(prevZone);
                } else if (prevZone == null) {
                    visited.add(zone);
                }
                prevZone = zone;
            }
        }
        return score;
    }

    // 공통: 날짜 조건에 따른 zone별 체류시간 조회 함수
    private Map<String, Object> getZoneStayTimes(String dateConditionSql) {
        String sql = String.format("""
            SELECT
                z.zone_name,
                COALESCE(SUM(zst.stay_time_seconds), 0) AS total_stay_time_seconds
            FROM Zones z
            LEFT JOIN ZoneStayTimes zst ON z.zone_id = zst.zone_id AND %s
            GROUP BY z.zone_name
            ORDER BY z.zone_name
            """, dateConditionSql);

        List<Map<String, Object>> zonesData = jdbcTemplate.queryForList(sql);
        return Map.of("zones", zonesData);
    }

    @GetMapping("/zones/today-stay-times")
    public Map<String, Object> getTodayZoneStayTimes() {
        // 오늘 날짜 조건을 ON절에 넣음
        return getZoneStayTimes("DATE(zst.log_date) = CURDATE()");
    }

    @GetMapping("/zones/weekly-stay-times")
    public Map<String, Object> getWeeklyZoneStayTimes() {
        // 지난 7일간 (오늘 포함) 조건 ON절에 넣음
        return getZoneStayTimes("zst.log_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND zst.log_date <= CURDATE()");
    }

    @GetMapping("/zones/monthly-stay-times")
    public Map<String, Object> getMonthlyZoneStayTimes() {
        // 지난 1개월간 조건 ON절에 넣음
        return getZoneStayTimes("zst.log_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) AND zst.log_date <= CURDATE()");
    }

    @GetMapping("/customers")
    public Map<String, Object> getAllCustomers(@RequestParam(value = "page", required = false, defaultValue = "1") Integer page) {
        int limit = 10;
        int offset = (page - 1) * limit;
        LocalDate today = LocalDate.now();

        String customerSql = """
            SELECT c.customer_id, c.purchase_state,
                   COALESCE(SUM(CASE WHEN z.zone_name = 'zone_entrance' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_entrance,
                   COALESCE(SUM(CASE WHEN z.zone_name = 'zone_checkout' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_checkout,
                   COALESCE(SUM(CASE WHEN z.zone_name = 'zone_A' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_A,
                   COALESCE(SUM(CASE WHEN z.zone_name = 'zone_B' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_B,
                   GROUP_CONCAT(z.zone_name ORDER BY zst.visited_at SEPARATOR ',') AS movement_path
            FROM Customers c
            LEFT JOIN ZoneStayTimes zst ON c.customer_id = zst.customer_id AND DATE(zst.log_date) = ?
            LEFT JOIN Zones z ON zst.zone_id = z.zone_id
            GROUP BY c.customer_id, c.purchase_state
            LIMIT ? OFFSET ?
            """;



        List<Map<String, Object>> queryResultList = jdbcTemplate.queryForList(customerSql, today, limit, offset);

        List<Map<String, Object>> customerTrackingRecords = new ArrayList<>();
        for (Map<String, Object> row : queryResultList) {
            Map<String, Object> orderedRow = new LinkedHashMap<>();
            orderedRow.put("customer_id", row.get("customer_id"));
            orderedRow.put("zone_entrance", row.get("zone_entrance"));
            orderedRow.put("zone_checkout", row.get("zone_checkout"));
            orderedRow.put("zone_A", row.get("zone_A"));
            orderedRow.put("zone_B", row.get("zone_B"));
            orderedRow.put("purchase_state", row.get("purchase_state"));

            int score = calculateScore(row);
            orderedRow.put("score", score);

            customerTrackingRecords.add(orderedRow);
        }

        String countSql = "SELECT COUNT(*) FROM Customers";
        int totalCustomers = jdbcTemplate.queryForObject(countSql, Integer.class);
        int totalPages = (int) Math.ceil((double) totalCustomers / limit);

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("current_page", page);
        pagination.put("total_pages", totalPages);
        pagination.put("previous_page", (page > 1) ? page - 1 : null);
        pagination.put("next_page", (page < totalPages) ? page + 1 : null);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("month", today.getMonthValue());
        response.put("day", today.getDayOfMonth());
        response.put("customer_tracking_records", customerTrackingRecords);
        response.put("pagination", pagination);

        return response;
    }

    @GetMapping("/customers/{id}")
    public Map<String, Object> getCustomerDetail(@PathVariable Long id) {
        String sql = """
            SELECT
                c.customer_id AS id,
                c.purchase_state,
                MIN(zst.visited_at) AS first_visit_time,
                MAX(zst.left_at) AS last_exit_time,
                GROUP_CONCAT(z2.zone_name ORDER BY zst.visited_at SEPARATOR ',') AS movement_path,
                SUM(zst.stay_time_seconds) AS total_stay_time_seconds,
                COALESCE(SUM(CASE WHEN z2.zone_name = 'zone_entrance' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_entrance,
                COALESCE(SUM(CASE WHEN z2.zone_name = 'zone_checkout' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_checkout,
                COALESCE(SUM(CASE WHEN z2.zone_name = 'zone_A' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_A,
                COALESCE(SUM(CASE WHEN z2.zone_name = 'zone_B' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_B
            FROM Customers c
            JOIN ZoneStayTimes zst ON c.customer_id = zst.customer_id
            JOIN Zones z2 ON zst.zone_id = z2.zone_id
            WHERE c.customer_id = ?
            GROUP BY c.customer_id, c.purchase_state
            """;

        List<Map<String, Object>> resultList = jdbcTemplate.queryForList(sql, id);

        if (resultList.isEmpty()) {
            return Map.of("error", "Customer not found");
        }

        Map<String, Object> row = resultList.get(0);
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> customerData = new HashMap<>();

        LocalDateTime firstVisitTime = (LocalDateTime) row.get("first_visit_time");
        LocalDateTime lastExitTime = (LocalDateTime) row.get("last_exit_time");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yy/MM/dd HH:mm");
        String trackingPeriod = "";

        if (firstVisitTime != null && lastExitTime != null) {
            trackingPeriod = firstVisitTime.format(formatter) + " - " + lastExitTime.format(formatter);
        }

        customerData.put("tracking_period", trackingPeriod);
        customerData.put("id", row.get("id"));
        customerData.put("total_stay_time_seconds", row.get("total_stay_time_seconds"));
        customerData.put("purchase_status", row.get("purchase_state"));

        int score = calculateScore(row);
        customerData.put("score", score);

        response.put("customer_data", customerData);

        String movementPathStr = (String) row.get("movement_path");
        List<String> customerMovementLog = (movementPathStr != null) ? Arrays.asList(movementPathStr.split(",")) : List.of();
        response.put("customer_movement_log", customerMovementLog);

        return response;
    }
}
