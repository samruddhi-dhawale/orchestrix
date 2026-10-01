package com.pipeline.pipelineorchestrator.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pipeline.pipelineorchestrator.model.UserAccount;
import com.pipeline.pipelineorchestrator.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletRequest request) {
        String username = credentials.getOrDefault("username", "").trim();
        String password = credentials.getOrDefault("password", "").trim();

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }

        String ip = request.getRemoteAddr();
        UserAccount user = userService.authenticate(username, password, ip);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid username or password"));
        }

        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());
        List<String> permissions = isAdmin
                ? List.of("LAUNCH_ALL", "DEPLOY_PRODUCTION", "MANAGE_CLOUD", "VIEW_LOGS", "SYSTEM_SETTINGS", "VIEW_AUDIT")
                : List.of("LAUNCH_DEV_STAGING", "VIEW_LOGS", "VIEW_ARTIFACTS");

        return ResponseEntity.ok(Map.of(
                "token", "orchestrix-jwt-" + (isAdmin ? "admin" : "dev") + "-" + System.currentTimeMillis(),
                "username", user.getUsername(),
                "role", user.getRole(),
                "name", user.getName(),
                "email", user.getEmail(),
                "lastVisitedPath", user.getLastVisitedPath() != null ? user.getLastVisitedPath() : "/dashboard",
                "registeredAt", user.getRegisteredAt() != null ? user.getRegisteredAt() : "",
                "permissions", permissions,
                "organization", "Orchestrix Cloud Platform"
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String username = payload.getOrDefault("username", "").trim();
        String password = payload.getOrDefault("password", "").trim();
        String name = payload.getOrDefault("name", "").trim();
        String email = payload.getOrDefault("email", "").trim();
        String role = payload.getOrDefault("role", "DEVELOPER").trim();

        try {
            UserAccount newUser = userService.register(username, password, name, email, role);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Account successfully registered",
                    "username", newUser.getUsername(),
                    "name", newUser.getName(),
                    "role", newUser.getRole()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/save-state")
    public ResponseEntity<?> saveState(@RequestBody Map<String, String> payload) {
        String username = payload.getOrDefault("username", "");
        String path = payload.getOrDefault("path", "/dashboard");
        userService.updateLastVisited(username, path);
        return ResponseEntity.ok(Map.of("status", "saved", "path", path));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserAccount>> listUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}
