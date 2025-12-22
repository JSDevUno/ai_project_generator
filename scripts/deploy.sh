#!/bin/bash

# 🚀 AI Project Generator - Deployment Script
echo "🤖 AI Project Generator - Deployment Script"
echo "============================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git branch -M main
fi

# Check for required environment variables
echo "🔍 Checking environment setup..."
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found. Creating from example..."
    cp .env.example backend/.env
    echo "📝 Please edit backend/.env and add your OPENROUTER_API_KEY"
    echo "   You can get one from: https://openrouter.ai/"
fi

# Install dependencies
echo "📦 Installing dependencies..."
echo "   Installing root dependencies..."
npm install

echo "   Installing backend dependencies..."
cd backend && npm install && cd ..

echo "   Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Build and test locally
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Git operations
echo "📤 Preparing for deployment..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "feat: Deploy AI Project Generator with real-time progress tracking

- Add real-time progress display with Server-Sent Events
- Implement plan-based project structure generation
- Add comprehensive error handling and validation
- Create production-ready Vercel deployment configuration
- Update environment handling for frontend/backend
- Add professional UI with progress visualization"
fi

# Check if remote origin exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "🎯 Next Steps:"
        echo "1. Go to https://vercel.com/dashboard"
        echo "2. Click 'New Project'"
        echo "3. Import your GitHub repository"
        echo "4. Add environment variable: OPENROUTER_API_KEY"
        echo "5. Deploy!"
        echo ""
        echo "📚 Or use the deploy button in README.md"
    else
        echo "❌ Failed to push to GitHub"
        exit 1
    fi
else
    echo "⚠️  No git remote found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/JSDevUno/ai_project_generator.git"
    echo "   Then run this script again."
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo "📖 See deploy.md for detailed deployment instructions"