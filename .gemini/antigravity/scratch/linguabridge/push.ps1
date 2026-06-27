# Check if git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed or not in your PATH. Please install Git first."
    exit
}

Write-Host "Initializing Git repository..." -ForegroundColor Cyan
git init

# Check remote
$remoteUrl = "https://github.com/tej18saicharan-ops/linguabridge.git"
$existingRemotes = git remote -v
if ($existingRemotes -match "origin") {
    Write-Host "Updating existing remote origin..." -ForegroundColor Cyan
    git remote set-url origin $remoteUrl
} else {
    Write-Host "Adding remote origin..." -ForegroundColor Cyan
    git remote add origin $remoteUrl
}

Write-Host "Staging files..." -ForegroundColor Cyan
git add .

Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "Initialize LinguaBridge project with ESM support and glassmorphic UI"

Write-Host "Setting branch to main..." -ForegroundColor Cyan
git branch -M main

Write-Host "Pushing to GitHub (main branch)..." -ForegroundColor Cyan
git push -u origin main

Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
