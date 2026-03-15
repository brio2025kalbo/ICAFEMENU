call "%~dp0stop-novnc.bat"

"%~dp0tvnserver.exe" -install -silent
"%~dp0tvnserver.exe" -stop -silent

Reg.exe import "%~dp0vnc-hkcu.reg"
Reg.exe import "%~dp0vnc-hklm.reg"

"%~dp0tvnserver.exe" -start -silent