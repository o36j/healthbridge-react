#!/bin/bash

# Change to the directory containing this script
cd "$(dirname "$0")"

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "Error: Python is not installed. Please install Python 3.6 or higher."
    exit 1
fi

# Determine Python command (python or python3)
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Check if pip is installed
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo "Error: pip is not installed. Please install pip."
    exit 1
fi

# Determine pip command (pip or pip3)
if command -v pip3 &> /dev/null; then
    PIP_CMD="pip3"
else
    PIP_CMD="pip"
fi

# Install required packages
echo "Installing required packages..."
$PIP_CMD install -r requirements.txt

# Run the script
echo "Running medication seeder script..."
$PYTHON_CMD add_medications.py 