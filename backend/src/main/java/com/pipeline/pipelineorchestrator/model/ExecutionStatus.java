package com.pipeline.pipelineorchestrator.model;

public enum ExecutionStatus {

    QUEUED,
    PENDING,
    RUNNING,
    WAITING_FOR_APPROVAL,
    SUCCESS,
    COMPLETED,
    FAILED,
    SKIPPED,
    CANCELLED,
    REJECTED
}