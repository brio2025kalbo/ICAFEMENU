@echo off
reg import "%~dp0deny.reg"
rem taskkill /f /im explorer.exe
rem start explorer.exe
