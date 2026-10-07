package com.pipeline.pipelineorchestrator.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import com.pipeline.pipelineorchestrator.model.Component;
import com.pipeline.pipelineorchestrator.model.Subcomponent;

@Configuration
public class PipelineConfiguration {

    public List<Component> getComponents() {
        return List.of(
                new Component("Ent_Jio_Inventory_System", "Ent_Jio_Inventory_System"),
                new Component("Ent_Jio_Orchestrator", "Ent_Jio_Orchestrator"),
                new Component("Ent_MF_OO", "Ent_MF_OO (operations Orchestration)")
        );
    }

    public List<Subcomponent> getSubcomponents() {
        List<Subcomponent> list = new ArrayList<>();
        List<String> systems = List.of("Ent_Jio_Inventory_System", "Ent_Jio_Orchestrator", "Ent_MF_OO");
        for (String sys : systems) {
            list.add(new Subcomponent("JIMS_O2A_ServiceProvisioning_ETH", "JIMS_O2A_ServiceProvisioning_ETH", sys));
            list.add(new Subcomponent("Enterprise_JIMS_O2AWebservices_And_Tools_Camunda", "Enterprise_JIMS_O2AWebservices_And_Tools_Camunda", sys));
            list.add(new Subcomponent("JIMS_Ent_Webservices_and_Tools_ILL", "JIMS_Ent_Webservices_and_Tools_ILL", sys));
            list.add(new Subcomponent("JIMS_O2A_ServiceProvisioning", "JIMS_O2A_ServiceProvisioning", sys));
        }

        // Keep legacy test fixtures for compatibility
        list.add(new Subcomponent("sub-a1", "Component A1 (Kernel Worker)", "component-a"));
        list.add(new Subcomponent("sub-a2", "Component A2 (Event Dispatcher)", "component-a"));
        list.add(new Subcomponent("sub-a3", "Component A3 (Edge Gateway)", "component-a"));
        list.add(new Subcomponent("sub-b1", "Component B1 (REST API)", "component-b"));
        list.add(new Subcomponent("sub-b2", "Component B2 (GraphQL Gateway)", "component-b"));
        list.add(new Subcomponent("sub-c1", "Component C1 (ETL Pipeline)", "component-c"));
        list.add(new Subcomponent("sub-c2", "Component C2 (Cache Invalidator)", "component-c"));
        list.add(new Subcomponent("sub-pay-core", "Component Pay-Core (Transaction Processor)", "payment-gateway"));
        list.add(new Subcomponent("sub-pay-webhooks", "Component Pay-Webhooks (Webhooks Engine)", "payment-gateway"));
        list.add(new Subcomponent("sub-auth-oauth", "Component Auth-OAuth (OAuth 2.0 / OIDC Server)", "auth-service"));
        list.add(new Subcomponent("sub-auth-tokens", "Component Auth-Tokens (JWT Session Manager)", "auth-service"));

        return list;
    }
}