@echo off
setlocal
cd /d "%~dp0"
title MOVA - application locale
where node >nul 2>nul
if errorlevel 1 (
  echo Installez Node.js 24 LTS depuis https://nodejs.org puis relancez ce fichier.
  pause
  exit /b 1
)
where docker >nul 2>nul
if errorlevel 1 (
  echo Installez et demarrez Docker Desktop, puis relancez ce fichier.
  echo Verifiez les conditions de licence de Docker Desktop pour votre usage.
  pause
  exit /b 1
)
if not exist node_modules\.bin\tsx.cmd (
  echo Premiere installation des dependances...
  call npm ci
  if errorlevel 1 goto failed
)
call npm run desktop
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo Le demarrage a echoue. Le message ci-dessus indique la cause.
echo Verifiez que Docker Desktop fonctionne et que Node.js 24 est installe.
pause
exit /b 1
