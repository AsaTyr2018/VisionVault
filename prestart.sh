#!/bin/bash

# Pre-startup script for VisionVault
# Checks for git updates and optionally updates dependencies before starting.

# fetch latest changes from remote
if git fetch >/dev/null 2>&1 && ! git diff --quiet HEAD..origin/$(git rev-parse --abbrev-ref HEAD); then
    echo "Updates are available for VisionVault."
    read -p "Update now? [y/N] " -r reply
    echo
    if [[ $reply =~ ^[Yy]$ ]]; then
        previous=$(git rev-parse HEAD)
        echo "Pulling latest changes..."
        git pull --ff-only
        # Check if package files changed
        if git diff --name-only $previous HEAD | grep -E '^(package|package-lock)\.json$' >/dev/null; then
            echo "Dependency files changed. Running npm install..."
            npm install
        fi
    fi
fi

# Start the application
npm start

