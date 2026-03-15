timeout 2
if "%1" EQU "" goto skipCopy
if "%1" EQU "127.0.0.1" goto skipCopy
taskkill /f /im OverwolfUpdater.exe /t
taskkill /f /im OverwolfStore.exe /t
taskkill /f /im Overwolf.exe /t
taskkill /f /im OverwolfHelper.exe /t
taskkill /f /im OverwolfHelper64.exe /t
taskkill /f /im OverwolfBrowser.exe /t
taskkill /f /im OverwolfLauncher.exe /t
robocopy \\%1\iCafeMenu "%~dp0\" * /E /V /XJ /SL /XD "\\%1\iCafeMenu\overwolf\LocalAppData" /XF "\\%1\iCafeMenu\icafemenu-update.log" > "%~dp0\icafemenu-update.log"

:skipCopy
"%~dp0\iCafeMenu.exe" -runasadmin