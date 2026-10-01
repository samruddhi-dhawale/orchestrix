package com.pipeline.pipelineorchestrator.orchestrator;

import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;

public class PipelineContext {

    private final PipelineRequest pipelineRequest;
    private final PipelineExecution pipelineExecution;

    public PipelineContext(
            PipelineRequest pipelineRequest,
            PipelineExecution pipelineExecution) {

        this.pipelineRequest = pipelineRequest;
        this.pipelineExecution = pipelineExecution;
    }

    public PipelineRequest getPipelineRequest() {
        return pipelineRequest;
    }

    public PipelineExecution getPipelineExecution() {
        return pipelineExecution;
    }
}