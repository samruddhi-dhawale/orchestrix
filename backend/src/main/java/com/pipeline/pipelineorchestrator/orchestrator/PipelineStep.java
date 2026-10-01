package com.pipeline.pipelineorchestrator.orchestrator;

import com.pipeline.pipelineorchestrator.model.PipelineStepResult;

public interface PipelineStep {

    PipelineStepResult execute(PipelineContext context);

}