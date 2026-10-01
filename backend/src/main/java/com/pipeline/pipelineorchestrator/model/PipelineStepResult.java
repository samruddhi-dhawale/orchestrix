package com.pipeline.pipelineorchestrator.model;

public class PipelineStepResult {

    private String stepName;
    private ExecutionStatus status;
    private String message;
    private long durationMs;
    private String startedAt;
    private String completedAt;

    public PipelineStepResult() {
    }

    public PipelineStepResult(String stepName, ExecutionStatus status, String message) {
        this.stepName = stepName;
        this.status = status;
        this.message = message;
    }

    public PipelineStepResult(String stepName, ExecutionStatus status, String message,
                              long durationMs, String startedAt, String completedAt) {
        this.stepName = stepName;
        this.status = status;
        this.message = message;
        this.durationMs = durationMs;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
    }

    public String getStepName() {
        return stepName;
    }

    public void setStepName(String stepName) {
        this.stepName = stepName;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public long getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(long durationMs) {
        this.durationMs = durationMs;
    }

    public String getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(String startedAt) {
        this.startedAt = startedAt;
    }

    public String getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(String completedAt) {
        this.completedAt = completedAt;
    }
}