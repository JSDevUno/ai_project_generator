# 🤖 Universal AI Project Generator

> Generate complete, production-ready AI/ML projects with real-time progress tracking

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JSDevUno/ai_project_generator)

## ✨ Features

### 🎯 **Real-Time Progress Display**
- Live file-by-file generation tracking
- Server-Sent Events (SSE) for instant updates
- Beautiful progress modal with statistics
- Current file, next file preview, and completion status

### 📋 **Plan-Based Generation**
- AI generates detailed project plans
- Customize plans with natural language feedback
- Extracts exact structure from plans (no hardcoded defaults)
- Supports tree structure, bullet points, and nested formats

### 🤖 **AI/ML Optimized**
- Specialized prompts for AI/ML projects
- Production-ready code generation
- Comprehensive error handling
- GPU/CPU device management
- Model checkpointing and training loops

### 🎨 **Modern UI/UX**
- Clean, intuitive interface
- Responsive design
- Loading states and error handling
- Professional progress visualization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenRouter API key ([Get one here](https://openrouter.ai/))

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/JSDevUno/ai_project_generator.git
cd ai_project_generator
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

3. **Configure environment**
```bash
# Copy example env file
cp .env.example backend/.env

# Edit backend/.env and add your OpenRouter API key
OPENROUTER_API_KEY=your_key_here
```

4. **Run development servers**
```bash
# From root directory
npm run dev

# Or run separately:
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

5. **Open your browser**
```
http://localhost:5173
```

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**
- Click the "Deploy with Vercel" button above, or
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Import your GitHub repository
- Add environment variable: `OPENROUTER_API_KEY`
- Deploy!

3. **Update CORS**
- After deployment, update `backend/src/app.ts`
- Replace `'https://ai-project-generator.vercel.app'` with your actual Vercel URL

See [deploy.md](./deploy.md) for detailed deployment instructions.

## 🎯 How It Works

### 1. **Generate Plan**
- Enter project name and description
- AI generates a detailed project plan
- Review folder structure and file list

### 2. **Customize (Optional)**
- Provide feedback to modify the plan
- Add/remove features (Docker, ONNX, etc.)
- Change architecture or technologies

### 3. **Generate Project**
- Approve the plan
- Watch real-time progress as files are created
- Download complete project as ZIP

### 4. **Use Your Project**
- Extract ZIP file
- Follow README instructions
- Start training your AI model!

## 🏗️ Project Structure

```
ai_project_generator/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── ProjectForm.tsx
│   │   │   ├── PlanDisplay.tsx
│   │   │   ├── ProgressDisplay.tsx  # Real-time progress
│   │   │   └── ...
│   │   ├── services/        # API services
│   │   └── App.tsx
│   └── package.json
│
├── backend/                  # Express + TypeScript
│   ├── src/
│   │   ├── routes/          # API routes
│   │   │   ├── plan.ts      # Plan generation
│   │   │   └── code.ts      # Project generation + SSE
│   │   ├── services/        # Business logic
│   │   │   ├── planGenerator.ts
│   │   │   └── projectGenerator.ts  # Enhanced with progress
│   │   └── app.ts           # Express app
│   └── package.json
│
├── vercel.json              # Vercel configuration
├── package.json             # Root package.json
└── deploy.md                # Deployment guide
```

## 🔧 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Express** - Web framework
- **TypeScript** - Type safety
- **OpenRouter API** - AI model access
- **JSZip** - Project packaging
- **Server-Sent Events** - Real-time updates

## 📊 Features in Detail

### Real-Time Progress System
```typescript
// Progress events sent to frontend:
{
  type: 'generating',
  message: 'Generating src/train.py',
  currentFile: 3,
  totalFiles: 10,
  progress: 30,
  fileInfo: {
    path: 'src/train.py',
    type: 'python',
    description: 'Training script',
    size: '2.5KB',
    duration: '1250ms'
  },
  nextFile: {
    path: 'src/model.py',
    type: 'python'
  }
}
```

### Plan Structure Extraction
- Parses tree structures: `├── file.py`
- Parses bullet points: `- file.py # description`
- Extracts nested folders automatically
- No hardcoded defaults - purely plan-based

### AI/ML Optimized Prompts
- Specialized for ML workflows
- Includes proper imports (torch, tensorflow, sklearn)
- GPU/CPU device handling
- Model checkpointing
- Training loops with progress bars
- Data augmentation pipelines

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenRouter for AI model access
- Vercel for hosting
- The open-source community

## 📧 Contact

- GitHub: [@JSDevUno](https://github.com/JSDevUno)
- Repository: [ai_project_generator](https://github.com/JSDevUno/ai_project_generator)

---

Made with ❤️ by JSDevUno