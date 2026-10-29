@echo off
setlocal
cd /d "%~dp0"
title MOVA - espace personnel
if not exist ".runtime\node.exe" (
  echo Le moteur de MOVA est absent. Extrayez entierement l'archive avant de lancer l'application.
  pause
  exit /b 1
)
".runtime\node.exe" "%~dp0app.mjs"
if errorlevel 1 (
  echo.
  echo MOVA n'a pas pu demarrer. Le message ci-dessus indique la cause.
  echo Gardez tous les fichiers du dossier et consultez OUVRIR-MOVA.txt.
  pause
  exit /b 1
)
