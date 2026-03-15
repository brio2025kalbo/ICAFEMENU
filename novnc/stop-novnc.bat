taskkill /f /im start-novnc.bat
"%~dp0tvnserver.exe" -remove -silent
"%~dp0tvnserver.exe" -stop -silent