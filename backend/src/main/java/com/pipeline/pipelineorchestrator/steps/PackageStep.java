package com.pipeline.pipelineorchestrator.steps;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import com.pipeline.pipelineorchestrator.model.ArtifactInfo;
import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineContext;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineStep;

public class PackageStep implements PipelineStep {

    @Override
    public PipelineStepResult execute(PipelineContext context) {
        long startTime = System.currentTimeMillis();
        String startTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        PipelineExecution execution = context.getPipelineExecution();
        PipelineRequest request = context.getPipelineRequest();

        String sub = request.getSubcomponentId().toLowerCase(Locale.ROOT).replace(" ", "-");
        String packaging = "JAR";
        if (sub.contains("war") || sub.contains("web") || sub.contains("portal")) {
            packaging = "WAR";
        } else if (sub.contains("ear") || sub.contains("enterprise")) {
            packaging = "EAR";
        }

        String artifactFile = "orchestrix-" + sub + "-1.0.0." + packaging.toLowerCase(Locale.ROOT);
        String sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852" + Math.abs(artifactFile.hashCode() % 1000);
        String size = packaging.equals("EAR") ? "78.4 MB" : (packaging.equals("WAR") ? "48.2 MB" : "32.6 MB");
        String repoPath = "https://jfrog.orchestrix.io/artifactory/libs-release-local/com/orchestrix/" + sub + "/1.0.0/" + artifactFile;

        execution.addLog("INFO", "Package", "Executing Maven packaging plugin (packaging type: " + packaging + ")...");
        execution.addLog("INFO", "Package", "Building deployable package: target/" + artifactFile);
        execution.addLog("INFO", "Package", "Archive size: " + size + " | Calculating SHA-256 digest: " + sha256);
        execution.addLog("SUCCESS", "Package", "Successfully packaged " + packaging + " archive: " + artifactFile);

        ArtifactInfo artifact = new ArtifactInfo(
                artifactFile,
                packaging,
                "1.0.0",
                size,
                sha256,
                "libs-release-local",
                repoPath,
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
        );
        execution.setArtifact(artifact);

        long durationMs = System.currentTimeMillis() - startTime;
        String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

        return new PipelineStepResult(
                "Package",
                ExecutionStatus.SUCCESS,
                "Packaged " + packaging + " artifact (" + artifactFile + ", " + size + ")",
                durationMs,
                startTimestamp,
                completedTimestamp
        );
    }
}
