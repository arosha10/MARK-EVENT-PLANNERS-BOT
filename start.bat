@echo off
echo ========================================
echo    STARTING ONYX MD BOT
echo ========================================
echo.

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Dependencies not found! Running installation...
    call install.bat
    if %errorlevel% neq 0 (
        echo Installation failed! Please check the errors above.
        pause
        exit /b 1
    )
)

echo Starting ONYX MD Bot...
echo.
echo Press Ctrl+C to stop the bot
echo.

node index.js

pause 