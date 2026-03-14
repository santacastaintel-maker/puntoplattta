@echo off
echo ==============================================
echo     INICIANDO PUNTOPLATA - MODO LOCAL
echo ==============================================
echo.
echo Levantando el sistema, por favor espera...

:: Asegurar que estamos en el directorio correcto
cd /d "%~dp0"
cd dist

:: Intentar primero con Node (npx) si falla, intentara con Python
echo Probando instalacion...
start http://localhost:8000

:: Usar Python que suele venir preinstalado y no requiere descargas extra
echo Mantenga esta ventana abierta para usar PUNTOPLATA.
python -m http.server 8000

:: Si python falla, intentarlo con npx en la misma ventana (sin comando start extra)
if %errorlevel% neq 0 (
    echo.
    echo Intentando con Node.js...
    cd ..
    npx -y serve -s dist -l 8000
)

pause
