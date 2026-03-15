taskkill /f /im OverwolfUpdater.exe /t
taskkill /f /im OverwolfStore.exe /t
taskkill /f /im Overwolf.exe /t
taskkill /f /im OverwolfHelper.exe /t
taskkill /f /im OverwolfHelper64.exe /t
taskkill /f /im OverwolfBrowser.exe /t
taskkill /f /im OverwolfLauncher.exe /t

sc delete OverwolfUpdater
timeout 2
del /F "%~dp0\icafemenu-update.log"
