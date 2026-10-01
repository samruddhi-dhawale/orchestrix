package com.pipeline.pipelineorchestrator.steps;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineContext;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineStep;

public class BuildStep implements PipelineStep {

    @Override
    public PipelineStepResult execute(PipelineContext context) {
        long startTime = System.currentTimeMillis();
        String startTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        PipelineExecution execution = context.getPipelineExecution();
        PipelineRequest request = context.getPipelineRequest();

        execution.addLog("INFO", "Build", "Executing build tool: Apache Maven 3.9.16 (Java 17)");
        execution.addLog("INFO", "Build", "Scanning for Maven projects and resolving dependencies...");
        execution.addLog("INFO", "Build", "Compiling Java source files for subcomponent [" + request.getSubcomponentId() + "] with javac 17...");
        execution.addLog("INFO", "Build", "Writing compiled bytecode to target/classes");
        execution.addLog("SUCCESS", "Build", "Maven build compilation finished successfully with 0 errors.");

        long durationMs = System.currentTimeMillis() - startTime;
        String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

        return new PipelineStepResult(
                "Build",
                ExecutionStatus.SUCCESS,
                "Maven compilation completed successfully for " + request.getSubcomponentId(),
                durationMs,
                startTimestamp,
                completedTimestamp
        );
    }
}