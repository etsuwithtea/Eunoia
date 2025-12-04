@echo off
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found!
    echo         Please run setup.bat first.
    pause
    exit /b 1
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo Virtual environment activated!
echo You can now run Python scripts:
echo   python python\data_pipeline.py
echo   python python\train_gpu_transformer.py
echo   python python\api\main.py
echo.
echo Type 'deactivate' to exit virtual environment.
echo.

cmd /k
