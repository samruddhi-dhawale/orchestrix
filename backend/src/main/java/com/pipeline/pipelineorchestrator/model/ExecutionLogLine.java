package com.pipeline.pipelineorchestrator.model;

public class ExecutionLogLine {

    private String timestamp;
    private String level; // INFO, SUCCESS, WARN, ERROR
    private String step;
    private String message;

    public ExecutionLogLine() {
    }

    public ExecutionLogLine(String timestamp, String level, String step, String message) {
        this.timestamp = timestamp;
        this.level = level;
        this.step = step;
        this.message = message;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getStep() {
        return step;
    }

    public void setStep(String step) {
        this.step = step;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
