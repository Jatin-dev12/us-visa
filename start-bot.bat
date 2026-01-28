@echo off
echo ========================================
echo   US VISA APPOINTMENT BOT
echo ========================================
echo.
echo Email: rajdeeppandher05@gmail.com
echo Target: 2026 dates
echo.
echo Bot will run continuously and auto-book when 2026 dates appear
echo Press Ctrl+C to stop
echo.
echo ========================================
echo.

node src/index.js -c 2028-01-01 -t 2026-12-31

pause
