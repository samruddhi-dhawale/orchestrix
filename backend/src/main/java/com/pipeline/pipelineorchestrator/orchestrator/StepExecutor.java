package com.pipeline.pipelineorchestrator.orchestrator;

import com.pipeline.pipelineorchestrator.model.PipelineStepResult;

public class StepExecutor {

    public PipelineStepResult execute(
            PipelineStep step,
            PipelineContext context) {

        return step.execute(context);
    }
}