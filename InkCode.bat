@echo off
REM InkCode Launcher - removes ELECTRON_RUN_AS_NODE to ensure Electron runs in app mode
REM This is necessary because some environments (e.g. WorkBuddy) set ELECTRON_RUN_AS_NODE=1

set ELECTRON_RUN_AS_NODE=
"%~dp0node_modules\electron\dist\electron.exe" "%~dp0"
