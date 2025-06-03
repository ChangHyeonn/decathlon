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

    private int calculateScore(Map<String, Object> row) {
        int score = 0;
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
                        score += 1;
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

    private Map<String, Object> getZoneStayTimesWithScores(String dateConditionSql, boolean isToday) {
        String staySql = String.format("""
        SELECT
            z.zone_name,
            COALESCE(SUM(zst.stay_time_seconds), 0) AS total_stay_time_seconds
        FROM Zones z
        LEFT JOIN ZoneStayTimes zst ON z.zone_id = zst.zone_id AND %s
        GROUP BY z.zone_name
        ORDER BY z.zone_name
        """, dateConditionSql);

        List<Map<String, Object>> stayTimes = jdbcTemplate.queryForList(staySql);

        Map<String, Integer> lastVisitMap = new HashMap<>();
        if (isToday) {
            String lastVisitSql = """
            SELECT 
                ranked.zone_name,
                COUNT(*) AS last_visit_count
            FROM (
                SELECT zst.customer_id, z.zone_name,
                       ROW_NUMBER() OVER (PARTITION BY zst.customer_id ORDER BY zst.visited_at DESC) AS rn
                FROM ZoneStayTimes zst
                JOIN Zones z ON zst.zone_id = z.zone_id
                WHERE DATE(zst.visited_at) = CURDATE()
            ) ranked
            WHERE ranked.rn = 1
            GROUP BY ranked.zone_name
            """;

            List<Map<String, Object>> lastVisits = jdbcTemplate.queryForList(lastVisitSql);
            for (Map<String, Object> row : lastVisits) {
                String zoneName = (String) row.get("zone_name");
                int count = ((Number) row.get("last_visit_count")).intValue();
                lastVisitMap.put(zoneName, count);
            }
        }

        List<Map<String, Object>> zonesWithScores = new ArrayList<>();
        for (Map<String, Object> row : stayTimes) {
            String zoneName = (String) row.get("zone_name");
            int staySeconds = ((Number) row.get("total_stay_time_seconds")).intValue();
            int score = staySeconds / 15;

            if (isToday) {
                score += lastVisitMap.getOrDefault(zoneName, 0);
            }

            Map<String, Object> zoneInfo = new LinkedHashMap<>();
            zoneInfo.put("zone_name", zoneName);
            zoneInfo.put("total_stay_time_seconds", staySeconds);
            zoneInfo.put("score", score);

            zonesWithScores.add(zoneInfo);
        }

        return Map.of("zones", zonesWithScores);
    }

    @GetMapping("/zones/today-stay-times")
    public Map<String, Object> getTodayZoneStayTimes() {
        return getZoneStayTimesWithScores("DATE(zst.visited_at) = CURDATE()", true);
    }

    @GetMapping("/zones/weekly-stay-times")
    public Map<String, Object> getWeeklyZoneStayTimes() {
        return getZoneStayTimesWithScores("zst.visited_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND zst.visited_at <= CURDATE()", false);
    }

    @GetMapping("/zones/monthly-stay-times")
    public Map<String, Object> getMonthlyZoneStayTimes() {
        return getZoneStayTimesWithScores("zst.visited_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) AND zst.visited_at <= CURDATE()", false);
    }

    @GetMapping("/customers")
    public Map<String, Object> getAllCustomers(
            @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
            @RequestParam(value = "date", required = false) String dateStr
    ) {
        int limit = 10;
        int offset = (page - 1) * limit;

        LocalDate requestedDate;
        try {
            if (dateStr == null || dateStr.isEmpty()) {
                requestedDate = LocalDate.now();
            } else {
                requestedDate = LocalDate.parse(dateStr);
            }
        } catch (Exception e) {
            return Map.of("error", "날짜 문법 오류 예시 : 2025-03-21");
        }

        String customerIdsSql = "SELECT DISTINCT c.customer_id FROM Customers c JOIN ZoneStayTimes zst ON c.customer_id = zst.customer_id WHERE DATE(zst.visited_at) = ?";
        List<Long> customerIds = jdbcTemplate.queryForList(customerIdsSql, Long.class, requestedDate);

        if (customerIds.isEmpty()) {
            return Map.of("error", "고객이 존재하지 않습니다");
        }

        int totalCustomers = customerIds.size();
        int totalPages = (int) Math.ceil((double) totalCustomers / limit);
        if (page > totalPages) {
            page = totalPages;
            offset = (page - 1) * limit;
        }

        int toIndex = Math.min(offset + limit, totalCustomers);
        List<Long> pagedCustomerIds = customerIds.subList(offset, toIndex);

        String inSql = String.join(",", Collections.nCopies(pagedCustomerIds.size(), "?"));

        String customerSql = String.format("""
            SELECT c.customer_id, c.purchase_state,
                   COALESCE(SUM(CASE WHEN z.zone_name = 'zone_entrance' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_entrance,
                   COALESCE(SUM(CASE WHEN z.zone_name = 'zone_checkout' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_checkout,
                   COALESCE(SUM(CASE WHEN z.zone_name = 'zone_A' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_A,
                   COALESCE(SUM(CASE WHEN z.zone_name = 'zone_B' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_B,
                   GROUP_CONCAT(z.zone_name ORDER BY zst.visited_at SEPARATOR ',') AS movement_path
            FROM Customers c
            LEFT JOIN ZoneStayTimes zst ON c.customer_id = zst.customer_id AND DATE(zst.visited_at) = ?
            LEFT JOIN Zones z ON zst.zone_id = z.zone_id
            WHERE c.customer_id IN (%s)
            GROUP BY c.customer_id, c.purchase_state
            """, inSql);

        List<Object> params = new ArrayList<>();
        params.add(requestedDate);
        params.addAll(pagedCustomerIds);

        List<Map<String, Object>> queryResultList = jdbcTemplate.queryForList(customerSql, params.toArray());

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

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("current_page", page);
        pagination.put("total_pages", totalPages);
        pagination.put("previous_page", (page > 1) ? page - 1 : null);
        pagination.put("next_page", (page < totalPages) ? page + 1 : null);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("month", requestedDate.getMonthValue());
        response.put("day", requestedDate.getDayOfMonth());
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
