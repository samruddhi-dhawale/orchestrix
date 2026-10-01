package com.pipeline.pipelineorchestrator.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pipeline.pipelineorchestrator.model.Component;
import com.pipeline.pipelineorchestrator.model.Subcomponent;
import com.pipeline.pipelineorchestrator.service.ComponentService;

@RestController
@RequestMapping("/api/components")
public class ComponentController {

    private final ComponentService componentService;

    public ComponentController(ComponentService componentService) {
        this.componentService = componentService;
    }

    @GetMapping
    public List<Component> getComponents() {
        return componentService.getComponents();
    }

    @GetMapping("/{componentId}/subcomponents")
    public List<Subcomponent> getSubcomponents(
            @PathVariable String componentId) {

        return componentService.getSubcomponents(componentId);
    }
}