@echo off
setlocal
echo ===================================================
echo  DrOdin GRN - Full Build and Package
echo ===================================================

echo.
echo [1/3] Building Angular Frontend (Production)...
cd /d "%~dp0drodin-GRN"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error building frontend!
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Publishing .NET 8 Backend API (Release)...
cd /d "%~dp0"
dotnet publish APIDRODIN/APIDRODIN/APIDRODIN/APIDRODIN.csproj -c Release -o APIDRODIN/publish
if %ERRORLEVEL% NEQ 0 (
    echo Error publishing backend!
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Packaging Backend and Database into drodin-GRN\dist...
if not exist "%~dp0drodin-GRN\dist\backend" mkdir "%~dp0drodin-GRN\dist\backend"
if not exist "%~dp0drodin-GRN\dist\database" mkdir "%~dp0drodin-GRN\dist\database"

xcopy /E /Y /I "%~dp0APIDRODIN\publish\*" "%~dp0drodin-GRN\dist\backend\"
copy /Y "%~dp0Add_New_Saleable_Scratch_To_GRNDetails.sql" "%~dp0drodin-GRN\dist\database\"
xcopy /E /Y /I "%~dp0APIDRODIN\publish\*" "%~dp0publish\"

echo.
echo ===================================================
echo  PACKAGE COMPLETE!
echo  Single deployment folder ready at:
echo  %~dp0drodin-GRN\dist
echo ===================================================

pause
