package com.pipeline.pipelineorchestrator.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pipeline.pipelineorchestrator.model.LoginAuditEntry;
import com.pipeline.pipelineorchestrator.model.UserAccount;

import jakarta.annotation.PostConstruct;

@Service
public class UserService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Secure pre-computed standard BCrypt hashes (10 rounds)
    // dev123:   $2a$10$Ehoi3o9Fx5lorAFSmQaKJufmeXKZLziDnd9qEC7eNupIpBIcaBrym
    // admin123: $2a$10$XIOD6LoUzSnCH1ouJm.y5eXixDnCLe8ph3Sb1FDlDgrXxUOygAS3m
    private static final String DEFAULT_DEV_HASH = "$2a$10$Ehoi3o9Fx5lorAFSmQaKJufmeXKZLziDnd9qEC7eNupIpBIcaBrym";
    private static final String DEFAULT_ADMIN_HASH = "$2a$10$XIOD6LoUzSnCH1ouJm.y5eXixDnCLe8ph3Sb1FDlDgrXxUOygAS3m";

    private final PasswordEncoder passwordEncoder;
    private final LoginRateLimiter loginRateLimiter;
    private final Map<String, UserAccount> users = new ConcurrentHashMap<>();
    private final List<LoginAuditEntry> loginHistory = new CopyOnWriteArrayList<>();

    public UserService(PasswordEncoder passwordEncoder, LoginRateLimiter loginRateLimiter) {
        this.passwordEncoder = passwordEncoder;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostConstruct
    public void initDefaultUsers() {
        // Read BCrypt hashes from environment or fallback to pre-computed hashes
        String devHash = System.getenv("ORCHESTRIX_DEV_PASSWORD_HASH");
        if (devHash == null || devHash.isBlank()) {
            devHash = DEFAULT_DEV_HASH;
        }

        String adminHash = System.getenv("ORCHESTRIX_ADMIN_PASSWORD_HASH");
        if (adminHash == null || adminHash.isBlank()) {
            adminHash = DEFAULT_ADMIN_HASH;
        }

        // Enterprise accounts initialized with BCrypt hashes only - NO plaintext passwords
        UserAccount admin = new UserAccount(
                "admin",
                adminHash.trim(),
                "System Administrator",
                "admin@orchestrix.io",
                "ADMIN"
        );
        users.put("admin", admin);

        UserAccount dev = new UserAccount(
                "developer",
                devHash.trim(),
                "Samruddhi D. (Lead Developer)",
                "developer@orchestrix.io",
                "DEVELOPER"
        );
        users.put("developer", dev);

        // Record initial seed login audit
        loginHistory.add(new LoginAuditEntry("developer", "Samruddhi D. (Lead Developer)", "DEVELOPER", "127.0.0.1 (Web Portal)", "SUCCESS"));
        loginHistory.add(new LoginAuditEntry("admin", "System Administrator", "ADMIN", "127.0.0.1 (Cloud Console)", "SUCCESS"));
    }

    public UserAccount authenticate(String username, String rawPassword, String ipAddress) {
        if (username == null || rawPassword == null) {
            return null;
        }

        UserAccount user = users.get(username.trim().toLowerCase());
        if (user != null && passwordEncoder.matches(rawPassword.trim(), user.getPasswordHash())) {
            // Success: reset rate limit attempts for this client IP
            loginRateLimiter.resetAttempts(ipAddress);
            user.setLastLoginAt(LocalDateTime.now().format(FORMATTER));
            loginHistory.add(new LoginAuditEntry(
                    user.getUsername(),
                    user.getName(),
                    user.getRole(),
                    ipAddress != null ? ipAddress : "127.0.0.1 (Web Portal)",
                    "SUCCESS"
            ));
            return user;
        }

        // Record failed attempt in rate limiter
        loginRateLimiter.recordFailedAttempt(ipAddress);

        // Record failed attempt in audit log (NEVER log the raw password)
        loginHistory.add(new LoginAuditEntry(
                username.trim(),
                user != null ? user.getName() : "Unknown User",
                user != null ? user.getRole() : "UNAUTHORIZED",
                ipAddress != null ? ipAddress : "127.0.0.1 (Web Portal)",
                "FAILED (Invalid Credentials)"
        ));

        return null;
    }

    public UserAccount register(String username, String rawPassword, String name, String email, String role) {
        if (username == null || rawPassword == null || username.trim().isEmpty() || rawPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("Username and password cannot be empty");
        }

        String key = username.trim().toLowerCase();
        if (users.containsKey(key)) {
            throw new IllegalArgumentException("User with username '" + username + "' already exists");
        }

        // Hash the password with BCrypt before storing
        String passwordHash = passwordEncoder.encode(rawPassword.trim());

        UserAccount newUser = new UserAccount(
                key,
                passwordHash,
                name != null && !name.trim().isEmpty() ? name.trim() : username,
                email != null && !email.trim().isEmpty() ? email.trim() : key + "@orchestrix.io",
                role != null ? role.toUpperCase() : "DEVELOPER"
        );

        users.put(key, newUser);

        loginHistory.add(new LoginAuditEntry(
                newUser.getUsername(),
                newUser.getName(),
                newUser.getRole(),
                "127.0.0.1 (Registration)",
                "SUCCESS (Account Created)"
        ));

        return newUser;
    }

    public UserAccount resetPassword(String identifier, String newRawPassword, String ipAddress) {
        if (identifier == null || newRawPassword == null || identifier.trim().isEmpty() || newRawPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("Username and new password are required.");
        }

        String key = identifier.trim().toLowerCase();
        UserAccount user = users.get(key);
        if (user == null) {
            // Also search by email
            user = users.values().stream()
                    .filter(u -> key.equalsIgnoreCase(u.getEmail()))
                    .findFirst()
                    .orElse(null);
        }

        if (user == null) {
            throw new IllegalArgumentException("Account not found. Please check your username or email.");
        }

        if (newRawPassword.trim().length() < 4) {
            throw new IllegalArgumentException("New password must be at least 4 characters long.");
        }

        String newHash = passwordEncoder.encode(newRawPassword.trim());
        user.setPasswordHash(newHash);

        loginHistory.add(new LoginAuditEntry(
                user.getUsername(),
                user.getName(),
                user.getRole(),
                ipAddress != null ? ipAddress : "127.0.0.1 (Web Portal)",
                "SUCCESS (Password Changed)"
        ));

        return user;
    }

    public void recordLogout(String username, String ipAddress) {
        if (username == null) return;
        UserAccount user = users.get(username.trim().toLowerCase());
        loginHistory.add(new LoginAuditEntry(
                username.trim(),
                user != null ? user.getName() : username,
                user != null ? user.getRole() : "USER",
                ipAddress != null ? ipAddress : "127.0.0.1 (Web Portal)",
                "SUCCESS (Logged Out)"
        ));
    }

    public void updateLastVisited(String username, String path) {
        if (username == null || path == null) return;
        UserAccount user = users.get(username.trim().toLowerCase());
        if (user != null) {
            user.setLastVisitedPath(path);
        }
    }

    public UserAccount getUser(String username) {
        if (username == null) return null;
        return users.get(username.trim().toLowerCase());
    }

    public List<UserAccount> getAllUsers() {
        return new ArrayList<>(users.values());
    }

    public List<LoginAuditEntry> getLoginHistory() {
        List<LoginAuditEntry> list = new ArrayList<>(loginHistory);
        list.sort(Comparator.comparing(LoginAuditEntry::getTimestamp).reversed());
        return list;
    }
}
