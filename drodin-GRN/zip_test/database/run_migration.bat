@echo off
echo ========================================
echo       DrOdin Database Migration
echo ========================================
echo.

sqlcmd -S localhost -d Drodin -E -b -i "%~dp0Add_New_Saleable_Scratch_To_GRNDetails.sql"

if errorlevel 1 (
    echo.
    echo Migration FAILED. Check SQL Server connection.
    pause
    exit /b 1
)

echo.
echo Migration completed successfully!
pause
