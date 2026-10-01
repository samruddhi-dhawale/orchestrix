package com.pipeline.pipelineorchestrator.integration;

import org.springframework.stereotype.Component;

@Component
public class JFrogArtifactPublisher implements ArtifactPublisher {

    @Override
    public String publish(String artifactPath, String artifactName) {

        if (artifactPath == null || artifactPath.isBlank()) {
            throw new IllegalArgumentException("Artifact path is required");
        }

        if (artifactName == null || artifactName.isBlank()) {
            throw new IllegalArgumentException("Artifact name is required");
        }

        return "Artifact successfully published to JFrog Artifactory: " + artifactName;
    }
}