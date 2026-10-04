package com.pipeline.pipelineorchestrator.orchestrator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;

public class PipelineOrchestrator {

    private final StepExecutor stepExecutor;

    public PipelineOrchestrator() {
        this.stepExecutor = new StepExecutor();
    }

    public PipelineExecution execute(PipelineExecution execution, List<PipelineStep> steps) {
        int totalExpected = execution.getTotalStages() > 0 ? execution.getTotalStages() : steps.size();
        return execute(execution, steps, totalExpected);
    }

    public PipelineExecution execute(PipelineExecution execution, List<PipelineStep> steps, int totalExpectedSteps) {

        PipelineContext context = new PipelineContext(
                execution.getPipelineRequest(),
                execution
        );

        if (execution.getStartedAt() == null) {
            execution.setStartedAt(LocalDateTime.now());
        }

        List<PipelineStepResult> results = execution.getSteps() != null ? new ArrayList<>(execution.getSteps()) : new ArrayList<>();
        int existingCount = results.size();
        int additionalSteps = steps.size();

        for (int i = 0; i < additionalSteps; i++) {
            PipelineStep step = steps.get(i);
            int overallIndex = existingCount + i;
            execution.setCurrentStepIndex(overallIndex);

            int progress = (int) Math.round(((double) overallIndex / totalExpectedSteps) * 100);
            execution.setProgressPercentage(progress);

            long stepStart = System.currentTimeMillis();
            // Realistic simulation delay for live stage execution (0.8s to 1.4s)
            long stageDelay = 850 + (long) ((overallIndex * 190) % 550);
            pause(stageDelay);

            PipelineStepResult result = stepExecutor.execute(step, context);
            long stepElapsed = System.currentTimeMillis() - stepStart;
            result.setDurationMs(stepElapsed);
            results.add(result);
            execution.setSteps(new ArrayList<>(results));

            if (result.getStatus() == ExecutionStatus.FAILED) {
                execution.setStatus(ExecutionStatus.FAILED);
                execution.setCompletedAt(LocalDateTime.now());
                long totalMs = java.time.Duration.between(execution.getStartedAt(), execution.getCompletedAt()).toMillis();
                execution.setTotalDurationMs(totalMs);
                execution.addLog("ERROR", "Orchestrator", "Pipeline execution halted due to failure in step: " + result.getStepName());
                return execution;
            }
        }

        // Check if all expected stages for this pipeline are complete
        if (results.size() >= totalExpectedSteps) {
            execution.setCurrentStepIndex(totalExpectedSteps);
            execution.setProgressPercentage(100);
            execution.setCurrentStepName("Completed");
            execution.setStatus(ExecutionStatus.SUCCESS);
            execution.setCompletedAt(LocalDateTime.now());

            long totalMs = java.time.Duration.between(execution.getStartedAt(), execution.getCompletedAt()).toMillis();
            execution.setTotalDurationMs(totalMs);

            execution.addLog("SUCCESS", "Orchestrator", "Pipeline finished successfully in " + String.format("%.2f", totalMs / 1000.0) + "s. All " + totalExpectedSteps + " stages completed.");
        }

        return execution;
    }

    private void pause(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}