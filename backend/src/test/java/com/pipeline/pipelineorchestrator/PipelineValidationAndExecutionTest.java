package com.pipeline.pipelineorchestrator;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.pipeline.pipelineorchestrator.integration.JFrogArtifactPublisher;
import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;
import com.pipeline.pipelineorchestrator.service.ExecutionService;
import com.pipeline.pipelineorchestrator.validator.PipelineRequestValidator;

public class PipelineValidationAndExecutionTest {

    private PipelineRequestValidator validator;
    private ExecutionService executionService;

    @BeforeEach
    void setUp() {
        validator = new PipelineRequestValidator();
        executionService = new ExecutionService(new JFrogArtifactPublisher(), false);
    }

    @Test
    void testValidationFailsWhenComponentIsMissing() {
        PipelineRequest req = new PipelineRequest();
        req.setSubcomponentId("sub-a1");
        req.setBranch("main");
        req.setEnvironment("development");
        req.setDeploymentStrategy("BLUE_GREEN");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> validator.validate(req));
        assertTrue(ex.getMessage().contains("Application component is required"));
    }

    @Test
    void testValidationFailsWhenSubcomponentDoesNotBelongToComponent() {
        PipelineRequest req = new PipelineRequest();
        req.setComponentId("component-a");
        req.setSubcomponentId("sub-c2"); // Belong to component-c!
        req.setBranch("main");
        req.setEnvironment("development");
        req.setDeploymentStrategy("BLUE_GREEN");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> validator.validate(req));
        assertTrue(ex.getMessage().contains("does not belong to selected component"));
    }

    @Test
    void testValidationFailsWhenBranchHasSpacesOrInvalidChars() {
        PipelineRequest req = new PipelineRequest();
        req.setComponentId("component-a");
        req.setSubcomponentId("sub-a1");
        req.setBranch("invalid branch name");
        req.setEnvironment("development");
        req.setDeploymentStrategy("BLUE_GREEN");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> validator.validate(req));
        assertTrue(ex.getMessage().contains("Invalid Git branch name"));
    }

    @Test
    void testValidationFailsWhenEnvironmentIsInvalid() {
        PipelineRequest req = new PipelineRequest();
        req.setComponentId("component-a");
        req.setSubcomponentId("sub-a1");
        req.setBranch("main");
        req.setEnvironment("invalid-env");
        req.setDeploymentStrategy("BLUE_GREEN");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> validator.validate(req));
        assertTrue(ex.getMessage().contains("Invalid environment"));
    }

    @Test
    void testValidationPassesForValidRequest() {
        PipelineRequest req = new PipelineRequest();
        req.setComponentId("component-a");
        req.setSubcomponentId("sub-a1");
        req.setBranch("main");
        req.setEnvironment("development");
        req.setDeploymentStrategy("BLUE_GREEN");

        assertDoesNotThrow(() -> validator.validate(req));
    }

    @Test
    void testDirectPipelineExecutionHas7StagesAndStartsWithCheckoutSource() {
        PipelineRequest req = new PipelineRequest();
        req.setComponentId("component-a");
        req.setSubcomponentId("sub-a1");
        req.setBranch("main");
        req.setEnvironment("development");
        req.setDeploymentStrategy("BLUE_GREEN");
        req.setInitiatedBy("developer");
        req.setInitiatedRole("DEVELOPER");

        PipelineExecution execution = executionService.executePipeline(req);

        assertNotNull(execution);
        assertEquals(5, execution.getTotalStages());
        assertEquals("Checkout Source", execution.getStageNames().get(0));
        assertEquals("Test", execution.getStageNames().get(1));
        assertEquals("Build", execution.getStageNames().get(2));
        assertEquals("Generate Artifact", execution.getStageNames().get(3));
        assertEquals("Azure Cloud Deployment", execution.getStageNames().get(4));

        // Ensure "Validate Configuration" is nowhere in the stage names
        assertFalse(execution.getStageNames().contains("Validate Configuration"));
        assertFalse(execution.getStageNames().contains("Security & Vulnerability Scan"));
        assertFalse(execution.getStageNames().contains("Package"));
    }

    @Test
    void testProductionPipelineExecutionDirect5Stages() {
        PipelineRequest req = new PipelineRequest();
        req.setComponentId("payment-gateway");
        req.setSubcomponentId("sub-pay-core");
        req.setBranch("release/v1.0");
        req.setEnvironment("production");
        req.setDeploymentStrategy("BLUE_GREEN");
        req.setInitiatedBy("developer");
        req.setInitiatedRole("DEVELOPER");

        PipelineExecution execution = executionService.executePipeline(req);

        assertNotNull(execution);
        assertEquals(5, execution.getTotalStages());
        assertEquals("Checkout Source", execution.getStageNames().get(0));
        assertEquals("Test", execution.getStageNames().get(1));
        assertEquals("Build", execution.getStageNames().get(2));
        assertEquals("Generate Artifact", execution.getStageNames().get(3));
        assertEquals("Azure Cloud Deployment", execution.getStageNames().get(4));

        assertFalse(execution.getStageNames().contains("Validate Configuration"));
        assertFalse(execution.getStageNames().contains("Production Approval"));
        assertFalse(execution.getStageNames().contains("Security & Vulnerability Scan"));
        assertFalse(execution.getStageNames().contains("Package"));
    }
}
