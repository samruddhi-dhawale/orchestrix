package com.pipeline.pipelineorchestrator.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.getOrDefault("username", "").trim();
        String password = credentials.getOrDefault("password", "").trim();

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }

        boolean isAdmin = "admin".equalsIgnoreCase(username);

        String role = isAdmin ? "ADMIN" : "DEVELOPER";
        String name = isAdmin ? "System Administrator" : "Samruddhi D. (Lead Developer)";
        List<String> permissions = isAdmin
                ? List.of("LAUNCH_ALL", "DEPLOY_PRODUCTION", "MANAGE_CLOUD", "VIEW_LOGS", "SYSTEM_SETTINGS")
                : List.of("LAUNCH_DEV_STAGING", "VIEW_LOGS", "VIEW_ARTIFACTS");

        return ResponseEntity.ok(Map.of(
                "token", "orchestrix-jwt-" + (isAdmin ? "admin" : "dev") + "-" + System.currentTimeMillis(),
                "username", username,
                "role", role,
                "name", name,
                "email", username + "@orchestrix.io",
                "permissions", permissions,
                "organization", "Orchestrix Cloud Platform"
        ));
    }
}
