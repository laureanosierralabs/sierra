@echo off
REM Arranca el dashboard y abre el navegador. Doble clic para usar.
cd /d "%~dp0dashboard"

echo Iniciando Sistema Operativo...

REM Si no estan las dependencias, instalarlas la primera vez
if not exist "node_modules" (
  echo Primera vez: instalando dependencias, puede tardar unos minutos...
  call pnpm install
)

REM Abrir el navegador cuando el server este listo (espera unos segundos)
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3737"

REM Levantar el server (queda corriendo en esta ventana)
call pnpm dev --port 3737
