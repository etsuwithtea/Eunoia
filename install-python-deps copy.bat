@echo off
echo ========================================
echo   Installing Python Dependencies
echo ========================================
echo.

cd python\api

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)
echo.

echo Installing Python packages from requirements.txt...
echo This may take a few minutes...
echo.

pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install Python packages
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Python dependencies installed!
echo ========================================
echo.
echo Next steps:
echo 1. Train the model by running: python/kaggel-dataset-first-dataset.ipynb
echo 2. Run start-all.bat to start both servers
echo.
pause
