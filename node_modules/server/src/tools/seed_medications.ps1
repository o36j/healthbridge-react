# Change to the directory containing this script
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path $scriptPath
Set-Location $scriptDir

# Check if Python is installed
$pythonCmd = $null
$pipCmd = $null

if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} else {
    Write-Host "Error: Python is not installed. Please install Python 3.6 or higher." -ForegroundColor Red
    exit 1
}

# Check if pip is installed
if (Get-Command pip -ErrorAction SilentlyContinue) {
    $pipCmd = "pip"
} elseif (Get-Command pip3 -ErrorAction SilentlyContinue) {
    $pipCmd = "pip3"
} else {
    Write-Host "Error: pip is not installed. Please install pip." -ForegroundColor Red
    exit 1
}

# Install required packages
Write-Host "Installing required packages..." -ForegroundColor Cyan
& $pipCmd install -r requirements.txt

# Run the script
Write-Host "Running medication seeder script..." -ForegroundColor Cyan
& $pythonCmd add_medications.py 