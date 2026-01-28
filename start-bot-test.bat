@echo off
echo ========================================
echo   US VISA APPOINTMENT BOT (TEST MODE)
echo ========================================
echo.
echo Email: rajdeeppandher05@gmail.com
echo Target: 2026 dates
echo Mode: DRY RUN (will NOT actually book)
echo.
echo Bot will run continuously and show what it would book
echo Press Ctrl+C to stop
echo.
echo ========================================
echo.

node src/index.js -c 2028-01-01 -t 2026-12-31 --dry-run

pause
