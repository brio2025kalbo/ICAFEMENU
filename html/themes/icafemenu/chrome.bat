@echo off

@REM [
@REM  {
@REM   "strCmd": "PCInfo",
@REM   "strParam": "{\"pc_name\":\"ICC-LINK-BOOT\",\"pc_turn_off_monitor_seconds\":0,\"version_date\":\"2025-08-12\"}"
@REM  }
@REM ]

set "params=OnCommand=[{\"strCmd\":\"PCInfo\",\"strParam\":\"{\\\"pc_name\\\":\\\"ICC-LINK-BOOT\\\",\\\"pc_turn_off_monitor_seconds\\\":0,\\\"version_date\\\":\\\"2025-08-12\\\"}\"}]"
set "HTML_FILE=%~dp0main.htm?%params%"
If exist "C:\Program Files\Google\Chrome\Application\chrome.exe" ("C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir=log "file:///%HTML_FILE%")
If exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" ("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir=log "file:///%HTML_FILE%")
If exist "C:\Program Files (x86)\Microsoft\Edge\Application\Microsoft Edge.exe" ("C:\Program Files (x86)\Microsoft\Edge\Application\Microsoft Edge.exe"  --disable-web-security --user-data-dir=log "file:///%HTML_FILE%")