@echo off
echo ========================================
echo   Installing Frontend Dependencies
echo ========================================
echo.

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo.

echo Checking npm installation...
npm --version
if errorlevel 1 (
    echo ERROR: npm is not installed
    pause
    exit /b 1
)
echo.

echo Installing npm packages...
echo This may take a few minutes...
echo.

npm install

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install npm packages
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Frontend dependencies installed!
echo ========================================
echo.
echo Next steps:
echo 1. Install Python dependencies: run install-python-deps.bat
echo 2. Train the model: run python/kaggel-dataset-first-dataset.ipynb
echo 3. Start servers: run start-all.bat
echo.
pause
