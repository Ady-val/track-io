@echo off
setlocal enabledelayedexpansion
REM Track.IO - Script unificado para gestionar entornos Docker (SQL Server)
REM Uso: run.bat [db-init|dev|test|prod|down]

cd /d %~dp0

set CMD=%~1
if "%CMD%"=="" goto :show_help
if /i "%CMD%"=="help" goto :show_help
if /i "%CMD%"=="db-init" goto :cmd_db_init
if /i "%CMD%"=="dev" goto :cmd_dev
if /i "%CMD%"=="test" goto :cmd_test
if /i "%CMD%"=="prod" goto :cmd_prod
if /i "%CMD%"=="down" goto :cmd_down
goto :show_help

:show_help
echo ========================================
echo Track.IO - Comandos disponibles
echo ========================================
echo.
echo   run.bat db-init              Crea red y contenedor SQL Server (requerido antes de prod)
echo   run.bat dev                  Levanta entorno de desarrollo
echo   run.bat test                 Levanta entorno de testing
echo   run.bat prod                 Levanta produccion (requiere db-init previo)
echo   run.bat down [dev^|test^|prod]  Detiene el entorno indicado
echo.
echo Ejemplos:
echo   run.bat db-init
echo   run.bat prod
echo   run.bat down prod
echo.
exit /b 0

:cmd_db_init
call :do_db_init
exit /b %ERRORLEVEL%

:cmd_dev
call :do_dev
exit /b %ERRORLEVEL%

:cmd_test
call :do_test
exit /b %ERRORLEVEL%

:cmd_prod
call :do_prod
exit /b %ERRORLEVEL%

:cmd_down
set DOWN_ENV=%~2
if "%DOWN_ENV%"=="" set DOWN_ENV=dev
call :do_down
exit /b %ERRORLEVEL%

REM ========== db-init ==========
:do_db_init
echo.
echo [db-init] Creando base de datos SQL Server para produccion...
echo.

if not exist .env.production (
    echo Error: No se encontro .env.production
    echo   copy env.production.template .env.production
    echo   Edita .env.production con MSSQL_SA_PASSWORD_PROD
    exit /b 1
)

set MSSQL_SA_PASSWORD_PROD=
set MSSQL_PID=Express
set MSSQL_PORT_PROD=1434
for /f "usebackq tokens=2 delims==" %%a in ('findstr /B "MSSQL_SA_PASSWORD_PROD=" "%~dp0.env.production" 2^>nul') do set MSSQL_SA_PASSWORD_PROD=%%a
for /f "usebackq tokens=2 delims==" %%a in ('findstr /B "MSSQL_PID=" "%~dp0.env.production" 2^>nul') do set MSSQL_PID=%%a
for /f "usebackq tokens=2 delims==" %%a in ('findstr /B "MSSQL_PORT_PROD=" "%~dp0.env.production" 2^>nul') do set MSSQL_PORT_PROD=%%a

if "!MSSQL_SA_PASSWORD_PROD!"=="" (
    echo Error: MSSQL_SA_PASSWORD_PROD no esta definida en .env.production
    exit /b 1
)

echo Creando red Docker...
docker network create track_iq_production_sql_server 2>nul

docker ps -a --format "{{.Names}}" | findstr /C:"track-io-sqlserver-prod" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker ps --format "{{.Names}}" | findstr /C:"track-io-sqlserver-prod" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo SQL Server ya esta corriendo.
        goto :db_init_wait
    )
    echo Iniciando contenedor existente...
    docker start track-io-sqlserver-prod
) else (
    echo Creando contenedor SQL Server...
    setlocal disabledelayedexpansion
    docker run -d --name track-io-sqlserver-prod --network track_iq_production_sql_server --restart unless-stopped -e ACCEPT_EULA=Y -e "MSSQL_SA_PASSWORD=%MSSQL_SA_PASSWORD_PROD%" -e MSSQL_PID=%MSSQL_PID% -p %MSSQL_PORT_PROD%:1433 -v sqlserver_prod_data:/var/opt/mssql mcr.microsoft.com/mssql/server:2022-latest
    endlocal
)

:db_init_wait
echo Esperando a que SQL Server acepte conexiones...
set /a RETRIES=0
:db_init_retry
setlocal disabledelayedexpansion
docker exec track-io-sqlserver-prod /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "%MSSQL_SA_PASSWORD_PROD%" -Q "SELECT 1" -C >nul 2>&1
endlocal
if %ERRORLEVEL% equ 0 (
    echo SQL Server listo.
    exit /b 0
)
set /a RETRIES+=1
if !RETRIES! geq 12 (
    echo Error: SQL Server no respondio en 60 segundos
    exit /b 1
)
timeout /t 5 /nobreak >nul
goto :db_init_retry

REM ========== dev ==========
:do_dev
echo.
echo [dev] Iniciando entorno de desarrollo...
echo.

if not exist .env (
    if exist env.example (
        echo Creando .env desde env.example...
        copy env.example .env
    )
)

call :detect_host_ip

set REBUILD_NEEDED=1
if exist .env.host (
    for /f "tokens=2 delims==" %%a in ('findstr /C:"HOST_IP=" "%~dp0.env.host" 2^>nul') do set OLD_IP=%%a
    if "!OLD_IP!"=="%HOST_IP%" set REBUILD_NEEDED=0
)

echo HOST_IP=%HOST_IP% > .env.host
echo VITE_API_URL=http://%HOST_IP%:3000 >> .env.host

docker compose -f docker-compose.yml down 2>nul
if %REBUILD_NEEDED%==1 (
    docker compose -f docker-compose.yml --env-file .env --env-file .env.host build --no-cache nginx
    docker compose -f docker-compose.yml --env-file .env --env-file .env.host up -d --build
) else (
    docker compose -f docker-compose.yml --env-file .env --env-file .env.host up -d
)
if %ERRORLEVEL% neq 0 exit /b 1
echo.
echo Desarrollo iniciado. Dashboard: http://localhost:80  Backend: http://localhost:3000
exit /b 0

REM ========== test ==========
:do_test
echo.
echo [test] Iniciando entorno de testing...
echo.
docker compose -f docker-compose.test.yml down 2>nul
docker compose -f docker-compose.test.yml up -d --build
if %ERRORLEVEL% neq 0 exit /b 1
timeout /t 10 /nobreak >nul
echo.
echo Testing iniciado. Backend: http://localhost:3001  SQL Server: localhost:1435
exit /b 0

REM ========== prod ==========
:do_prod
echo.
echo [prod] Iniciando entorno de produccion...
echo.

if not exist .env.production (
    echo Error: No se encontro .env.production
    echo   copy env.production.template .env.production
    exit /b 1
)

docker ps --format "{{.Names}}" | findstr /C:"track-io-sqlserver-prod" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: SQL Server no esta corriendo. Ejecuta primero: run.bat db-init
    exit /b 1
)

call :detect_host_ip
docker network create track_iq_production_sql_server 2>nul

set CUSTOM_CORS=
if exist .env.production (
    for /f "tokens=2 delims==" %%a in ('findstr /C:"CORS_ORIGIN_PROD=" "%~dp0.env.production" 2^>nul') do set CUSTOM_CORS=%%a
    set CUSTOM_CORS=!CUSTOM_CORS:"=!
)
if not "!CUSTOM_CORS!"=="" (
    if not "!CUSTOM_CORS!"=="*" (
        set CORS_ORIGIN=http://localhost:80,http://%HOST_IP%:80,!CUSTOM_CORS!
    ) else (
        set CORS_ORIGIN=http://localhost:80,http://%HOST_IP%:80
    )
) else (
    set CORS_ORIGIN=http://localhost:80,http://%HOST_IP%:80
)

set REBUILD_NEEDED=1
if exist .env.host.prod (
    for /f "tokens=2 delims==" %%a in ('findstr /C:"HOST_IP=" "%~dp0.env.host.prod" 2^>nul') do set OLD_IP=%%a
    if "!OLD_IP!"=="%HOST_IP%" set REBUILD_NEEDED=0
)

echo HOST_IP=%HOST_IP% > .env.host.prod
echo VITE_API_URL_PROD=http://%HOST_IP%:3000 >> .env.host.prod
echo CORS_ORIGIN_PROD=%CORS_ORIGIN% >> .env.host.prod

docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod down 2>nul
if %REBUILD_NEEDED%==1 (
    docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod build --no-cache nginx_prod
    docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod up -d --build
) else (
    docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod up -d
)
if %ERRORLEVEL% neq 0 exit /b 1
timeout /t 15 /nobreak >nul
echo.
echo Produccion iniciada. Dashboard: http://localhost:80  Backend: http://localhost:3000
exit /b 0

REM ========== down ==========
:do_down
echo.
if /i "%DOWN_ENV%"=="prod" (
    echo [down] Deteniendo produccion...
    if exist .env.production (
        docker compose -f docker-compose.prod.yml --env-file .env.production down
    ) else (
        docker compose -f docker-compose.prod.yml down
    )
) else if /i "%DOWN_ENV%"=="test" (
    echo [down] Deteniendo testing...
    docker compose -f docker-compose.test.yml down
) else (
    echo [down] Deteniendo desarrollo...
    docker compose -f docker-compose.yml --env-file .env down
)
echo Listo.
exit /b 0

REM ========== detect_host_ip ==========
:detect_host_ip
set HOST_IP=
for /f "delims=" %%a in ('powershell -ExecutionPolicy Bypass -File "%~dp0get-host-ip.ps1" 2^>nul') do (
    set HOST_IP=%%a
    goto :ip_done
)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4.*192\.168\." /C:"IPv4.*10\." /C:"IPv4.*172\."') do (
    set HOST_IP=%%a
    goto :ip_done
)
:ip_done
set HOST_IP=%HOST_IP: =%
if "%HOST_IP%"=="" set HOST_IP=localhost
echo IP detectada: %HOST_IP%
exit /b 0
