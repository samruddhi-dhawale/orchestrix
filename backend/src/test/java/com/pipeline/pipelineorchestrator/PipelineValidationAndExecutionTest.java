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
        assertEquals(7, execution.getTotalStages());
        assertEquals("Checkout Source", execution.getStageNames().get(0));
        assertEquals("Azure Cloud Deployment", execution.getStageNames().get(6));

        // Ensure "Validate Configuration" is nowhere in the stage names
        assertFalse(execution.getStageNames().contains("Validate Configuration"));
    }

    @Test
    void testProductionApprovalPipelineExecutionHas8Stages() {
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
        assertEquals(8, execution.getTotalStages());
        assertEquals("Checkout Source", execution.getStageNames().get(0));
        assertEquals("Production Approval", execution.getStageNames().get(6));
        assertEquals("Azure Cloud Deployment", execution.getStageNames().get(7));

        assertFalse(execution.getStageNames().contains("Validate Configuration"));
    }
}
