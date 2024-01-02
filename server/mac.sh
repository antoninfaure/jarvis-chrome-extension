#!/bin/bash
PORT=4321
APP_PATH="/path/to/folder/jarvis-chrome-extension/server"

# Check if the port is in use
if lsof -i tcp:${PORT} | grep LISTEN; then
    echo "Some process is already listening on port ${PORT}."
else
    echo "Port ${PORT} is free, starting the Flask app."
    # Navigate to your Flask app directory
    cd ${APP_PATH}
    # Start Flask app
    python "flask run" --port=${PORT} &
fi

# Open Chrome to your Flask app's local URL
open -a "Google Chrome"