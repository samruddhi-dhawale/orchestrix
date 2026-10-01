package com.pipeline.pipelineorchestrator.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class UserAccount {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private String username;
    private String password;
    private String name;
    private String email;
    private String role; // "ADMIN" or "DEVELOPER"
    private String registeredAt;
    private String lastLoginAt;
    private String lastVisitedPath;

    public UserAccount() {
    }

    public UserAccount(String username, String password, String name, String email, String role) {
        this.username = username;
        this.password = password;
        this.name = name;
        this.email = email;
        this.role = role != null ? role.toUpperCase() : "DEVELOPER";
        this.registeredAt = LocalDateTime.now().format(FORMATTER);
        this.lastLoginAt = this.registeredAt;
        this.lastVisitedPath = "/dashboard";
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(String registeredAt) {
        this.registeredAt = registeredAt;
    }

    public String getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(String lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public String getLastVisitedPath() {
        return lastVisitedPath;
    }

    public void setLastVisitedPath(String lastVisitedPath) {
        this.lastVisitedPath = lastVisitedPath;
    }
}
