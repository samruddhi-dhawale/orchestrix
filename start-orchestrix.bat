@echo off
title Orchestrix - CI/CD Pipeline Orchestration Platform
echo =====================================================================
echo                 ORCHESTRIX PLATFORM LAUNCHER
echo          CI/CD Pipeline Orchestrator + Azure Cloud
echo =====================================================================
echo.

echo [1/2] Starting Spring Boot Backend (Java 17 / In-Memory Orchestrator)...
start "Orchestrix Backend (Port 8080)" cmd /k "cd /d %~dp0backend && .\mvnw.cmd spring-boot:run"

timeout /t 5 /nobreak >nul

echo [2/2] Starting React + Vite Frontend (Port 5173)...
start "Orchestrix Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =====================================================================
echo   Orchestrix is starting!
echo   - Backend API:  http://localhost:8080/api/pipelines
echo   - Frontend App: http://localhost:5173
echo.
echo   Press any key to open the Orchestrix dashboard in your browser...
echo =====================================================================
pause >nul

start http://localhost:5173/login
