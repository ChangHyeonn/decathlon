package com.decathlon.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    @GetMapping("/customers")
    public Map<String, Object> getAllCustomers(@RequestParam(value = "page", required = false) Integer page) {
        // 고객 전체 데이터 조회 로직 구현
        int limit = 10;
        int offset = (page - 1) * limit;
        LocalDate today = LocalDate.now();

        String customerSql = "SELECT c.customer_id, c.purchase_state, " +
                "       COALESCE(SUM(CASE WHEN z.zone_name = 'zone_entrance' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_entrance, " +
                "       COALESCE(SUM(CASE WHEN z.zone_name = 'zone_checkout' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_checkout, " +
                "       COALESCE(SUM(CASE WHEN z.zone_name = 'zone_A' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_A, " +
                "       COALESCE(SUM(CASE WHEN z.zone_name = 'zone_B' THEN zst.stay_time_seconds ELSE 0 END), 0) AS zone_B " +
                "FROM Customers c " +
                "LEFT JOIN ZoneStayTimes zst ON c.customer_id = zst.customer_id AND DATE(zst.log_date) = ? " +
                "LEFT JOIN Zones z ON zst.zone_id = z.zone_id " +
                "GROUP BY c.customer_id, c.purchase_state " +
                "LIMIT ? OFFSET ?";

        List<Map<String, Object>> queryResultList = jdbcTemplate.queryForList(customerSql, today, limit, offset);
        List<Map<String, Object>> customerTrackingRecords = queryResultList.stream()
                .map(row -> {
                    Map<String, Object> orderedRow = new LinkedHashMap<>();
                    orderedRow.put("customer_id", row.get("customer_id"));
                    orderedRow.put("zone_entrance", row.get("zone_entrance"));
                    orderedRow.put("zone_checkout", row.get("zone_checkout"));
                    orderedRow.put("zone_A", row.get("zone_A"));
                    orderedRow.put("zone_B", row.get("zone_B"));
                    orderedRow.put("purchase_state", row.get("purchase_state"));
                    return orderedRow;
                })
                .toList();

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
        // 특정 고객 상세 데이터 조회 로직 구현
        String sql = "SELECT " +
                "    c.customer_id AS id, " +
                "    c.purchase_state, " +
                "    MIN(zst.visited_at) AS first_visit_time, " +
                "    MAX(zst.left_at) AS last_exit_time, " +
                "    GROUP_CONCAT(z2.zone_name ORDER BY zst.visited_at SEPARATOR ',') AS movement_path, " +
                "    SUM(zst.stay_time_seconds) AS total_stay_time_seconds " +
                "FROM " +
                "    Customers c " +
                "JOIN " +
                "    ZoneStayTimes zst ON c.customer_id = zst.customer_id " +
                "JOIN " +
                "    Zones z2 ON zst.zone_id = z2.zone_id " +
                "WHERE " +
                "    c.customer_id = ? " +
                "GROUP BY " +
                "    c.customer_id, c.purchase_state";

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

        response.put("customer_data", customerData);

        String movementPathString = (String) row.get("movement_path");
        List<String> customerMovementLog = (movementPathString != null) ? Arrays.asList(movementPathString.split(",")) : List.of();
        response.put("customer_movement_log", customerMovementLog);

        return response;
    }

    @GetMapping("/zones/today-stay-times")
    public Map<String, Object> getTodayZoneStayTimes() {
        // 오늘 날짜 기준 구역별 체류 시간 조회 로직 구현
        String sql = "SELECT " +
                "    z.zone_name, " +
                "    SUM(zst.stay_time_seconds) AS total_stay_time_seconds " +
                "FROM " +
                "    ZoneStayTimes zst " +
                "JOIN " +
                "    Zones z ON zst.zone_id = z.zone_id " +
                "WHERE " +
                "    DATE(zst.log_date) = CURDATE() " +
                "GROUP BY " +
                "    z.zone_name";

        List<Map<String, Object>> zonesData = jdbcTemplate.queryForList(sql);

        return Map.of("zones", zonesData);
    }

    @GetMapping("/zones/weekly-stay-times")
    public Map<String, Object> getWeeklyZoneStayTimes() {
        // 최근 1주일 기준 구역별 체류 시간 조회 로직 구현

        String sql = "SELECT " +
                "    z.zone_name, " +
                "    SUM(zst.stay_time_seconds) AS total_stay_time_seconds " +
                "FROM " +
                "    ZoneStayTimes zst " +
                "JOIN " +
                "    Zones z ON zst.zone_id = z.zone_id " +
                "WHERE " +
                "    zst.log_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) " +
                "    AND zst.log_date <= CURDATE() " +
                "GROUP BY " +
                "    z.zone_name";

        List<Map<String, Object>> zonesData = jdbcTemplate.queryForList(sql);

        return Map.of("zones", zonesData);
    }

    @GetMapping("/zones/monthly-stay-times")
    public Map<String, Object> getMonthlyZoneStayTimes() {
        // 최근 1개월 기준 구역별 체류 시간 조회 로직 구현

        String sql = "SELECT " +
                "    z.zone_name, " +
                "    SUM(zst.stay_time_seconds) AS total_stay_time_seconds " +
                "FROM " +
                "    ZoneStayTimes zst " +
                "JOIN " +
                "    Zones z ON zst.zone_id = z.zone_id " +
                "WHERE " +
                "    zst.log_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) " +
                "    AND zst.log_date <= CURDATE() " +
                "GROUP BY " +
                "    z.zone_name";

        List<Map<String, Object>> zonesData = jdbcTemplate.queryForList(sql);

        return Map.of("zones", zonesData);
    }

}
