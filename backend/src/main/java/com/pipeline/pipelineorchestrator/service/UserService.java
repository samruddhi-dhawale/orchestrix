package com.pipeline.pipelineorchestrator.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Service;

import com.pipeline.pipelineorchestrator.model.LoginAuditEntry;
import com.pipeline.pipelineorchestrator.model.UserAccount;

import jakarta.annotation.PostConstruct;

@Service
public class UserService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final Map<String, UserAccount> users = new ConcurrentHashMap<>();
    private final List<LoginAuditEntry> loginHistory = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void initDefaultUsers() {
        // Pre-seeded enterprise accounts
        UserAccount admin = new UserAccount(
                "admin",
                "admin123",
                "System Administrator",
                "admin@orchestrix.io",
                "ADMIN"
        );
        users.put("admin", admin);

        UserAccount dev = new UserAccount(
                "developer",
                "dev123",
                "Samruddhi D. (Lead Developer)",
                "developer@orchestrix.io",
                "DEVELOPER"
        );
        users.put("developer", dev);

        // Record initial seed login audit
        loginHistory.add(new LoginAuditEntry("developer", "Samruddhi D. (Lead Developer)", "DEVELOPER", "127.0.0.1 (Web Portal)", "SUCCESS"));
        loginHistory.add(new LoginAuditEntry("admin", "System Administrator", "ADMIN", "127.0.0.1 (Cloud Console)", "SUCCESS"));
    }

    public UserAccount authenticate(String username, String password, String ipAddress) {
        if (username == null || password == null) {
            return null;
        }

        UserAccount user = users.get(username.trim().toLowerCase());
        if (user != null && user.getPassword().equals(password.trim())) {
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

        // Record failed attempt
        loginHistory.add(new LoginAuditEntry(
                username,
                "Unknown User",
                "UNAUTHORIZED",
                ipAddress != null ? ipAddress : "127.0.0.1 (Web Portal)",
                "FAILED (Invalid Credentials)"
        ));

        return null;
    }

    public UserAccount register(String username, String password, String name, String email, String role) {
        if (username == null || password == null || username.trim().isEmpty() || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Username and password cannot be empty");
        }

        String key = username.trim().toLowerCase();
        if (users.containsKey(key)) {
            throw new IllegalArgumentException("User with username '" + username + "' already exists");
        }

        UserAccount newUser = new UserAccount(
                key,
                password.trim(),
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
