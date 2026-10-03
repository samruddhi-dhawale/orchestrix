package com.pipeline.pipelineorchestrator.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class LoginRateLimiter {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    private static class AttemptRecord {
        int count;
        long lastAttemptTime;

        AttemptRecord(int count, long lastAttemptTime) {
            this.count = count;
            this.lastAttemptTime = lastAttemptTime;
        }
    }

    private final Map<String, AttemptRecord> ipAttempts = new ConcurrentHashMap<>();

    public boolean isRateLimited(String ip) {
        if (ip == null) return false;
        AttemptRecord record = ipAttempts.get(ip);
        if (record == null) return false;

        long now = System.currentTimeMillis();
        if (now - record.lastAttemptTime > LOCKOUT_DURATION_MS) {
            // Window expired, automatically clear
            ipAttempts.remove(ip);
            return false;
        }

        return record.count >= MAX_FAILED_ATTEMPTS;
    }

    public long getRemainingLockoutSeconds(String ip) {
        if (ip == null) return 0;
        AttemptRecord record = ipAttempts.get(ip);
        if (record == null) return 0;

        long elapsed = System.currentTimeMillis() - record.lastAttemptTime;
        if (elapsed > LOCKOUT_DURATION_MS) {
            return 0;
        }
        return (LOCKOUT_DURATION_MS - elapsed) / 1000;
    }

    public void recordFailedAttempt(String ip) {
        if (ip == null) return;
        long now = System.currentTimeMillis();
        ipAttempts.compute(ip, (key, existing) -> {
            if (existing == null || (now - existing.lastAttemptTime > LOCKOUT_DURATION_MS)) {
                return new AttemptRecord(1, now);
            } else {
                existing.count++;
                existing.lastAttemptTime = now;
                return existing;
            }
        });
    }

    public void resetAttempts(String ip) {
        if (ip != null) {
            ipAttempts.remove(ip);
        }
    }
}
