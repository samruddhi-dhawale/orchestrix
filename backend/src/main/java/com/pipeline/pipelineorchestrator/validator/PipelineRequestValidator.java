package com.pipeline.pipelineorchestrator.validator;

import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.pipeline.pipelineorchestrator.model.PipelineRequest;

/**
 * Pre-Execution Configuration Validator.
 * Performs lightweight semantic and business-rule validation BEFORE
 * any pipeline execution record is instantiated or started.
 */
@Component
public class PipelineRequestValidator {

    private static final Map<String, Set<String>> VALID_COMPONENTS = Map.ofEntries(
            Map.entry("ent_jio_inventory_system", Set.of(
                    "jims_o2a_serviceprovisioning_eth",
                    "enterprise_jims_o2awebservices_and_tools_camunda",
                    "jims_ent_webservices_and_tools_ill",
                    "jims_o2a_serviceprovisioning"
            )),
            Map.entry("ent_jio_orchestrator", Set.of(
                    "jims_o2a_serviceprovisioning_eth",
                    "enterprise_jims_o2awebservices_and_tools_camunda",
                    "jims_ent_webservices_and_tools_ill",
                    "jims_o2a_serviceprovisioning"
            )),
            Map.entry("ent_mf_oo", Set.of(
                    "jims_o2a_serviceprovisioning_eth",
                    "enterprise_jims_o2awebservices_and_tools_camunda",
                    "jims_ent_webservices_and_tools_ill",
                    "jims_o2a_serviceprovisioning"
            )),
            Map.entry("component-a", Set.of("sub-a1", "sub-a2", "sub-a3")),
            Map.entry("component-b", Set.of("sub-b1", "sub-b2")),
            Map.entry("component-c", Set.of("sub-c1", "sub-c2")),
            Map.entry("payment-gateway", Set.of("sub-pay-core", "sub-pay-webhooks")),
            Map.entry("auth-service", Set.of("sub-auth-oauth", "sub-auth-tokens"))
    );

    private static final Set<String> VALID_ENVIRONMENTS = Set.of(
            "development", "staging", "production", "mut", "sit", "replica"
    );

    private static final Set<String> VALID_STRATEGIES = Set.of(
            "BLUE_GREEN", "CANARY", "ROLLING"
    );

    public void validate(PipelineRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Pipeline configuration payload is required.");
        }

        // 1. Application Component Validation
        if (isBlank(request.getComponentId())) {
            throw new IllegalArgumentException("Application component is required. Please select a valid component.");
        }

        String comp = request.getComponentId().trim().toLowerCase();
        if (!VALID_COMPONENTS.containsKey(comp)) {
            throw new IllegalArgumentException("Invalid application component '" + request.getComponentId() + "'.");
        }

        // 2. Subcomponent Validation
        if (isBlank(request.getSubcomponentId())) {
            throw new IllegalArgumentException("Target subcomponent is required. Please select a subcomponent.");
        }

        String sub = request.getSubcomponentId().trim().toLowerCase();
        Set<String> allowedSubs = VALID_COMPONENTS.get(comp);
        if (allowedSubs == null || !allowedSubs.contains(sub)) {
            throw new IllegalArgumentException("Target subcomponent '" + request.getSubcomponentId() + 
                    "' does not belong to selected component '" + request.getComponentId() + "'.");
        }

        // 3. Git Branch Validation
        if (isBlank(request.getBranch())) {
            throw new IllegalArgumentException("Git branch or tag reference is required.");
        }

        String branch = request.getBranch().trim();
        if (branch.contains(" ") || branch.contains("..") || branch.startsWith("/") || branch.endsWith("/")) {
            throw new IllegalArgumentException("Invalid Git branch name '" + branch + "'. Branch names cannot contain whitespace, double dots, or leading/trailing slashes.");
        }

        // 4. Target Environment Validation
        if (isBlank(request.getEnvironment())) {
            throw new IllegalArgumentException("Target deployment environment is required.");
        }

        String env = request.getEnvironment().trim().toLowerCase();
        if (!VALID_ENVIRONMENTS.contains(env)) {
            throw new IllegalArgumentException("Invalid environment '" + request.getEnvironment() + "'. Allowed environments: mut, sit, replica.");
        }

        // 5. Deployment Strategy Validation
        if (isBlank(request.getDeploymentStrategy())) {
            throw new IllegalArgumentException("Deployment strategy is required.");
        }

        String strategy = request.getDeploymentStrategy().trim().toUpperCase();
        if (!VALID_STRATEGIES.contains(strategy)) {
            throw new IllegalArgumentException("Invalid deployment strategy '" + request.getDeploymentStrategy() + "'. Allowed strategies: BLUE_GREEN, CANARY, ROLLING.");
        }
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
}
