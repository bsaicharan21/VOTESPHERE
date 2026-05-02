@echo off
title VoteSphere - Starting...
color 0A

echo.
echo  ============================================
echo   VoteSphere Server + Ngrok Launcher
echo  ============================================
echo.

:: Start the Node.js server in a new window
echo  [1/2] Starting Node.js server on port 3000...
start "VoteSphere Server" cmd /k "cd /d %~dp0 && node server.js"

:: Wait a moment for server to start
timeout /t 3 /nobreak >nul

:: Start ngrok in a new window
echo  [2/2] Starting ngrok tunnel...
start "Ngrok Tunnel" cmd /k "C:\Users\ASUS\AppData\Roaming\npm\node_modules\ngrok\bin\ngrok.exe http 3000"

echo.
echo  ============================================
echo   Both services are starting!
echo  ============================================
echo.
echo   Local:  http://localhost:3000
echo   Ngrok:  Check the ngrok window for your public URL
echo   Dashboard: http://127.0.0.1:4040
echo.
echo   To stop: close both windows
echo  ============================================
echo.
pause
