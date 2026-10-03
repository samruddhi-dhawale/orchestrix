package com.pipeline.pipelineorchestrator.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class PipelineExecution {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");

    private String executionId;
    private PipelineRequest pipelineRequest;
    private ExecutionStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private long totalDurationMs;
    private int progressPercentage;
    private int currentStepIndex;
    private String currentStepName;
    private List<PipelineStepResult> steps;
    private List<ExecutionLogLine> logs;
    private ArtifactInfo artifact;
    private AzureDeploymentInfo deployment;
    private int totalStages;
    private List<String> stageNames = new ArrayList<>();

    public PipelineExecution() {
        this.steps = new ArrayList<>();
        this.logs = new CopyOnWriteArrayList<>();
    }

    public PipelineExecution(String executionId, PipelineRequest pipelineRequest) {
        this.executionId = executionId;
        this.pipelineRequest = pipelineRequest;
        this.status = ExecutionStatus.PENDING;
        this.steps = new ArrayList<>();
        this.logs = new CopyOnWriteArrayList<>();
        this.progressPercentage = 0;
        this.currentStepIndex = 0;
        this.currentStepName = "Initializing";
    }

    public void addLog(String level, String step, String message) {
        String timestamp = LocalDateTime.now().format(TIME_FORMATTER);
        this.logs.add(new ExecutionLogLine(timestamp, level, step, message));
    }

    public String getExecutionId() {
        return executionId;
    }

    public void setExecutionId(String executionId) {
        this.executionId = executionId;
    }

    public PipelineRequest getPipelineRequest() {
        return pipelineRequest;
    }

    public void setPipelineRequest(PipelineRequest pipelineRequest) {
        this.pipelineRequest = pipelineRequest;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public long getTotalDurationMs() {
        return totalDurationMs;
    }

    public void setTotalDurationMs(long totalDurationMs) {
        this.totalDurationMs = totalDurationMs;
    }

    public int getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(int progressPercentage) {
        this.progressPercentage = progressPercentage;
    }

    public int getCurrentStepIndex() {
        return currentStepIndex;
    }

    public void setCurrentStepIndex(int currentStepIndex) {
        this.currentStepIndex = currentStepIndex;
    }

    public String getCurrentStepName() {
        return currentStepName;
    }

    public void setCurrentStepName(String currentStepName) {
        this.currentStepName = currentStepName;
    }

    public List<PipelineStepResult> getSteps() {
        return steps;
    }

    public void setSteps(List<PipelineStepResult> steps) {
        this.steps = steps;
    }

    public List<ExecutionLogLine> getLogs() {
        return logs;
    }

    public void setLogs(List<ExecutionLogLine> logs) {
        this.logs = logs;
    }

    public ArtifactInfo getArtifact() {
        return artifact;
    }

    public void setArtifact(ArtifactInfo artifact) {
        this.artifact = artifact;
    }

    public AzureDeploymentInfo getDeployment() {
        return deployment;
    }

    public void setDeployment(AzureDeploymentInfo deployment) {
        this.deployment = deployment;
    }

    public int getTotalStages() {
        return totalStages;
    }

    public void setTotalStages(int totalStages) {
        this.totalStages = totalStages;
    }

    public List<String> getStageNames() {
        return stageNames;
    }

    public void setStageNames(List<String> stageNames) {
        this.stageNames = stageNames;
    }
}