@echo off
REM 本地预览实验页（UTF-8）；勿用 file:// 直接打开 index.html
chcp 65001 >nul
cd /d "%~dp0"
echo 浏览器打开: http://127.0.0.1:8080/
python -m http.server 8080 --bind 127.0.0.1
