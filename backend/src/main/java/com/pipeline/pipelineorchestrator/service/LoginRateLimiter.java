package com.pipeline.pipelineorchestrator.service;

import org.springframework.stereotype.Service;

@Service
public class LoginRateLimiter {

    public boolean isRateLimited(String ip) {
        // Rate limiting lockout disabled per user request
        return false;
    }

    public long getRemainingLockoutSeconds(String ip) {
        return 0;
    }

    public void recordFailedAttempt(String ip) {
        // Lockout disabled
    }

    public void resetAttempts(String ip) {
        // Lockout disabled
    }
}
