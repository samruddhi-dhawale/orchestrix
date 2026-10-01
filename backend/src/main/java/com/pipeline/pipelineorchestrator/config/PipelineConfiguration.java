package com.pipeline.pipelineorchestrator.config;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import com.pipeline.pipelineorchestrator.model.Component;
import com.pipeline.pipelineorchestrator.model.Subcomponent;

@Configuration
public class PipelineConfiguration {

    public List<Component> getComponents() {
        return List.of(
                new Component("component-a", "Component A (Core Platform)"),
                new Component("component-b", "Component B (API Services)"),
                new Component("component-c", "Component C (Data Engine)"),
                new Component("payment-gateway", "Payment Gateway Service"),
                new Component("auth-service", "Identity & Access Hub")
        );
    }

    public List<Subcomponent> getSubcomponents() {
        return List.of(
                new Subcomponent("sub-a1", "Subcomponent A1 (Kernel Worker)", "component-a"),
                new Subcomponent("sub-a2", "Subcomponent A2 (Event Dispatcher)", "component-a"),
                new Subcomponent("sub-a3", "Subcomponent A3 (Edge Gateway)", "component-a"),

                new Subcomponent("sub-b1", "Subcomponent B1 (REST API)", "component-b"),
                new Subcomponent("sub-b2", "Subcomponent B2 (GraphQL Gateway)", "component-b"),

                new Subcomponent("sub-c1", "Subcomponent C1 (ETL Pipeline)", "component-c"),
                new Subcomponent("sub-c2", "Subcomponent C2 (Cache Invalidator)", "component-c"),

                new Subcomponent("sub-pay-core", "Payment Transaction Processor", "payment-gateway"),
                new Subcomponent("sub-pay-webhooks", "Stripe & Razorpay Webhooks", "payment-gateway"),

                new Subcomponent("sub-auth-oauth", "OAuth 2.0 / OIDC Server", "auth-service"),
                new Subcomponent("sub-auth-tokens", "JWT Session Manager", "auth-service")
        );
    }
}