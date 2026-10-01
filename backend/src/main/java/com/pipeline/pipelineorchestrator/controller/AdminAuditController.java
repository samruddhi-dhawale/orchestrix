package com.pipeline.pipelineorchestrator.controller;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pipeline.pipelineorchestrator.model.LoginAuditEntry;
import com.pipeline.pipelineorchestrator.model.PipelineExecution;
import com.pipeline.pipelineorchestrator.model.UserAccount;
import com.pipeline.pipelineorchestrator.service.ExecutionService;
import com.pipeline.pipelineorchestrator.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminAuditController {

    private final UserService userService;
    private final ExecutionService executionService;

    public AdminAuditController(UserService userService, ExecutionService executionService) {
        this.userService = userService;
        this.executionService = executionService;
    }

    @GetMapping("/audit")
    public ResponseEntity<Map<String, Object>> getAuditData() {
        List<LoginAuditEntry> logins = userService.getLoginHistory();
        List<UserAccount> users = userService.getAllUsers();
        List<PipelineExecution> pipelines = executionService.getAllExecutions();

        Map<String, Object> response = new HashMap<>();
        response.put("loginHistory", logins);
        response.put("registeredUsers", users);
        response.put("pipelineHistory", pipelines);
        response.put("totalUsers", users.size());
        response.put("totalLogins", logins.size());
        response.put("totalPipelines", pipelines.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/audit/export")
    public ResponseEntity<byte[]> exportAuditReport() {
        StringBuilder csv = new StringBuilder();
        csv.append("Record_Type,ID,User_Name,Role,Timestamp,Component,Subcomponent,Branch,Environment,Strategy,Status,Details\n");

        // 1. Export Login History
        for (LoginAuditEntry entry : userService.getLoginHistory()) {
            csv.append("USER_LOGIN,")
               .append(entry.getId()).append(",")
               .append(escape(entry.getUsername())).append(",")
               .append(escape(entry.getRole())).append(",")
               .append(escape(entry.getTimestamp())).append(",")
               .append("N/A,N/A,N/A,N/A,N/A,")
               .append(escape(entry.getStatus())).append(",")
               .append(escape("IP: " + entry.getIpAddress() + " | Name: " + entry.getName()))
               .append("\n");
        }

        // 2. Export Pipeline Execution History
        for (PipelineExecution exec : executionService.getAllExecutions()) {
            String comp = exec.getPipelineRequest() != null ? exec.getPipelineRequest().getComponentId() : "N/A";
            String sub = exec.getPipelineRequest() != null ? exec.getPipelineRequest().getSubcomponentId() : "N/A";
            String branch = exec.getPipelineRequest() != null ? exec.getPipelineRequest().getBranch() : "N/A";
            String env = exec.getPipelineRequest() != null ? exec.getPipelineRequest().getEnvironment() : "N/A";
            String strat = exec.getPipelineRequest() != null ? exec.getPipelineRequest().getDeploymentStrategy() : "N/A";
            String user = exec.getPipelineRequest() != null ? exec.getPipelineRequest().getInitiatedBy() : "Unknown";
            String role = exec.getPipelineRequest() != null ? exec.getPipelineRequest().getInitiatedRole() : "DEVELOPER";
            String time = exec.getStartedAt() != null ? exec.getStartedAt().toString().replace("T", " ") : "N/A";

            csv.append("PIPELINE_LAUNCH,")
               .append(exec.getExecutionId().substring(0, 8)).append(",")
               .append(escape(user)).append(",")
               .append(escape(role)).append(",")
               .append(escape(time)).append(",")
               .append(escape(comp)).append(",")
               .append(escape(sub)).append(",")
               .append(escape(branch)).append(",")
               .append(escape(env)).append(",")
               .append(escape(strat)).append(",")
               .append(escape(String.valueOf(exec.getStatus()))).append(",")
               .append(escape("Duration: " + exec.getTotalDurationMs() + "ms | Steps: " + (exec.getSteps() != null ? exec.getSteps().size() : 0)))
               .append("\n");
        }

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"orchestrix-enterprise-audit-report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    private String escape(String val) {
        if (val == null) return "\"\"";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}
