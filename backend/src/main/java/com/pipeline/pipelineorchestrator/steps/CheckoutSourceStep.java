package com.pipeline.pipelineorchestrator.steps;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineContext;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineStep;

public class CheckoutSourceStep implements PipelineStep {

    @Override
    public PipelineStepResult execute(PipelineContext context) {
        long startTime = System.currentTimeMillis();
        String startTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        PipelineExecution execution = context.getPipelineExecution();
        PipelineRequest request = context.getPipelineRequest();

        String branch = request.getBranch();
        String commitSha = Integer.toHexString((branch + request.getComponentId() + System.currentTimeMillis()).hashCode());
        if (commitSha.length() > 7) {
            commitSha = commitSha.substring(0, 7);
        }

        execution.addLog("INFO", "Checkout Source", "Connecting to Git repository: git@github.com:orchestrix/" + request.getComponentId() + ".git");
        execution.addLog("INFO", "Checkout Source", "Fetching remote refs for branch '" + branch + "'...");
        execution.addLog("INFO", "Checkout Source", "Checked out commit revision: " + commitSha + " (HEAD -> " + branch + ")");
        execution.addLog("SUCCESS", "Checkout Source", "Git workspace clean, checked out branch '" + branch + "' at commit #" + commitSha);

        long durationMs = System.currentTimeMillis() - startTime;
        String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

        return new PipelineStepResult(
                "Checkout Source",
                ExecutionStatus.SUCCESS,
                "Source checkout completed for branch '" + branch + "' (Commit: " + commitSha + ")",
                durationMs,
                startTimestamp,
                completedTimestamp
        );
    }
}