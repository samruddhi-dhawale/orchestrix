package com.pipeline.pipelineorchestrator.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pipeline.pipelineorchestrator.model.ExecutionLogLine;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;
import com.pipeline.pipelineorchestrator.service.ExecutionService;

import com.pipeline.pipelineorchestrator.validator.PipelineRequestValidator;

@RestController
@RequestMapping("/api/pipelines")
public class PipelineController {

    private final ExecutionService executionService;
    private final PipelineRequestValidator validator;

    public PipelineController(ExecutionService executionService, PipelineRequestValidator validator) {
        this.executionService = executionService;
        this.validator = validator;
    }

    @PostMapping
    public ResponseEntity<?> createPipeline(@RequestBody PipelineRequest request) {
        try {
            validator.validate(request);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", 400,
                    "error", "Bad Request",
                    "message", e.getMessage()
            ));
        }
        PipelineExecution execution = executionService.executePipeline(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(execution);
    }

    @GetMapping
    public ResponseEntity<List<PipelineExecution>> listExecutions() {
        return ResponseEntity.ok(executionService.getAllExecutions());
    }

    @GetMapping("/{executionId}")
    public ResponseEntity<PipelineExecution> getExecution(@PathVariable String executionId) {
        PipelineExecution execution = executionService.getExecution(executionId);
        if (execution == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(execution);
    }

    @GetMapping("/{executionId}/logs")
    public ResponseEntity<List<ExecutionLogLine>> getExecutionLogs(@PathVariable String executionId) {
        List<ExecutionLogLine> logs = executionService.getExecutionLogs(executionId);
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/{executionId}/approve")
    public ResponseEntity<PipelineExecution> approveExecution(
            @PathVariable String executionId,
            @RequestBody(required = false) Map<String, String> body) {
        String adminUser = body != null ? body.getOrDefault("adminUser", "admin") : "admin";
        PipelineExecution execution = executionService.approveExecution(executionId, adminUser);
        return ResponseEntity.ok(execution);
    }

    @PostMapping("/{executionId}/reject")
    public ResponseEntity<PipelineExecution> rejectExecution(
            @PathVariable String executionId,
            @RequestBody(required = false) Map<String, String> body) {
        String adminUser = body != null ? body.getOrDefault("adminUser", "admin") : "admin";
        String reason = body != null ? body.getOrDefault("reason", "Rejected by policy") : "Rejected by policy";
        PipelineExecution execution = executionService.rejectExecution(executionId, adminUser, reason);
        return ResponseEntity.ok(execution);
    }

    @GetMapping("/approvals/pending")
    public ResponseEntity<List<PipelineExecution>> getPendingApprovals() {
        return ResponseEntity.ok(executionService.getPendingApprovals());
    }

    @GetMapping("/status/overview")
    public ResponseEntity<Map<String, Object>> getSystemOverview() {
        List<PipelineExecution> all = executionService.getAllExecutions();
        long total = all.size();
        long success = all.stream().filter(e -> "SUCCESS".equals(String.valueOf(e.getStatus()))).count();
        long failed = all.stream().filter(e -> "FAILED".equals(String.valueOf(e.getStatus()))).count();
        long running = all.stream().filter(e -> "RUNNING".equals(String.valueOf(e.getStatus()))).count();
        long pendingApproval = all.stream().filter(e -> "WAITING_FOR_APPROVAL".equals(String.valueOf(e.getStatus()))).count();

        return ResponseEntity.ok(Map.of(
                "totalExecutions", total,
                "successfulExecutions", success,
                "failedExecutions", failed,
                "runningExecutions", running,
                "pendingApprovalExecutions", pendingApproval,
                "platform", "Orchestrix DevSecOps CI/CD Orchestration Platform",
                "jfrogStatus", "CONNECTED (libs-release-local)",
                "azureStatus", "CONNECTED (East US / East US 2)",
                "databaseStatus", "IN-MEMORY (Stateless Concurrent Storage)"
        ));
    }
}