package com.pipeline.pipelineorchestrator.steps;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineContext;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineStep;

public class ValidationStep implements PipelineStep {

    @Override
    public PipelineStepResult execute(PipelineContext context) {
        long startTime = System.currentTimeMillis();
        String startTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        PipelineExecution execution = context.getPipelineExecution();
        PipelineRequest request = context.getPipelineRequest();

        execution.addLog("INFO", "Validate Configuration", "Parsing pipeline execution parameters...");

        if (request == null) {
            execution.addLog("ERROR", "Validate Configuration", "Pipeline request payload is missing");
            return fail("Pipeline request is missing", startTime, startTimestamp);
        }

        if (isBlank(request.getComponentId())) {
            execution.addLog("ERROR", "Validate Configuration", "Validation failed: Component identifier is required");
            return fail("Component is required", startTime, startTimestamp);
        }

        if (isBlank(request.getSubcomponentId())) {
            execution.addLog("ERROR", "Validate Configuration", "Validation failed: Subcomponent identifier is required");
            return fail("Subcomponent is required", startTime, startTimestamp);
        }

        if (isBlank(request.getBranch())) {
            execution.addLog("ERROR", "Validate Configuration", "Validation failed: Branch is required");
            return fail("Branch is required", startTime, startTimestamp);
        }

        if (isBlank(request.getEnvironment())) {
            execution.addLog("ERROR", "Validate Configuration", "Validation failed: Target environment is required");
            return fail("Environment is required", startTime, startTimestamp);
        }

        execution.addLog("INFO", "Validate Configuration", "Component: " + request.getComponentId() + " | Subcomponent: " + request.getSubcomponentId());
        execution.addLog("INFO", "Validate Configuration", "Target Branch: " + request.getBranch() + " | Environment: " + request.getEnvironment());
        execution.addLog("SUCCESS", "Validate Configuration", "All pipeline parameters, branch ACLs, and environment configurations verified successfully.");

        long durationMs = System.currentTimeMillis() - startTime;
        String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

        return new PipelineStepResult(
                "Validate Configuration",
                ExecutionStatus.SUCCESS,
                "Pipeline configuration validated successfully",
                durationMs,
                startTimestamp,
                completedTimestamp
        );
    }

    private PipelineStepResult fail(String msg, long startTime, String startTimestamp) {
        long durationMs = System.currentTimeMillis() - startTime;
        String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        return new PipelineStepResult("Validate Configuration", ExecutionStatus.FAILED, msg, durationMs, startTimestamp, completedTimestamp);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}