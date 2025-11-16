@echo off
echo ========================================
echo   Mental Health Assessment System
echo   Starting Both Backend and Frontend
echo ========================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    if exist ".env.example" (
        copy .env.example .env
        echo .env file created!
    ) else (
        echo WARNING: .env.example not found
    )
    echo.
)

REM Check if model exists
if not exist "model\mental_health_model.pkl" (
    echo.
    echo ========================================
    echo   WARNING: ML Model Not Found!
    echo ========================================
    echo.
    echo Please train the model first by running:
    echo   python/kaggel-dataset-first-dataset.ipynb
    echo.
    echo After training, run this script again.
    echo.
    pause
    exit /b 1
)

echo Starting Backend in a new window...
start "Mental Health API - Backend" cmd /k start-backend.bat

REM Wait a bit for backend to start
echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting Frontend in a new window...
start "Mental Health App - Frontend" cmd /k start-frontend.bat

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend API:  http://localhost:8000
echo API Docs:     http://localhost:8000/docs
echo Frontend:     http://localhost:5173
echo.
echo Two new windows have been opened.
echo Close those windows to stop the servers.
echo.
echo You can close this window now.
echo.
pause
