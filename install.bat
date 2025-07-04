@echo off
echo ========================================
echo    ONYX MD BOT INSTALLATION SCRIPT
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo Choose the LTS version (20.x or higher)
    pause
    exit /b 1
)

echo Node.js found! Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    INSTALLATION COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Edit config.env with your details
echo 2. Run: npm start
echo 3. Or run: node index.js
echo.
pause 