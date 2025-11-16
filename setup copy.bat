@echo off
echo ========================================
echo   Complete Setup Script
echo   Mental Health Assessment System
echo ========================================
echo.

REM Step 1: Check Node.js
echo [Step 1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo Node.js found!
echo.

REM Step 2: Check Python
echo [Step 2/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python 3.8+ from: https://www.python.org/
    pause
    exit /b 1
)
python --version
echo Python found!
echo.

REM Step 3: Install Frontend Dependencies
echo [Step 3/4] Installing Frontend dependencies...
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo Frontend dependencies installed!
) else (
    echo node_modules already exists, skipping...
)
echo.

REM Step 4: Install Python Dependencies
echo [Step 4/4] Installing Python dependencies...
cd python\api
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo Installing Python packages... (this may take a while)
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install Python dependencies
        cd ..\..
        pause
        exit /b 1
    )
)
cd ..\..
echo Python dependencies installed!
echo.

REM Create .env if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env file...
        copy .env.example .env >nul
        echo .env file created!
    )
)
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Train the ML model:
echo    - Open: python/kaggel-dataset-first-dataset.ipynb
echo    - Run all cells in the notebook
echo    - Wait for model files to be saved
echo.
echo 2. Start the application:
echo    - Double-click: start-all.bat
echo    - Or run separately:
echo      * start-backend.bat (API server)
echo      * start-frontend.bat (Web app)
echo.
echo 3. Access the application:
echo    - Frontend: http://localhost:5173
echo    - API Docs: http://localhost:8000/docs
echo.
pause
