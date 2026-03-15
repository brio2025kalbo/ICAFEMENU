rmdir /S /Q html\icons
rmdir /S /Q html\posters
rmdir /S /Q Log
rmdir /S /Q Users
rmdir /S /Q dump
rmdir /S /Q GPUCache
del /F html\js\cafe.js
del /F html\js\class.js
del /F html\js\games.js
del /F html\js\locale.js
del /F html\js\pc.js
rem del /F html\js\shop.js
del /F html\js\icafe.js
del /F iCafeMenuBt.dll
del /F html\js\icafe2.js
del /F "html\js\--icafe.js"
del /F "html\js\cafe - Copy.js"
del /F "tools\icafecloudrank\session.js"
del /F cmd_client.bat
del /F client_share.bat
del /F *.log
call "%~dp0overwolf\PreUpdate.bat"