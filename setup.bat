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

echo [3.5/6] Checking Visual C++ Redistributable...
if not exist "%SystemRoot%\System32\vcruntime140.dll" (
    echo       Not found! Downloading...
    echo.
    
    curl -L -o "%TEMP%\vc_redist.x64.exe" "https://aka.ms/vs/17/release/vc_redist.x64.exe"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download Visual C++ Redistributable!
        echo        Please download manually from:
        echo        https://aka.ms/vs/17/release/vc_redist.x64.exe
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    
    echo       Installing Visual C++ Redistributable...
    echo       (You may see a UAC prompt - please click Yes)
    echo.
    "%TEMP%\vc_redist.x64.exe" /install /quiet /norestart
    if %errorlevel% neq 0 (
        echo       Silent install failed, trying interactive install...
        "%TEMP%\vc_redist.x64.exe" /install
    )
    
    del "%TEMP%\vc_redist.x64.exe" >nul 2>nul
    
    if not exist "%SystemRoot%\System32\vcruntime140.dll" (
        echo [ERROR] Installation may have failed.
        echo        Please restart this script after installation completes.
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    echo       Installed successfully!
) else (
    echo       OK
)

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
echo.
.venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
.venv\Scripts\python.exe -m pip install -r python\requirements.txt --only-binary=:all:
if %errorlevel% neq 0 (
    echo.
    echo       Retrying without binary-only constraint...
    .venv\Scripts\python.exe -m pip install -r python\requirements.txt
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

echo.
echo [6/6] Installing frontend packages...
echo       This may take a few minutes...
echo.
if exist "package-lock.json" (
    call npm ci
) else (
    call npm install
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
echo.
echo   ** IMPORTANT: Always use .venv\Scripts\python.exe **
echo   ** NOT just 'python' directly! **
echo.
echo   Examples:
echo     .venv\Scripts\python.exe python\data_pipeline.py
echo     .venv\Scripts\python.exe python\train_gpu_transformer.py
echo ========================================
echo.
echo Press any key to exit...
pause >nul
