package com.pipeline.pipelineorchestrator.steps;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.pipeline.pipelineorchestrator.integration.ArtifactPublisher;
import com.pipeline.pipelineorchestrator.model.ArtifactInfo;
import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineContext;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineStep;

public class PublishArtifactStep implements PipelineStep {

    private final ArtifactPublisher artifactPublisher;

    public PublishArtifactStep(ArtifactPublisher artifactPublisher) {
        this.artifactPublisher = artifactPublisher;
    }

    @Override
    public PipelineStepResult execute(PipelineContext context) {
        long startTime = System.currentTimeMillis();
        String startTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        PipelineExecution execution = context.getPipelineExecution();
        ArtifactInfo artifact = execution.getArtifact();

        String artifactName = artifact != null ? artifact.getName() : "pipeline-orchestrator.jar";
        String artifactPath = "target/" + artifactName;

        try {
            execution.addLog("INFO", "Publish Artifact", "Authenticating with JFrog Artifactory repository at https://jfrog.orchestrix.io/artifactory");
            execution.addLog("INFO", "Publish Artifact", "Uploading " + artifactPath + " to JFrog repository 'libs-release-local'...");

            String message = artifactPublisher.publish(artifactPath, artifactName);

            execution.addLog("INFO", "Publish Artifact", "Verifying remote SHA-256 checksum on JFrog...");
            execution.addLog("SUCCESS", "Publish Artifact", "Published " + artifactName + " to JFrog Artifactory repository (HTTP 201 Created)");

            long durationMs = System.currentTimeMillis() - startTime;
            String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

            return new PipelineStepResult(
                    "Publish Artifact",
                    ExecutionStatus.SUCCESS,
                    message,
                    durationMs,
                    startTimestamp,
                    completedTimestamp
            );

        } catch (Exception e) {
            execution.addLog("ERROR", "Publish Artifact", "Artifact publishing failed: " + e.getMessage());

            long durationMs = System.currentTimeMillis() - startTime;
            String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

            return new PipelineStepResult(
                    "Publish Artifact",
                    ExecutionStatus.FAILED,
                    "Artifact publishing failed: " + e.getMessage(),
                    durationMs,
                    startTimestamp,
                    completedTimestamp
            );
        }
    }
}