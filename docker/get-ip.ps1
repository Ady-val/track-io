# Script para detectar la IP del equipo
# Prioriza 192.168.x.x, luego 10.x.x.x, luego 172.16-31.x.x

$ip = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' } | Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
    $ip = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '10.*' } | Select-Object -First 1 -ExpandProperty IPAddress
}

if (-not $ip) {
    $ip = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '172.*' } | Select-Object -First 1 -ExpandProperty IPAddress
}

if ($ip) {
    Write-Output $ip
} else {
    Write-Output "localhost"
}


