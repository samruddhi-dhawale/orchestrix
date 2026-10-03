package com.pipeline.pipelineorchestrator.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.stereotype.Service;

import com.pipeline.pipelineorchestrator.integration.ArtifactPublisher;
import com.pipeline.pipelineorchestrator.model.ArtifactInfo;
import com.pipeline.pipelineorchestrator.model.AzureDeploymentInfo;
import com.pipeline.pipelineorchestrator.model.ExecutionLogLine;
import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineOrchestrator;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineStep;
import com.pipeline.pipelineorchestrator.steps.AzureDeploymentStep;
import com.pipeline.pipelineorchestrator.steps.BuildStep;
import com.pipeline.pipelineorchestrator.steps.CheckoutSourceStep;
import com.pipeline.pipelineorchestrator.steps.PackageStep;
import com.pipeline.pipelineorchestrator.steps.PublishArtifactStep;
import com.pipeline.pipelineorchestrator.steps.SecurityScanStep;
import com.pipeline.pipelineorchestrator.steps.TestStep;

import jakarta.annotation.PostConstruct;

@Service
public class ExecutionService {

    private final PipelineOrchestrator pipelineOrchestrator;
    private final ArtifactPublisher artifactPublisher;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    private final Map<String, PipelineExecution> executions = new ConcurrentHashMap<>();

    public ExecutionService(ArtifactPublisher artifactPublisher) {
        this.pipelineOrchestrator = new PipelineOrchestrator();
        this.artifactPublisher = artifactPublisher;
    }

    @PostConstruct
    public void initSampleExecutions() {
        // Starts clean with 0 executions. Only increments when the user launches a pipeline!
    }

    public PipelineExecution executePipeline(PipelineRequest request) {

        String executionId = UUID.randomUUID().toString();

        PipelineExecution execution = new PipelineExecution(executionId, request);
        execution.setStatus(ExecutionStatus.RUNNING);
        execution.setStartedAt(LocalDateTime.now());
        execution.addLog("INFO", "Init", "Pipeline request accepted. Strategy: " + request.getDeploymentStrategy() + " | Triggered by: " + request.getInitiatedBy());

        boolean isProduction = "production".equalsIgnoreCase(request.getEnvironment());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(request.getInitiatedRole());
        boolean needsApproval = isProduction && !isAdmin;

        int totalStages = needsApproval ? 8 : 7;
        List<String> stageNames = needsApproval
                ? List.of(
                        "Checkout Source",
                        "Build",
                        "Test",
                        "Security & Vulnerability Scan",
                        "Package",
                        "Publish Artifact",
                        "Production Approval",
                        "Azure Cloud Deployment"
                )
                : List.of(
                        "Checkout Source",
                        "Build",
                        "Test",
                        "Security & Vulnerability Scan",
                        "Package",
                        "Publish Artifact",
                        "Azure Cloud Deployment"
                );

        execution.setTotalStages(totalStages);
        execution.setStageNames(stageNames);

        executions.put(execution.getExecutionId(), execution);

        // Core automated steps (Beginning directly at Checkout Source)
        List<PipelineStep> preApprovalSteps = List.of(
                new CheckoutSourceStep(),
                new BuildStep(),
                new TestStep(),
                new SecurityScanStep(),
                new PackageStep(),
                new PublishArtifactStep(artifactPublisher)
        );

        CompletableFuture.runAsync(() -> {
            try {
                if (needsApproval) {
                    // Run steps 1 to 6 first with totalStages = 8
                    pipelineOrchestrator.execute(execution, preApprovalSteps, totalStages);

                    if (execution.getStatus() != ExecutionStatus.FAILED) {
                        // Pause for Administrator approval before Azure Cloud Deployment
                        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
                        PipelineStepResult approvalStep = new PipelineStepResult(
                                "Production Approval",
                                ExecutionStatus.WAITING_FOR_APPROVAL,
                                "Production release on hold. Awaiting Administrator authorization before Stage 8: Azure Cloud Deployment.",
                                0,
                                nowStr,
                                null
                        );
                        execution.getSteps().add(approvalStep);
                        execution.setStatus(ExecutionStatus.WAITING_FOR_APPROVAL);
                        execution.setCurrentStepIndex(6);
                        execution.setCurrentStepName("Production Approval");
                        execution.setProgressPercentage((int) Math.round((6.0 / totalStages) * 100)); // 75%
                        execution.addLog("WARN", "Production Approval", "⏸️ Production release paused at Stage 7: Production Approval. Awaiting Administrator sign-off before Stage 8: Azure Cloud Deployment.");
                    }
                } else {
                    // Run all 7 steps including Azure deployment with totalStages = 7
                    List<PipelineStep> allSteps = new ArrayList<>(preApprovalSteps);
                    allSteps.add(new AzureDeploymentStep());
                    pipelineOrchestrator.execute(execution, allSteps, totalStages);
                }
            } catch (Exception e) {
                execution.setStatus(ExecutionStatus.FAILED);
                execution.setCompletedAt(LocalDateTime.now());
                execution.addLog("ERROR", "Orchestrator", "Unexpected runtime error: " + e.getMessage());
            }
        }, executorService);

        return execution;
    }

    public PipelineExecution approveExecution(String executionId, String adminUser) {
        PipelineExecution execution = executions.get(executionId);
        if (execution == null || execution.getStatus() != ExecutionStatus.WAITING_FOR_APPROVAL) {
            return execution;
        }

        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        for (PipelineStepResult step : execution.getSteps()) {
            if ("Production Approval".equals(step.getStepName())) {
                step.setStatus(ExecutionStatus.SUCCESS);
                step.setMessage("Approved by Administrator [" + adminUser + "]. Authorizing Azure Cloud Deployment.");
                step.setCompletedAt(nowStr);
                break;
            }
        }

        execution.addLog("SUCCESS", "Production Approval", "👑 Administrator [" + adminUser + "] approved production release. Resuming Stage 8: Azure Cloud Deployment...");
        execution.setStatus(ExecutionStatus.RUNNING);
        execution.setCurrentStepIndex(7);
        execution.setCurrentStepName("Azure Cloud Deployment");
        execution.setProgressPercentage((int) Math.round((7.0 / 8.0) * 100)); // 88%

        CompletableFuture.runAsync(() -> {
            try {
                List<PipelineStep> deployStepList = List.of(new AzureDeploymentStep());
                pipelineOrchestrator.execute(execution, deployStepList, 8);
            } catch (Exception e) {
                execution.setStatus(ExecutionStatus.FAILED);
                execution.addLog("ERROR", "Azure Cloud Deployment", "Deployment failed post-approval: " + e.getMessage());
            }
        }, executorService);

        return execution;
    }

    public PipelineExecution rejectExecution(String executionId, String adminUser, String reason) {
        PipelineExecution execution = executions.get(executionId);
        if (execution == null || execution.getStatus() != ExecutionStatus.WAITING_FOR_APPROVAL) {
            return execution;
        }

        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        for (PipelineStepResult step : execution.getSteps()) {
            if ("Production Approval".equals(step.getStepName())) {
                step.setStatus(ExecutionStatus.REJECTED);
                step.setMessage("Rejected by Administrator [" + adminUser + "]. Reason: " + (reason != null ? reason : "Canceled by policy"));
                step.setCompletedAt(nowStr);
                break;
            }
        }

        execution.setStatus(ExecutionStatus.REJECTED);
        execution.setCompletedAt(LocalDateTime.now());
        long totalMs = java.time.Duration.between(execution.getStartedAt(), execution.getCompletedAt()).toMillis();
        execution.setTotalDurationMs(totalMs);
        execution.addLog("ERROR", "Production Approval", "❌ Production release was REJECTED by Administrator [" + adminUser + "]. Reason: " + (reason != null ? reason : "Canceled by policy"));
        return execution;
    }

    public List<PipelineExecution> getPendingApprovals() {
        return executions.values().stream()
                .filter(e -> e.getStatus() == ExecutionStatus.WAITING_FOR_APPROVAL)
                .toList();
    }

    public PipelineExecution getExecution(String executionId) {
        return executions.get(executionId);
    }

    public List<ExecutionLogLine> getExecutionLogs(String executionId) {
        PipelineExecution exec = executions.get(executionId);
        return exec != null ? exec.getLogs() : List.of();
    }

    public List<PipelineExecution> getAllExecutions() {
        return executions.values().stream()
                .sorted(Comparator.comparing(
                        PipelineExecution::getStartedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private void seedExecution(String id, String comp, String sub, String branch, String env,
                              ExecutionStatus status, LocalDateTime start, long durationMs, String strategy) {
        PipelineRequest req = new PipelineRequest(comp, sub, branch, env, strategy);
        PipelineExecution exec = new PipelineExecution(id, req);
        exec.setStatus(status);
        exec.setStartedAt(start);
        exec.setCompletedAt(start.plusNanos(durationMs * 1_000_000));
        exec.setTotalDurationMs(durationMs);
        exec.setTotalStages(7);
        exec.setStageNames(List.of(
                "Checkout Source",
                "Build",
                "Test",
                "Security & Vulnerability Scan",
                "Package",
                "Publish Artifact",
                "Azure Cloud Deployment"
        ));
        exec.setProgressPercentage(status == ExecutionStatus.SUCCESS ? 100 : 50);
        exec.setCurrentStepIndex(status == ExecutionStatus.SUCCESS ? 7 : 3);
        exec.setCurrentStepName(status == ExecutionStatus.SUCCESS ? "Completed" : "Test");

        List<PipelineStepResult> stepResults = new ArrayList<>();
        stepResults.add(new PipelineStepResult("Checkout Source", ExecutionStatus.SUCCESS, "Source checkout completed for branch '" + branch + "'", 1040, "10:00:01", "10:00:02"));
        stepResults.add(new PipelineStepResult("Build", ExecutionStatus.SUCCESS, "Maven compilation completed successfully", 1450, "10:00:02", "10:00:04"));

        if (status == ExecutionStatus.SUCCESS) {
            stepResults.add(new PipelineStepResult("Test", ExecutionStatus.SUCCESS, "All 64 tests passed (93.8% coverage)", 1180, "10:00:04", "10:00:05"));
            stepResults.add(new PipelineStepResult("Security & Vulnerability Scan", ExecutionStatus.SUCCESS, "DevSecOps Gate: PASSED (0 Critical CVEs, 0 Leaked Secrets)", 920, "10:00:05", "10:00:06"));
            stepResults.add(new PipelineStepResult("Package", ExecutionStatus.SUCCESS, "Packaged JAR artifact (orchestrix-" + sub + "-1.0.0.jar)", 980, "10:00:06", "10:00:07"));
            stepResults.add(new PipelineStepResult("Publish Artifact", ExecutionStatus.SUCCESS, "Artifact successfully published to JFrog Artifactory", 1120, "10:00:07", "10:00:08"));
            stepResults.add(new PipelineStepResult("Azure Cloud Deployment", ExecutionStatus.SUCCESS, "Deployed via " + strategy + " to Azure App Service in " + env, 1320, "10:00:08", "10:00:09"));

            exec.setArtifact(new ArtifactInfo(
                    "orchestrix-" + sub + "-1.0.0.jar",
                    "JAR",
                    "1.0.0",
                    "34.8 MB",
                    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    "libs-release-local",
                    "https://jfrog.orchestrix.io/artifactory/libs-release-local/com/orchestrix/" + sub + "/1.0.0/",
                    start.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
            ));

            exec.setDeployment(new AzureDeploymentInfo(
                    env,
                    "Azure Subscription (Orchestrix Cloud #9812-Azure)",
                    "rg-orchestrix-" + env,
                    "app-orchestrix-" + sub + "-" + env,
                    env.contains("prod") ? "East US 2" : "East US",
                    "DEPLOYED",
                    "https://app-orchestrix-" + sub + "-" + env + ".azurewebsites.net",
                    "https://app-orchestrix-" + sub + "-" + env + ".azurewebsites.net/actuator/health",
                    "200 OK - Healthy",
                    start.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    strategy,
                    "staging <-> production (Swapped)",
                    "Admin Sign-off"
            ));
        } else {
            stepResults.add(new PipelineStepResult("Test", ExecutionStatus.FAILED, "Automated test suite failed: 1 failure in PaymentEndpointTest", 1120, "10:00:04", "10:00:05"));
        }
        exec.setSteps(stepResults);

        exec.addLog("INFO", "Init", "Historical pipeline record loaded into memory.");
        exec.addLog("SUCCESS", "Orchestrator", status == ExecutionStatus.SUCCESS ? "Pipeline completed successfully." : "Pipeline terminated with errors.");

        executions.put(id, exec);
    }
}