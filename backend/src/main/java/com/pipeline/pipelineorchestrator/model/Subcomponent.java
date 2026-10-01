package com.pipeline.pipelineorchestrator.model;

public class Subcomponent {

    private String id;
    private String name;
    private String componentId;

    public Subcomponent() {
    }

    public Subcomponent(String id, String name, String componentId) {
        this.id = id;
        this.name = name;
        this.componentId = componentId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getComponentId() {
        return componentId;
    }

    public void setComponentId(String componentId) {
        this.componentId = componentId;
    }
}