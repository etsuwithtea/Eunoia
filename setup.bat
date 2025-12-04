@echo off
title Eunoia - First Time Setup
cd /d "%~dp0"

echo ========================================
echo   Eunoia - First Time Setup [Windows]
echo ========================================
echo.

echo [1/6] Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo        Install from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo       OK

echo [2/6] Checking npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm not found!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo       OK

echo [3/6] Checking Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo        Install from https://www.python.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo       OK

echo [4/6] Creating virtual environment...
if not exist ".venv\Scripts\python.exe" (
    python -m venv .venv
)
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Failed to create virtual environment!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo       OK

echo [5/6] Installing Python packages...
echo       This may take a few minutes...
.venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel --quiet
.venv\Scripts\python.exe -m pip install -r python\requirements.txt --only-binary=:all: --quiet
if %errorlevel% neq 0 (
    echo       Retrying without binary-only constraint...
    .venv\Scripts\python.exe -m pip install -r python\requirements.txt --quiet
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Python packages!
        echo        You may need to install Visual C++ Build Tools:
        echo        https://visualstudio.microsoft.com/visual-cpp-build-tools/
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
)
echo       OK

echo [6/6] Installing frontend packages...
echo       This may take a few minutes...
if exist "package-lock.json" (
    call npm ci --silent
) else (
    call npm install --silent
)
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm packages!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo       OK

echo.
echo ========================================
echo   Setup complete!
echo.
echo   Frontend:  npm run dev
echo   Backend:   .venv\Scripts\python.exe python\api\main.py
echo ========================================
echo.
echo Press any key to exit...
pause >nul
