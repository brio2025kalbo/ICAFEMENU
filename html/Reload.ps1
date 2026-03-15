# Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted

# 强制终止进程及其子进程（等效于 taskkill /f /im iCafeMenu.exe /t）
Stop-Process -Name "iCafeMenu" -Force -ErrorAction SilentlyContinue
 
Start-Sleep -Seconds 1
cd ..
# 启动程序并指定调试端口（等效于 ./iCafeMenu.exe --remote-debugging-port=9222）
& ".\iCafeMenu.exe" --remote-debugging-port=9222