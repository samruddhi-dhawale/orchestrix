package com.pipeline.pipelineorchestrator.config;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import com.pipeline.pipelineorchestrator.model.Component;
import com.pipeline.pipelineorchestrator.model.Subcomponent;

@Configuration
public class PipelineConfiguration {

    public List<Component> getComponents() {
        return List.of(
                new Component("component-a", "System A (Core Platform)"),
                new Component("component-b", "System B (API Services)"),
                new Component("component-c", "System C (Data Engine)"),
                new Component("payment-gateway", "Payment Gateway System"),
                new Component("auth-service", "Identity & Access System")
        );
    }

    public List<Subcomponent> getSubcomponents() {
        return List.of(
                new Subcomponent("sub-a1", "Component A1 (Kernel Worker)", "component-a"),
                new Subcomponent("sub-a2", "Component A2 (Event Dispatcher)", "component-a"),
                new Subcomponent("sub-a3", "Component A3 (Edge Gateway)", "component-a"),

                new Subcomponent("sub-b1", "Component B1 (REST API)", "component-b"),
                new Subcomponent("sub-b2", "Component B2 (GraphQL Gateway)", "component-b"),

                new Subcomponent("sub-c1", "Component C1 (ETL Pipeline)", "component-c"),
                new Subcomponent("sub-c2", "Component C2 (Cache Invalidator)", "component-c"),

                new Subcomponent("sub-pay-core", "Component Pay-Core (Transaction Processor)", "payment-gateway"),
                new Subcomponent("sub-pay-webhooks", "Component Pay-Webhooks (Webhooks Engine)", "payment-gateway"),

                new Subcomponent("sub-auth-oauth", "Component Auth-OAuth (OAuth 2.0 / OIDC Server)", "auth-service"),
                new Subcomponent("sub-auth-tokens", "Component Auth-Tokens (JWT Session Manager)", "auth-service")
        );
    }
}