# Script para detectar la IP de la interfaz de red principal
# Excluye interfaces virtuales (Docker, Hyper-V, WSL, etc.)

$route = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object { $_.NextHop -ne "0.0.0.0" } | Select-Object -First 1

if ($route) {
    $ifIndex = $route.InterfaceIndex
    $adapter = Get-NetAdapter -InterfaceIndex $ifIndex -ErrorAction SilentlyContinue
    
    if ($adapter -and $adapter.Status -eq "Up" -and $adapter.InterfaceDescription -notmatch "Docker|Hyper-V|WSL|Virtual|VMware|VirtualBox|Loopback") {
        $ip = Get-NetIPAddress -InterfaceIndex $ifIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
              Where-Object { $_.IPAddress -notmatch "^169\.254\." -and $_.IPAddress -notmatch "^127\." } | 
              Select-Object -First 1 -ExpandProperty IPAddress
        
        if ($ip) {
            Write-Output $ip
            exit 0
        }
    }
}

exit 1
