package com.pipeline.pipelineorchestrator.model;

public class AzureDeploymentInfo {

    private String environment;
    private String subscription;
    private String resourceGroup;
    private String appServiceName;
    private String region;
    private String status;
    private String liveUrl;
    private String healthCheckUrl;
    private String healthStatus;
    private String deployedAt;
    private String strategy = "BLUE_GREEN"; // BLUE_GREEN, ROLLING, CANARY
    private String slot = "production (Swapped)";
    private String approvedBy = "Auto-Approved";

    public AzureDeploymentInfo() {
    }

    public AzureDeploymentInfo(String environment, String subscription, String resourceGroup,
                               String appServiceName, String region, String status, String liveUrl,
                               String healthCheckUrl, String healthStatus, String deployedAt) {
        this.environment = environment;
        this.subscription = subscription;
        this.resourceGroup = resourceGroup;
        this.appServiceName = appServiceName;
        this.region = region;
        this.status = status;
        this.liveUrl = liveUrl;
        this.healthCheckUrl = healthCheckUrl;
        this.healthStatus = healthStatus;
        this.deployedAt = deployedAt;
        this.strategy = "BLUE_GREEN";
        this.slot = "production";
        this.approvedBy = "Auto-Approved";
    }

    public AzureDeploymentInfo(String environment, String subscription, String resourceGroup,
                               String appServiceName, String region, String status, String liveUrl,
                               String healthCheckUrl, String healthStatus, String deployedAt,
                               String strategy, String slot, String approvedBy) {
        this.environment = environment;
        this.subscription = subscription;
        this.resourceGroup = resourceGroup;
        this.appServiceName = appServiceName;
        this.region = region;
        this.status = status;
        this.liveUrl = liveUrl;
        this.healthCheckUrl = healthCheckUrl;
        this.healthStatus = healthStatus;
        this.deployedAt = deployedAt;
        this.strategy = strategy;
        this.slot = slot;
        this.approvedBy = approvedBy;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getSubscription() {
        return subscription;
    }

    public void setSubscription(String subscription) {
        this.subscription = subscription;
    }

    public String getResourceGroup() {
        return resourceGroup;
    }

    public void setResourceGroup(String resourceGroup) {
        this.resourceGroup = resourceGroup;
    }

    public String getAppServiceName() {
        return appServiceName;
    }

    public void setAppServiceName(String appServiceName) {
        this.appServiceName = appServiceName;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLiveUrl() {
        return liveUrl;
    }

    public void setLiveUrl(String liveUrl) {
        this.liveUrl = liveUrl;
    }

    public String getHealthCheckUrl() {
        return healthCheckUrl;
    }

    public void setHealthCheckUrl(String healthCheckUrl) {
        this.healthCheckUrl = healthCheckUrl;
    }

    public String getHealthStatus() {
        return healthStatus;
    }

    public void setHealthStatus(String healthStatus) {
        this.healthStatus = healthStatus;
    }

    public String getDeployedAt() {
        return deployedAt;
    }

    public void setDeployedAt(String deployedAt) {
        this.deployedAt = deployedAt;
    }

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public String getSlot() {
        return slot;
    }

    public void setSlot(String slot) {
        this.slot = slot;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }
}
