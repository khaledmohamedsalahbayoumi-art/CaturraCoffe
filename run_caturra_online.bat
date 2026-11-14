@echo off
chcp 65001 >nul
title Caturra Coffee - تشغيل النظام ومشاركته خارجياً
echo ========================================================
echo       تشغيل نظام كاتورا للقهوة المختصة (ERP + Store)
echo ========================================================
echo.

:: 1. تشغيل سيرفر التطبيق
start /b cmd /c "npm.cmd run dev"

echo جاري تهيئة نفق البث السحابي (Cloudflare Tunnel)...
timeout /t 3 >nul

:: 2. تشغيل نفق Cloudflare ببروتوكول http2 للاستقرار التام
if exist "%~dp0cloudflared.exe" (
    "%~dp0cloudflared.exe" tunnel --protocol http2 --url http://127.0.0.1:5174
) else if exist "%TEMP%\cloudflared.exe" (
    "%TEMP%\cloudflared.exe" tunnel --protocol http2 --url http://127.0.0.1:5174
) else (
    echo جاري تحميل أداة البث السحابي للمرة الأولى...
    curl.exe -L -o "%TEMP%\cloudflared.exe" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
    "%TEMP%\cloudflared.exe" tunnel --protocol http2 --url http://127.0.0.1:5174
)

pause
