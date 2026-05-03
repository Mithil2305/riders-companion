@echo off
setlocal EnableDelayedExpansion

ECHO ==========================================
ECHO    Git History Cleanup - Remove Secret
ECHO ==========================================
ECHO.

cd /d "E:\Client Code\riders-companion"

ECHO [1/4] Removing secret file from git history...
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/riders-companion-8e4f8-firebase-adminsdk-fbsvc-44a40f169f.json" --prune-empty --tag-name-filter cat -- --all

ECHO.
ECHO [2/4] Cleaning up references...
git for-each-ref --format="delete %(refname)" refs/original/ | git update-ref --stdin 2>nul
git reflog expire --expire=now --all
git gc --prune=now --aggressive

ECHO.
ECHO [3/4] Committing .gitignore update...
ECHO backend/riders-companion-8e4f8-firebase-adminsdk-fbsvc-44a40f169f.json>> .gitignore 2>nul
git add .gitignore
git commit -m "chore: ensure firebase service account key is ignored" 2>nul

ECHO.
ECHO [4/4] Force pushing to GitHub...
git push origin main --force-with-lease

ECHO.
ECHO ==========================================
IF %ERRORLEVEL% EQU 0 (
    ECHO    SUCCESS! All changes pushed.
) ELSE (
    ECHO    Push may have failed. Check errors above.
)
ECHO ==========================================
PAUSE
