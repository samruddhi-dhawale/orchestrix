package com.pipeline.pipelineorchestrator.model;

public class PipelineRequest {

    private String componentId;
    private String subcomponentId;
    private String branch;
    private String environment;
    private String deploymentStrategy = "BLUE_GREEN"; // BLUE_GREEN, ROLLING, CANARY
    private String initiatedBy = "developer";
    private String initiatedRole = "DEVELOPER";

    public PipelineRequest() {
    }

    public PipelineRequest(String componentId, String subcomponentId, String branch, String environment) {
        this.componentId = componentId;
        this.subcomponentId = subcomponentId;
        this.branch = branch;
        this.environment = environment;
        this.deploymentStrategy = "BLUE_GREEN";
    }

    public PipelineRequest(String componentId, String subcomponentId, String branch, String environment, String deploymentStrategy) {
        this.componentId = componentId;
        this.subcomponentId = subcomponentId;
        this.branch = branch;
        this.environment = environment;
        this.deploymentStrategy = deploymentStrategy != null ? deploymentStrategy : "BLUE_GREEN";
    }

    public String getComponentId() {
        return componentId;
    }

    public void setComponentId(String componentId) {
        this.componentId = componentId;
    }

    public String getSubcomponentId() {
        return subcomponentId;
    }

    public void setSubcomponentId(String subcomponentId) {
        this.subcomponentId = subcomponentId;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getDeploymentStrategy() {
        return deploymentStrategy;
    }

    public void setDeploymentStrategy(String deploymentStrategy) {
        this.deploymentStrategy = deploymentStrategy;
    }

    public String getInitiatedBy() {
        return initiatedBy;
    }

    public void setInitiatedBy(String initiatedBy) {
        this.initiatedBy = initiatedBy;
    }

    public String getInitiatedRole() {
        return initiatedRole;
    }

    public void setInitiatedRole(String initiatedRole) {
        this.initiatedRole = initiatedRole;
    }
}