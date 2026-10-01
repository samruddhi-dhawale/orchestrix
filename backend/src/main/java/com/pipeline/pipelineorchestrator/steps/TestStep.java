package com.pipeline.pipelineorchestrator.steps;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.pipeline.pipelineorchestrator.model.ExecutionStatus;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.PipelineRequest;
import com.pipeline.pipelineorchestrator.model.PipelineStepResult;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineContext;
import com.pipeline.pipelineorchestrator.orchestrator.PipelineStep;

public class TestStep implements PipelineStep {

    @Override
    public PipelineStepResult execute(PipelineContext context) {
        long startTime = System.currentTimeMillis();
        String startTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        PipelineExecution execution = context.getPipelineExecution();
        PipelineRequest request = context.getPipelineRequest();

        // Support intentional test failure if user selects branch "fail-test" or "feature/broken-test"
        if ("fail-test".equalsIgnoreCase(request.getBranch()) || "feature/broken-test".equalsIgnoreCase(request.getBranch())) {
            execution.addLog("INFO", "Test", "Running test runner: JUnit 5 / AssertJ suite...");
            execution.addLog("ERROR", "Test", "AssertionError: Expected status code 200 but received 500 in PaymentEndpointTest.testTransactionProcess");
            execution.addLog("ERROR", "Test", "Tests run: 58, Failures: 1, Errors: 0, Skipped: 0");

            long durationMs = System.currentTimeMillis() - startTime;
            String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
            return new PipelineStepResult(
                    "Test",
                    ExecutionStatus.FAILED,
                    "Automated test suite failed: 1 failure in PaymentEndpointTest",
                    durationMs,
                    startTimestamp,
                    completedTimestamp
            );
        }

        execution.addLog("INFO", "Test", "Running test runner: JUnit 5 / Mockito / AssertJ suite...");
        execution.addLog("INFO", "Test", "Running com.orchestrix." + request.getSubcomponentId() + ".AutomatedTestSuite");
        execution.addLog("INFO", "Test", "Executing 48 Unit Tests... [OK]");
        execution.addLog("INFO", "Test", "Executing 16 Integration Tests with Spring Test... [OK]");
        execution.addLog("INFO", "Test", "Code Coverage: 93.8% (JaCoCo report generated at target/site/jacoco/index.html)");
        execution.addLog("SUCCESS", "Test", "All 64 tests passed successfully with 0 failures and 0 errors.");

        long durationMs = System.currentTimeMillis() - startTime;
        String completedTimestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

        return new PipelineStepResult(
                "Test",
                ExecutionStatus.SUCCESS,
                "All 64 tests passed (93.8% coverage)",
                durationMs,
                startTimestamp,
                completedTimestamp
        );
    }
}