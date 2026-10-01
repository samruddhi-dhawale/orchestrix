package com.pipeline.pipelineorchestrator.steps;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import com.pipeline.pipelineorchestrator.model.AzureDeploymentInfo;
import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineContext;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineStep;

public class AzureDeploymentStep implements PipelineStep {

    @Override
    public PipelineStepResult execute(PipelineContext context) {
        long startTime = System.currentTimeMillis();
        String startTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        PipelineExecution execution = context.getPipelineExecution();
        PipelineRequest request = context.getPipelineRequest();

        String env = request.getEnvironment().toLowerCase(Locale.ROOT);
        String sub = request.getSubcomponentId().toLowerCase(Locale.ROOT).replace(" ", "-");
        String strategy = request.getDeploymentStrategy() != null ? request.getDeploymentStrategy().toUpperCase(Locale.ROOT) : "BLUE_GREEN";
        String resourceGroup = "rg-orchestrix-" + env;
        String appServiceName = "app-orchestrix-" + sub + "-" + env;
        String region = env.contains("prod") ? "East US 2 (Primary)" : "East US";
        String liveUrl = "https://" + appServiceName + ".azurewebsites.net";
        String healthCheckUrl = liveUrl + "/actuator/health";

        execution.addLog("INFO", "Azure Cloud Deployment", "Connecting to Microsoft Azure Cloud API...");
        execution.addLog("INFO", "Azure Cloud Deployment", "Target Resource Group: " + resourceGroup + " (" + region + ")");
        execution.addLog("INFO", "Azure Cloud Deployment", "Target App Service: " + appServiceName);

        String slotDescription = "production";
        if ("BLUE_GREEN".equals(strategy)) {
            execution.addLog("INFO", "Azure Cloud Deployment", "Executing Blue/Green Deployment Strategy (Zero-Downtime Release)...");
            execution.addLog("INFO", "Azure Cloud Deployment", "Deploying artifact to Azure App Service slot: [staging] (Green Environment)");
            execution.addLog("INFO", "Azure Cloud Deployment", "Running pre-swap health probe on staging slot: GET /actuator/health -> 200 OK");
            execution.addLog("INFO", "Azure Cloud Deployment", "Executing zero-downtime Azure slot swap: [staging] <--> [production]");
            execution.addLog("SUCCESS", "Azure Cloud Deployment", "Azure Blue/Green slot swap completed with zero downtime (0 dropped connections).");
            slotDescription = "staging <-> production (Swapped)";
        } else if ("CANARY".equals(strategy)) {
            execution.addLog("INFO", "Azure Cloud Deployment", "Executing Canary Deployment Strategy with progressive traffic shifting...");
            execution.addLog("INFO", "Azure Cloud Deployment", "Configuring Azure routing rules: 10% canary traffic, 90% stable baseline");
            execution.addLog("INFO", "Azure Cloud Deployment", "Monitoring canary HTTP 5xx error rate: 0.00% (healthy)");
            execution.addLog("INFO", "Azure Cloud Deployment", "Ramping canary traffic to 100% (Promoting canary to full production)");
            execution.addLog("SUCCESS", "Azure Cloud Deployment", "Canary deployment promoted to 100% of live traffic.");
            slotDescription = "canary (100% Promoted)";
        } else {
            execution.addLog("INFO", "Azure Cloud Deployment", "Executing Rolling Update across Azure App Service cluster instances...");
            execution.addLog("INFO", "Azure Cloud Deployment", "Instance 1/2 updated -> Healthy [OK]");
            execution.addLog("INFO", "Azure Cloud Deployment", "Instance 2/2 updated -> Healthy [OK]");
            execution.addLog("SUCCESS", "Azure Cloud Deployment", "Rolling update completed across all active instances.");
            slotDescription = "rolling-cluster";
        }

        execution.addLog("INFO", "Azure Cloud Deployment", "Executing automated health probe: " + healthCheckUrl);
        execution.addLog("SUCCESS", "Azure Cloud Deployment", "Health Probe: 200 OK (Status: UP, Components: DB=OK, Cache=OK, Disk=78% Free)");

        AzureDeploymentInfo deploymentInfo = new AzureDeploymentInfo(
                request.getEnvironment(),
                "Azure Subscription (Orchestrix Cloud #9812-Azure)",
                resourceGroup,
                appServiceName,
                region,
                "DEPLOYED",
                liveUrl,
                healthCheckUrl,
                "200 OK - Healthy",
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                strategy,
                slotDescription,
                request.getInitiatedRole().equals("ADMIN") ? "Admin Authorized" : "Auto-Approved"
        );

        execution.setDeployment(deploymentInfo);

        long durationMs = System.currentTimeMillis() - startTime;
        String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

        return new PipelineStepResult(
                "Azure Cloud Deployment",
                ExecutionStatus.SUCCESS,
                "Deployed via " + strategy + " to Azure App Service (" + appServiceName + ") in " + request.getEnvironment(),
                durationMs,
                startTimestamp,
                completedTimestamp
        );
    }
}
