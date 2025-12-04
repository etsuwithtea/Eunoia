@echo off
setlocal ENABLEDELAYEDEXPANSION
title Eunoia - First Time Setup

echo ========================================
echo   Eunoia - First Time Setup (Windows)
echo ========================================
echo.

REM Ensure we run from repo root
pushd "%~dp0"

REM --- Check Node.js ---
echo Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js 18+ from https://nodejs.org/
    goto :end_fail
)
for /f "delims=" %%v in ('node -v') do set "NODE_VER=%%v"
set "NODE_VER=!NODE_VER:v=!"
for /f "tokens=1 delims=." %%m in ("!NODE_VER!") do set "NODE_MAJOR=%%m"
if "!NODE_MAJOR!"=="" set "NODE_MAJOR=0"
if !NODE_MAJOR! LSS 18 (
    echo [ERROR] Node.js 18+ required. Detected: v!NODE_VER!
    goto :end_fail
)
echo   Found Node.js v!NODE_VER!
echo.

REM --- Check npm ---
echo Checking npm...
npm -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. It ships with Node.js. Please reinstall Node.js.
    goto :end_fail
)
for /f "delims=" %%v in ('npm -v') do set "NPM_VER=%%v"
echo   Found npm v!NPM_VER!
echo.

REM --- Check Python ---
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.10+ from https://www.python.org/downloads/
    goto :end_fail
)
for /f "tokens=2" %%v in ('python -V 2^>^&1') do set "PY_VER=%%v"
for /f "tokens=1,2 delims=." %%a in ("!PY_VER!") do (
    set "PY_MAJ=%%a"
    set "PY_MIN=%%b"
)
if "!PY_MAJ!"=="" set "PY_MAJ=0"
if "!PY_MIN!"=="" set "PY_MIN=0"
if !PY_MAJ! LSS 3 (
    echo [ERROR] Python 3.10+ required. Detected: !PY_VER!
    goto :end_fail
) else if !PY_MAJ! EQU 3 if !PY_MIN! LSS 10 (
    echo [ERROR] Python 3.10+ required. Detected: !PY_VER!
    goto :end_fail
)
echo   Found Python !PY_VER!
echo.

REM --- Create virtual environment (if missing) ---
set "VENV_PATH=.venv"
if not exist "!VENV_PATH!\Scripts\python.exe" (
    echo Creating virtual environment at !VENV_PATH! ...
    python -m venv "!VENV_PATH!"
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        goto :end_fail
    )
)
set "PY_CMD=!VENV_PATH!\Scripts\python.exe"
echo Using interpreter: !PY_CMD!
echo.

REM --- Install Python dependencies ---
echo Upgrading pip...
"!PY_CMD!" -m pip install --upgrade pip
if errorlevel 1 (
    echo [ERROR] Failed to upgrade pip.
    goto :end_fail
)

echo Installing Python packages...
"!PY_CMD!" -m pip install -r python\requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies.
    goto :end_fail
)
echo Python dependencies installed.
echo.

REM --- Install frontend dependencies ---
echo Installing frontend dependencies (npm ci)...
npm ci
if errorlevel 1 (
    echo [ERROR] npm install failed.
    goto :end_fail
)
echo Frontend dependencies installed.
echo.

REM --- Bootstrap env file ---
if not exist ".env" (
    echo Creating .env from .env.example ...
    copy /Y ".env.example" ".env" >nul
)

echo ========================================
echo   Setup complete!
echo   Frontend: npm run dev
echo   Backend : "!PY_CMD!" python\api\main.py
echo ========================================
echo.
popd
goto :eof

:end_fail
echo.
echo Setup aborted due to errors above.
popd
exit /b 1
