# Build Desktop Pet App (Windows)
# This script will install dependencies and build the Tauri app into an .msi installer.

Write-Host "Starting Desktop Pet Build Process..." -ForegroundColor Cyan

# 1. Check for Node.js
if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Downloading Node.js installer..." -ForegroundColor Yellow
    $nodeInstaller = "node-v20.11.1-x64.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi" -OutFile $nodeInstaller
    
    Write-Host "Running Node.js installer. Please follow the prompts to install..." -ForegroundColor Yellow
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i $nodeInstaller /passive" -Wait
    Remove-Item $nodeInstaller
    
    Write-Host "Node.js installed. Refreshing environment variables..." -ForegroundColor Cyan
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Verify installation
    if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
        Write-Host "Failed to detect npm after installation. Please restart your computer and try again." -ForegroundColor Red
        Pause
        exit
    }
}

# 2. Check for Rust
if (!(Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    Write-Host "Rust is not installed. Downloading Rust installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://win.rustup.rs" -OutFile "rustup-init.exe"
    Write-Host "Running Rust installer. Please follow the prompts..." -ForegroundColor Yellow
    .\rustup-init.exe -y
    Remove-Item "rustup-init.exe"
    
    # Refresh environment variables for the current session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

Write-Host "Installing Node.js dependencies..." -ForegroundColor Green
npm install

Write-Host "Building the Tauri application (this may take a while)..." -ForegroundColor Green
npx tauri build

Write-Host "Build complete! You can find your installer in: src-tauri\target\release\bundle\msi\" -ForegroundColor Cyan
Pause
