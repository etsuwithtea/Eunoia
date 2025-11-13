@echo off
echo ========================================
echo   Starting Mental Health API Backend
echo ========================================
echo.

cd python\api

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)
echo.

echo Checking if model files exist...
if not exist "..\..\model\mental_health_model.pkl" (
    echo.
    echo WARNING: Model file not found!
    echo Please run the Jupyter Notebook first to train the model.
    echo File: python/kaggel-dataset-first-dataset.ipynb
    echo.
    pause
    exit /b 1
)
echo Model files found!
echo.

echo Starting FastAPI server...
echo API will be available at: http://localhost:8000
echo Swagger UI at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py

pause
