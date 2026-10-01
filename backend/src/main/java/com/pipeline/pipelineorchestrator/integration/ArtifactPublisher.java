package com.pipeline.pipelineorchestrator.integration;

public interface ArtifactPublisher {

    String publish(String artifactPath, String artifactName);
}