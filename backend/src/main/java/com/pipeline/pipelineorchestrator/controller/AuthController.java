package com.pipeline.pipelineorchestrator.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pipeline.pipelineorchestrator.model.UserAccount;
import com.pipeline.pipelineorchestrator.service.JwtService;
import com.pipeline.pipelineorchestrator.service.LoginRateLimiter;
import com.pipeline.pipelineorchestrator.service.UserService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final LoginRateLimiter loginRateLimiter;

    public AuthController(UserService userService, JwtService jwtService, LoginRateLimiter loginRateLimiter) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody(required = false) Map<String, String> credentials, HttpServletRequest request) {
        if (credentials == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", 400,
                    "message", "Username and password are required."
            ));
        }

        String username = credentials.getOrDefault("username", "").trim();
        String password = credentials.getOrDefault("password", "").trim();

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", 400,
                    "message", "Username and password are required."
            ));
        }

        String clientIp = getClientIp(request);

        // Check brute-force lockout
        if (loginRateLimiter.isRateLimited(clientIp)) {
            long remainingSec = loginRateLimiter.getRemainingLockoutSeconds(clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "status", 429,
                    "message", "Too many failed login attempts. Please wait " + (remainingSec > 0 ? remainingSec + "s" : "a few minutes") + " before trying again."
            ));
        }

        UserAccount user = userService.authenticate(username, password, clientIp);

        if (user == null) {
            // Check if this latest attempt triggered rate limiting
            if (loginRateLimiter.isRateLimited(clientIp)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "status", 429,
                        "message", "Too many failed login attempts. Please wait a few minutes before trying again."
                ));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", 401,
                    "message", "Invalid username or password."
            ));
        }

        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());
        List<String> permissions = isAdmin
                ? List.of("LAUNCH_ALL", "DEPLOY_PRODUCTION", "MANAGE_CLOUD", "VIEW_LOGS", "SYSTEM_SETTINGS", "VIEW_AUDIT")
                : List.of("LAUNCH_DEV_STAGING", "VIEW_LOGS", "VIEW_ARTIFACTS");

        String token = jwtService.generateToken(user.getUsername(), user.getRole(), user.getName());

        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "token", token,
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
    public ResponseEntity<?> register(@RequestBody(required = false) Map<String, String> payload, HttpServletRequest request) {
        if (payload == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Registration details are required."));
        }

        String name = payload.getOrDefault("name", "").trim();
        String username = payload.getOrDefault("username", "").trim();
        String email = payload.getOrDefault("email", "").trim();
        String password = payload.getOrDefault("password", "").trim();

        if (name.isEmpty() || username.isEmpty() || email.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Full name, username, email address, and password are required."));
        }

        try {
            // Role is strictly enforced as DEVELOPER on server side
            UserAccount newUser = userService.register(name, username, email, password, "DEVELOPER");
            String token = jwtService.generateToken(newUser.getUsername(), newUser.getRole(), newUser.getName());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "status", 201,
                    "success", true,
                    "username", newUser.getUsername(),
                    "role", newUser.getRole(),
                    "token", token,
                    "message", "Account created successfully. Please log in."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody(required = false) Map<String, String> payload) {
        if (payload == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email address is required."));
        }

        String email = payload.getOrDefault("email", "").trim();
        if (email.isEmpty()) {
            email = payload.getOrDefault("emailOrUsername", "").trim();
        }
        if (email.isEmpty()) {
            email = payload.getOrDefault("username", "").trim();
        }

        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email address is required."));
        }

        String resetToken = userService.createPasswordResetToken(email);

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", 200);
        response.put("message", "If an account exists for this email, password reset instructions have been sent.");
        if (resetToken != null) {
            response.put("resetToken", resetToken);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody(required = false) Map<String, String> payload, HttpServletRequest request) {
        if (payload == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reset parameters and new password are required."));
        }

        String token = payload.getOrDefault("token", "").trim();
        String username = payload.getOrDefault("username", "").trim();
        String newPassword = payload.getOrDefault("newPassword", "").trim();

        if (newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password is required."));
        }

        if (token.isEmpty() && username.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reset token or username / ID is required."));
        }

        try {
            UserAccount updated;
            if (!token.isEmpty()) {
                updated = userService.resetPasswordWithToken(token, newPassword, getClientIp(request));
            } else {
                updated = userService.resetPassword(username, newPassword, getClientIp(request));
            }

            return ResponseEntity.ok(Map.of(
                    "status", 200,
                    "username", updated.getUsername(),
                    "message", "Password successfully updated! You can now sign in with your new password."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest request) {

        String token = extractBearerToken(authHeader);
        String username = null;

        if (token != null) {
            Claims claims = jwtService.validateAndExtractClaims(token);
            if (claims != null) {
                username = claims.getSubject();
            }
            jwtService.invalidateToken(token);
        }

        if (username != null) {
            userService.recordLogout(username, getClientIp(request));
        }

        return ResponseEntity.ok(Map.of(
                "status", 200,
                "message", "Logged out successfully"
        ));
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

    private String extractBearerToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
