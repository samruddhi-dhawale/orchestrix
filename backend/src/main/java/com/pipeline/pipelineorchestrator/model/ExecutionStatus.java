package com.pipeline.pipelineorchestrator.model;

public enum ExecutionStatus {

    PENDING,
    RUNNING,
    WAITING_FOR_APPROVAL,
    SUCCESS,
    FAILED,
    REJECTED
}