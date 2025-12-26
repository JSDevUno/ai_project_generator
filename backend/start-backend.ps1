# Kill any existing processes on port 3002
Write-Host "🔍 Checking for existing processes on port 3002..."
$processes = netstat -ano | findstr :3002
if ($processes) {
    Write-Host "⚠️ Found existing processes on port 3002"
    $pids = ($processes | ForEach-Object { ($_ -split '\s+')[-1] }) | Sort-Object -Unique
    foreach ($pid in $pids) {
        if ($pid -and $pid -ne "0") {
            Write-Host "🔪 Killing process $pid"
            taskkill /PID $pid /F 2>$null
        }
    }
    Start-Sleep -Seconds 2
}

Write-Host "🚀 Starting backend server..."
npm run dev