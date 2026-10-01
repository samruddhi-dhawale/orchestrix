package com.pipeline.pipelineorchestrator.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pipeline.pipelineorchestrator.config.PipelineConfiguration;
import com.pipeline.pipelineorchestrator.model.Component;
import com.pipeline.pipelineorchestrator.model.Subcomponent;

@Service
public class ComponentService {

    private final PipelineConfiguration configuration;

    public ComponentService() {
        this.configuration = new PipelineConfiguration();
    }

    public List<Component> getComponents() {
        return configuration.getComponents();
    }

    public List<Subcomponent> getSubcomponents(String componentId) {
        return configuration.getSubcomponents()
                .stream()
                .filter(subcomponent ->
                        subcomponent.getComponentId().equals(componentId))
                .toList();
    }
}