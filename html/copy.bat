xcopy * /dev/html/ -Y

@echo off
chcp 65001 >nul
echo 正在复制文件到 dev\html\...

:: 创建目标目录（如果不存在）


:: 使用 xcopy 复制所有文件和子目录
xcopy * "\dev\html\" /E /Y /I /H /R /K

if %errorlevel% equ 0 (
    echo 复制完成！
) else (
    echo 复制过程中出现错误！
    pause
)