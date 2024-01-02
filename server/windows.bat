@echo off
set PORT=4321
netstat -ano | findstr :%PORT%
if %errorlevel%==1 (
    echo Starting Flask app...
    cd "pat\to\folder\jarvis-chrome-extension\server"
    start /B python -m flask run --port=%PORT%
) else (
    echo Flask app already running.
)
start chrome