package com.pipeline.pipelineorchestrator;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.pipeline.pipelineorchestrator.controller.AuthController;
import com.pipeline.pipelineorchestrator.model.UserAccount;
import com.pipeline.pipelineorchestrator.service.JwtService;
import com.pipeline.pipelineorchestrator.service.LoginRateLimiter;
import com.pipeline.pipelineorchestrator.service.UserService;

public class AuthSecurityTest {

    private BCryptPasswordEncoder encoder;
    private LoginRateLimiter rateLimiter;
    private UserService userService;
    private JwtService jwtService;
    private AuthController authController;

    @BeforeEach
    public void setup() {
        encoder = new BCryptPasswordEncoder();
        rateLimiter = new LoginRateLimiter();
        userService = new UserService(encoder, rateLimiter);
        userService.initDefaultUsers();
        jwtService = new JwtService("OrchestrixSecureJwtKeyForCiCdOrchestrationPlatform2026!", 86400000L);
        authController = new AuthController(userService, jwtService, rateLimiter);
    }

    @Test
    public void testBCryptHashing() {
        String devHash = encoder.encode("dev123");
        String adminHash = encoder.encode("admin123");
        assertTrue(encoder.matches("dev123", devHash));
        assertTrue(encoder.matches("admin123", adminHash));
        assertFalse(encoder.matches("wrongpass", devHash));
    }

    @Test
    public void testSuccessfulDeveloperLogin() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.10");

        ResponseEntity<?> response = authController.login(Map.of(
                "username", "developer",
                "password", "dev123"
        ), request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("authenticated"));
        assertEquals("developer", body.get("username"));
        assertEquals("DEVELOPER", body.get("role"));
        assertNotNull(body.get("token"));
        assertTrue(jwtService.isTokenValid((String) body.get("token")));
    }

    @Test
    public void testSuccessfulAdminLogin() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.11");

        ResponseEntity<?> response = authController.login(Map.of(
                "username", "admin",
                "password", "admin123"
        ), request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("authenticated"));
        assertEquals("admin", body.get("username"));
        assertEquals("ADMIN", body.get("role"));
    }

    @Test
    public void testInvalidPasswordReturns401WithGenericMessage() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.12");

        ResponseEntity<?> response = authController.login(Map.of(
                "username", "developer",
                "password", "incorrectPass"
        ), request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals("Invalid username or password.", body.get("message"));
    }

    @Test
    public void testUnknownUserReturns401WithGenericMessage() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.13");

        ResponseEntity<?> response = authController.login(Map.of(
                "username", "ghostUser",
                "password", "anyPassword"
        ), request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals("Invalid username or password.", body.get("message"));
    }

    @Test
    public void testEmptyCredentialsReturns400() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        ResponseEntity<?> res1 = authController.login(Map.of("username", "", "password", ""), request);
        assertEquals(HttpStatus.BAD_REQUEST, res1.getStatusCode());

        ResponseEntity<?> res2 = authController.login(Map.of("username", "developer", "password", ""), request);
        assertEquals(HttpStatus.BAD_REQUEST, res2.getStatusCode());

        ResponseEntity<?> res3 = authController.login(null, request);
        assertEquals(HttpStatus.BAD_REQUEST, res3.getStatusCode());
    }

    @Test
    public void testRateLimitingAfterFiveFailedAttempts() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        String attackerIp = "10.0.0.99";
        request.setRemoteAddr(attackerIp);

        // 5 consecutive failed attempts
        for (int i = 0; i < 5; i++) {
            ResponseEntity<?> res = authController.login(Map.of(
                    "username", "admin",
                    "password", "badpass" + i
            ), request);
            if (i < 4) {
                assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
            } else {
                // The 5th failed attempt triggers rate limiting
                assertEquals(HttpStatus.TOO_MANY_REQUESTS, res.getStatusCode());
            }
        }

        // 6th attempt is blocked immediately by rate limiter with 429
        ResponseEntity<?> blockedRes = authController.login(Map.of(
                "username", "admin",
                "password", "admin123" // even with correct password!
        ), request);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, blockedRes.getStatusCode());
    }

    @Test
    public void testLogoutInvalidatesToken() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.20");

        // Login
        ResponseEntity<?> loginRes = authController.login(Map.of(
                "username", "developer",
                "password", "dev123"
        ), request);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) loginRes.getBody();
        String token = (String) body.get("token");
        assertTrue(jwtService.isTokenValid(token));

        // Logout
        ResponseEntity<?> logoutRes = authController.logout("Bearer " + token, request);
        assertEquals(HttpStatus.OK, logoutRes.getStatusCode());

        // Token must now be invalidated
        assertFalse(jwtService.isTokenValid(token));
        assertNull(jwtService.validateAndExtractClaims(token));
    }

    @Test
    public void testNoPlaintextPasswordsInUserAccount() {
        UserAccount dev = userService.getUser("developer");
        assertNotNull(dev);
        assertNotNull(dev.getPasswordHash());
        // Verify it starts with standard BCrypt prefix $2a$ or $2b$
        assertTrue(dev.getPasswordHash().startsWith("$2a$") || dev.getPasswordHash().startsWith("$2b$"));
    }

    @Test
    public void testRegisterNewUser() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        ResponseEntity<?> res = authController.register(Map.of(
                "name", "Samruddhi Dhawale",
                "username", "samruddhi",
                "password", "secretPass123",
                "email", "samruddhi@orchestrix.io",
                "role", "DEVELOPER"
        ), request);

        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertEquals("samruddhi", body.get("username"));
        assertEquals("DEVELOPER", body.get("role"));
        assertNotNull(body.get("token"));

        // Verify login works with the new account
        ResponseEntity<?> loginRes = authController.login(Map.of(
                "username", "samruddhi",
                "password", "secretPass123"
        ), request);
        assertEquals(HttpStatus.OK, loginRes.getStatusCode());
    }

    @Test
    public void testResetPasswordAndLogin() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        // Reset password for developer
        ResponseEntity<?> resetRes = authController.resetPassword(Map.of(
                "username", "developer",
                "newPassword", "newDevPass999"
        ), request);
        assertEquals(HttpStatus.OK, resetRes.getStatusCode());

        // Old password should fail
        ResponseEntity<?> oldLoginRes = authController.login(Map.of(
                "username", "developer",
                "password", "dev123"
        ), request);
        assertEquals(HttpStatus.UNAUTHORIZED, oldLoginRes.getStatusCode());

        // New password must succeed
        ResponseEntity<?> newLoginRes = authController.login(Map.of(
                "username", "developer",
                "password", "newDevPass999"
        ), request);
        assertEquals(HttpStatus.OK, newLoginRes.getStatusCode());
    }

    @Test
    public void testForgotPasswordAndResetWithToken() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        // 1. Forgot password request
        ResponseEntity<?> forgotRes = authController.forgotPassword(Map.of(
                "email", "developer@orchestrix.io"
        ));
        assertEquals(HttpStatus.OK, forgotRes.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> forgotBody = (Map<String, Object>) forgotRes.getBody();
        assertNotNull(forgotBody);
        assertEquals("If an account exists for this email, password reset instructions have been sent.", forgotBody.get("message"));
        String resetToken = (String) forgotBody.get("resetToken");
        assertNotNull(resetToken);

        // 2. Reset password using the 15-minute token
        ResponseEntity<?> resetRes = authController.resetPassword(Map.of(
                "token", resetToken,
                "newPassword", "tokenDevPass888"
        ), request);
        assertEquals(HttpStatus.OK, resetRes.getStatusCode());

        // 3. Login with the newly set password
        ResponseEntity<?> loginRes = authController.login(Map.of(
                "username", "developer",
                "password", "tokenDevPass888"
        ), request);
        assertEquals(HttpStatus.OK, loginRes.getStatusCode());

        // 4. Token cannot be reused (single-use token verification)
        ResponseEntity<?> reuseRes = authController.resetPassword(Map.of(
                "token", resetToken,
                "newPassword", "anotherPassword123"
        ), request);
        assertEquals(HttpStatus.BAD_REQUEST, reuseRes.getStatusCode());
    }
}
