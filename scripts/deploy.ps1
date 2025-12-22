# 🚀 AI Project Generator - Deployment Script
Write-Host "🤖 AI Project Generator - Deployment Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Check for required environment variables
Write-Host "🔍 Checking environment setup..." -ForegroundColor Blue
if (-not (Test-Path "backend/.env")) {
    Write-Host "⚠️  Warning: backend/.env not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item ".env.example" "backend/.env"
    Write-Host "📝 Please edit backend/.env and add your OPENROUTER_API_KEY" -ForegroundColor Yellow
    Write-Host "   You can get one from: https://openrouter.ai/" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
Write-Host "   Installing root dependencies..." -ForegroundColor Gray
npm install

Write-Host "   Installing backend dependencies..." -ForegroundColor Gray
Set-Location backend
npm install
Set-Location ..

Write-Host "   Installing frontend dependencies..." -ForegroundColor Gray
Set-Location frontend
npm install
Set-Location ..

# Build and test locally
Write-Host "🔨 Building project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix the errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Git operations
Write-Host "📤 Preparing for deployment..." -ForegroundColor Blue
git add .

# Check if there are changes to commit
$changes = git diff --staged --name-only
if ($changes) {
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m "feat: Deploy AI Project Generator with real-time progress tracking

- Add real-time progress display with Server-Sent Events
- Implement plan-based project structure generation
- Add comprehensive error handling and validation
- Create production-ready Vercel deployment configuration
- Update environment handling for frontend/backend
- Add professional UI with progress visualization"
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Gray
}

# Check if remote origin exists
try {
    $remote = git remote get-url origin 2>$null
    if ($remote) {
        Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Blue
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
            Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
            Write-Host "2. Click 'New Project'" -ForegroundColor White
            Write-Host "3. Import your GitHub repository" -ForegroundColor White
            Write-Host "4. Add environment variable: OPENROUTER_API_KEY" -ForegroundColor White
            Write-Host "5. Deploy!" -ForegroundColor White
            Write-Host ""
            Write-Host "📚 Or use the deploy button in README.md" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "⚠️  No git remote found. Please add your GitHub repository:" -ForegroundColor Yellow
    Write-Host "   git remote add origin https://github.com/JSDevUno/ai_project_generator.git" -ForegroundColor White
    Write-Host "   Then run this script again." -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
Write-Host "📖 See deploy.md for detailed deployment instructions" -ForegroundColor Yellow