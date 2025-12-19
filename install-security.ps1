# Security & Scalability Enhancement Setup Script

Write-Host "Installing security and scalability packages..." -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install express-mongo-sanitize express-xss-sanitizer morgan

Write-Host ""
Write-Host "✅ Security packages installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 New features added:" -ForegroundColor Cyan
Write-Host "   - Rate limiting (DDoS protection)" -ForegroundColor White
Write-Host "   - MongoDB injection prevention" -ForegroundColor White
Write-Host "   - XSS attack prevention" -ForegroundColor White
Write-Host "   - Enhanced security headers (Helmet)" -ForegroundColor White
Write-Host "   - Request/Error logging" -ForegroundColor White
Write-Host "   - Database connection pooling" -ForegroundColor White
Write-Host "   - Environment validation" -ForegroundColor White
Write-Host "   - Enhanced file upload security" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Update your JWT_SECRET in backend/.env" -ForegroundColor Yellow
Write-Host "   Use a strong 32+ character random string!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 See SECURITY.md for complete documentation" -ForegroundColor Cyan

# Return to root directory
Set-Location -Path $PSScriptRoot
