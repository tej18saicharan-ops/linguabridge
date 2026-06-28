@echo off
echo ===================================================
echo   Portfolio Site - Git Upload & Sync Tool
echo ===================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your system PATH.
    echo Please install Git from https://git-scm.com/ and try again.
    pause
    exit /b
)

:: Check if .git folder exists
if not exist ".git" (
    echo Git repository is not initialized in this folder.
    echo Initializing Git...
    git init
    git branch -M main
    echo.
    set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/username/repo-name.git): "
    if "%REPO_URL%"=="" (
        echo [ERROR] Repository URL cannot be empty.
        pause
        exit /b
    )
    git remote add origin %REPO_URL%
)

echo.
echo Staging index.html...
git add index.html

echo.
echo Committing changes...
git commit -m "Add ResearchOS AI project to portfolio"

echo.
echo Pushing to GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Git push failed. 
    echo If this is a new repository, make sure you created it on GitHub first.
    echo You may need to authenticate or run: git push -u origin main -f
) else (
    echo.
    echo [SUCCESS] Portfolio updated successfully on GitHub!
)

echo.
pause
