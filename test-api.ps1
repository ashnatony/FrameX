# Test ScreenX API
param(
    [string]$MovieName = "The Matrix"
)

Write-Host "🎬 Testing ScreenX API with movie: '$MovieName'" -ForegroundColor Cyan
Write-Host ""

$body = @{
    movieName = $MovieName
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/movie/generate-script" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Movie: $($response.movieName)" -ForegroundColor Yellow
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Generated Script:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
    Write-Host $response.script
    Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure:" -ForegroundColor Yellow
    Write-Host "   1. Server is running (npm run start:dev)" -ForegroundColor White
    Write-Host "   2. API keys are configured in .env file" -ForegroundColor White
    Write-Host "   3. Port 3000 is available" -ForegroundColor White
}
