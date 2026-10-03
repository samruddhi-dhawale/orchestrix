package com.pipeline.pipelineorchestrator.service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;
    private final Set<String> invalidatedTokens = ConcurrentHashMap.newKeySet();

    public JwtService(
            @Value("${orchestrix.jwt.secret:OrchestrixSecureJwtKeyForCiCdOrchestrationPlatform2026!}") String configuredSecret,
            @Value("${orchestrix.jwt.expiration-ms:86400000}") long expirationMs) {
        
        String envSecret = System.getenv("ORCHESTRIX_JWT_SECRET");
        String secret = (envSecret != null && !envSecret.isBlank()) ? envSecret.trim() : configuredSecret;

        // Ensure key is at least 256 bits (32 bytes) for HMAC-SHA256
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            keyBytes = padded;
        }

        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(String username, String role, String name) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("name", name)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims validateAndExtractClaims(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        if (invalidatedTokens.contains(token)) {
            return null;
        }
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public boolean isTokenValid(String token) {
        Claims claims = validateAndExtractClaims(token);
        if (claims == null) {
            return false;
        }
        Date expiration = claims.getExpiration();
        return expiration != null && expiration.after(new Date());
    }

    public void invalidateToken(String token) {
        if (token != null && !token.isBlank()) {
            invalidatedTokens.add(token.trim());
        }
    }

    public boolean isTokenInvalidated(String token) {
        return token != null && invalidatedTokens.contains(token.trim());
    }
}
