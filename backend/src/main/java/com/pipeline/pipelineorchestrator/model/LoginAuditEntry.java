package com.pipeline.pipelineorchestrator.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public class LoginAuditEntry {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private String id;
    private String username;
    private String name;
    private String role;
    private String timestamp;
    private String ipAddress;
    private String status;

    public LoginAuditEntry() {
    }

    public LoginAuditEntry(String username, String name, String role, String ipAddress, String status) {
        this.id = UUID.randomUUID().toString().substring(0, 8);
        this.username = username;
        this.name = name;
        this.role = role;
        this.timestamp = LocalDateTime.now().format(FORMATTER);
        this.ipAddress = ipAddress;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
