import dotenv from 'dotenv';
import JSZip from 'jszip';

dotenv.config();

export interface ProjectFile {
    path: string;
    content: string;
    type: 'python' | 'markdown' | 'config' | 'text' | 'yaml' | 'json' | 'dockerfile';
}

export interface ProjectStructure {
    files: ProjectFile[];
    folders: string[];
}

export interface PlanStructure {
    folders: string[];
    files: Array<{
        path: string;
        type: string;
        description: string;
    }>;
}

export class ProjectGenerator {
    private apiKey: string;
    private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY!;
    }

    async generateProject(
        projectName: string,
        instruction: string,
        plan: string,
        model?: string,
        progressCallback?: (progress: any) => void
    ): Promise<Buffer> {
        const selectedModel = model || 'kwaipilot/kat-coder-pro:free';

        console.log(`[ProjectGenerator] 🎯 ENHANCED: Following plan structure strictly...`);
        console.log(`[ProjectGenerator] Using model: ${selectedModel}`);

        // Step 1: Extract exact structure from plan
        const planStructure = this.extractStructureFromPlan(plan);
        console.log(`[ProjectGenerator] ✅ Extracted ${planStructure.folders.length} folders and ${planStructure.files.length} files from plan`);

        // Send initial progress
        progressCallback?.({
            type: 'start',
            message: 'Starting AI/ML Project Generation',
            totalFiles: planStructure.files.length,
            currentFile: 0,
            progress: 0
        });

        // Step 2: Generate all files following the plan exactly
        const files: ProjectFile[] = [];
        const totalFiles = planStructure.files.length;

        console.log(`\n🚀 [ProjectGenerator] Starting AI/ML Project Generation`);
        console.log(`📊 [ProjectGenerator] Progress: 0/${totalFiles} files (0%)`);

        for (let i = 0; i < planStructure.files.length; i++) {
            const fileInfo = planStructure.files[i];
            const progress = Math.round(((i + 1) / totalFiles) * 100);

            // Send progress update to frontend
            progressCallback?.({
                type: 'generating',
                message: `Generating ${fileInfo.path}`,
                currentFile: i + 1,
                totalFiles,
                progress,
                fileInfo: {
                    path: fileInfo.path,
                    type: fileInfo.type,
                    description: fileInfo.description
                }
            });

            console.log(`\n📄 [${i + 1}/${totalFiles}] Generating: ${fileInfo.path}`);
            console.log(`🔧 Type: ${fileInfo.type} | 📝 ${fileInfo.description}`);

            const startTime = Date.now();
            const content = await this.generateFileFromPlan(projectName, instruction, plan, fileInfo, selectedModel);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Clean content
            const cleanedContent = this.cleanContent(content);
            const fileSize = Math.round(cleanedContent.length / 1024 * 100) / 100;

            files.push({
                path: fileInfo.path,
                content: cleanedContent,
                type: this.mapFileType(fileInfo.type)
            });

            // Send file completion update
            progressCallback?.({
                type: 'file_complete',
                message: `Generated ${fileInfo.path}`,
                currentFile: i + 1,
                totalFiles,
                progress,
                fileInfo: {
                    path: fileInfo.path,
                    type: fileInfo.type,
                    size: `${fileSize}KB`,
                    duration: `${duration}ms`
                },
                nextFile: i < planStructure.files.length - 1 ? {
                    path: planStructure.files[i + 1].path,
                    type: planStructure.files[i + 1].type
                } : null
            });

            console.log(`✅ Generated ${fileInfo.path} (${fileSize}KB) in ${duration}ms`);

            // Show current status
            if (i < planStructure.files.length - 1) {
                const nextFile = planStructure.files[i + 1];
                console.log(`⏭️  Next: ${nextFile.path} (${nextFile.type})`);
            }
        }

        // Send validation progress
        progressCallback?.({
            type: 'validating',
            message: 'Validating project structure...',
            progress: 95
        });

        console.log(`\n🎉 [ProjectGenerator] All files generated successfully!`);

        // Step 3: Validate project structure
        this.validateProjectStructure(planStructure, files);

        // Send packaging progress
        progressCallback?.({
            type: 'packaging',
            message: 'Creating project archive...',
            progress: 98
        });

        // Step 4: Create zip file
        console.log(`\n📦 [ProjectGenerator] Creating project archive...`);
        const zipBuffer = await this.createZipFile(projectName, { files, folders: planStructure.folders });

        // Final statistics
        const totalSize = files.reduce((sum, file) => sum + file.content.length, 0);
        const totalSizeKB = Math.round(totalSize / 1024 * 100) / 100;

        // Send completion with statistics
        progressCallback?.({
            type: 'complete',
            message: 'AI/ML Project Generated Successfully!',
            progress: 100,
            statistics: {
                totalFiles: files.length,
                totalFolders: planStructure.folders.length,
                totalSize: `${totalSizeKB}KB`,
                pythonFiles: files.filter(f => f.type === 'python').length,
                configFiles: files.filter(f => f.type === 'yaml' || f.type === 'json').length,
                docFiles: files.filter(f => f.type === 'markdown').length,
                dockerFiles: files.filter(f => f.type === 'dockerfile').length
            }
        });

        console.log(`\n🎉 [ProjectGenerator] 🤖 AI/ML Project Generated Successfully!`);
        console.log(`🚀 Ready for AI/ML development!`);

        return zipBuffer;
    }

    /**
     * Extract exact project structure from the plan text - FIXED FOR NESTED TREE FORMAT
     */
    private extractStructureFromPlan(plan: string): PlanStructure {
        console.log('[ProjectGenerator] 🔍 Extracting structure from plan...');

        const folders: string[] = [];
        const files: Array<{ path: string; type: string; description: string }> = [];
        const lines = plan.split('\n');
        const folderStack: string[] = []; // Track current folder path based on indentation

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty lines and headers
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('=')) {
                continue;
            }

            // Calculate indentation level (assuming 4 spaces per level)
            const indentLevel = Math.floor((line.match(/^(\s*)/)?.[1]?.length || 0) / 4);

            // Parse tree structure format with flexible matching
            const treeMatch = line.match(/^[\s│├└─]*([a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]*)*\/?)(?:\s*#\s*(.*))?$/);
            if (treeMatch) {
                const pathItem = treeMatch[1];
                const description = treeMatch[2] || '';

                // Adjust folder stack based on indentation - CORRECTED LOGIC
                folderStack.length = Math.max(0, indentLevel);

                if (pathItem.endsWith('/')) {
                    // It's a folder
                    const folderName = pathItem.replace(/\/$/, '');
                    const fullPath = folderStack.length > 0 ?
                        folderStack.join('/') + '/' + folderName :
                        folderName;

                    if (fullPath && !folders.includes(fullPath)) {
                        folders.push(fullPath);
                    }

                    // Add to stack for nested items
                    folderStack.push(folderName);

                } else if (pathItem.includes('.')) {
                    // It's a file
                    const fullPath = folderStack.length > 0 ?
                        folderStack.join('/') + '/' + pathItem :
                        pathItem;

                    if (!files.some(f => f.path === fullPath)) {
                        const extension = pathItem.split('.').pop()?.toLowerCase() || '';
                        const type = this.getFileTypeFromExtension(extension);

                        files.push({
                            path: fullPath,
                            type,
                            description: description || this.generateDefaultDescription(pathItem)
                        });
                    }
                } else {
                    // It's a folder without trailing slash
                    const fullPath = folderStack.length > 0 ?
                        folderStack.join('/') + '/' + pathItem :
                        pathItem;

                    if (fullPath && !folders.includes(fullPath)) {
                        folders.push(fullPath);
                    }

                    // Add to stack for nested items
                    folderStack.push(pathItem);
                }
            }
        }

        // Add parent folders from file paths (backup mechanism)
        files.forEach(file => {
            const pathParts = file.path.split('/');
            if (pathParts.length > 1) {
                for (let i = 1; i < pathParts.length; i++) {
                    const folderPath = pathParts.slice(0, i).join('/');
                    if (folderPath && !folders.includes(folderPath)) {
                        folders.push(folderPath);
                    }
                }
            }
        });

        console.log(`[ProjectGenerator] 📁 Folders (${folders.length}): ${folders.join(', ')}`);
        console.log(`[ProjectGenerator] 📄 Files (${files.length}): ${files.map(f => f.path).join(', ')}`);

        // If no structure found in plan, warn but don't add defaults
        if (files.length === 0 && folders.length === 0) {
            console.warn('[ProjectGenerator] ⚠️  No project structure found in plan! Plan may be malformed.');
            console.warn('[ProjectGenerator] ⚠️  Please ensure the plan contains explicit file and folder structure.');
        }

        return { folders, files };
    }

    /**
     * Generate file content based on plan structure
     */
    private async generateFileFromPlan(
        projectName: string,
        instruction: string,
        plan: string,
        fileInfo: { path: string; type: string; description: string },
        model: string
    ): Promise<string> {
        const prompt = `You are an expert AI/ML engineer generating production-ready code for: ${fileInfo.path}

🤖 AI PROJECT CONTEXT:
Project: ${projectName}
Task: ${instruction}
File Purpose: ${fileInfo.description}
File Type: ${fileInfo.type}

📋 COMPLETE PROJECT PLAN:
${plan}

🎯 AI/ML SPECIFIC REQUIREMENTS:
1. Generate ONLY raw file content - NO markdown blocks, NO explanations, NO wrapper text
2. Follow exact AI/ML architecture and specifications from the plan
3. Ensure syntactically perfect, immediately runnable code
4. Include all ML/AI imports (torch, tensorflow, sklearn, numpy, etc.)
5. Implement proper AI/ML error handling and validation
6. Use production-ready ML patterns and best practices

🐍 PYTHON AI/ML FILES - MUST INCLUDE:
- Comprehensive type hints for all functions and variables
- Detailed docstrings explaining ML concepts and parameters
- Proper exception handling for model loading, training, inference
- GPU/CPU device handling and memory management
- Model checkpointing and state management
- Logging with ML metrics (loss, accuracy, F1, etc.)

🏋️ TRAINING SCRIPTS - MUST INCLUDE:
- Epoch-by-epoch progress bars with tqdm
- Real-time loss and metric tracking
- Model validation after each epoch
- Best model checkpointing
- Learning rate scheduling
- Early stopping mechanisms
- Comprehensive logging of training statistics

📊 DATA PROCESSING - MUST INCLUDE:
- Data validation and preprocessing pipelines
- Proper train/val/test splits
- Data augmentation where applicable
- Batch processing and data loading
- Memory-efficient data handling

🧠 MODEL FILES - MUST INCLUDE:
- Clear model architecture definitions
- Forward pass implementations
- Loss function definitions
- Optimizer configurations
- Model summary and parameter counting

⚙️ CONFIG FILES - MUST INCLUDE:
- All hyperparameters (learning rate, batch size, epochs)
- Model architecture parameters
- Data paths and preprocessing settings
- Training and inference configurations

🚀 DEPLOYMENT FILES - MUST INCLUDE:
- Model serving and inference endpoints
- Input validation and preprocessing
- Output formatting and postprocessing
- Error handling for production environments

📝 DOCUMENTATION - MUST INCLUDE:
- Clear setup instructions for AI/ML environment
- Model training and evaluation procedures
- Inference usage examples
- Performance benchmarks and metrics

CRITICAL: This is an AI/ML project generator. Every file must be optimized for machine learning workflows, include proper ML libraries, follow AI/ML best practices, and be immediately usable in an AI/ML development environment.

Generate the complete ${fileInfo.type} file content for this AI/ML project:`;

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-project-generator.local',
                'X-Title': 'Universal AI Project Generator',
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content || '';
    }

    /**
     * Clean file content
     */
    private cleanContent(content: string): string {
        let cleaned = content;

        // Remove markdown code blocks
        cleaned = cleaned.replace(/```[a-zA-Z]*\s*/g, '');
        cleaned = cleaned.replace(/```\s*/g, '');
        cleaned = cleaned.replace(/`/g, '');

        // Remove markdown formatting
        cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
        cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');

        // Clean up excessive whitespace
        cleaned = cleaned.replace(/\n\s*\n\s*\n\s*\n/g, '\n\n\n');

        return cleaned.trim();
    }

    /**
     * Validate project structure matches plan
     */
    private validateProjectStructure(planStructure: PlanStructure, generatedFiles: ProjectFile[]): void {
        console.log('[ProjectGenerator] 🔍 Validating project structure...');

        let missingFiles = 0;

        // Check for missing files
        for (const plannedFile of planStructure.files) {
            const found = generatedFiles.find(f => f.path === plannedFile.path);
            if (!found) {
                console.error(`[ProjectGenerator] ❌ Missing planned file: ${plannedFile.path}`);
                missingFiles++;
            }
        }

        if (missingFiles === 0) {
            console.log('[ProjectGenerator] ✅ Project structure validation passed!');
        } else {
            console.warn(`[ProjectGenerator] ⚠️  Structure validation: ${missingFiles} missing files`);
        }
    }

    /**
     * Create visual progress bar
     */
    private createProgressBar(percentage: number): string {
        const barLength = 40;
        const filledLength = Math.round((percentage / 100) * barLength);
        const emptyLength = barLength - filledLength;

        const filled = '█'.repeat(filledLength);
        const empty = '░'.repeat(emptyLength);

        return `🔄 [${filled}${empty}]`;
    }

    /**
     * Helper methods
     */
    private getFileTypeFromExtension(extension: string): string {
        const typeMap: { [key: string]: string } = {
            'py': 'python',
            'md': 'markdown',
            'txt': 'text',
            'yaml': 'yaml',
            'yml': 'yaml',
            'json': 'json',
            'dockerfile': 'dockerfile',
            'cfg': 'config',
            'conf': 'config'
        };

        return typeMap[extension] || 'text';
    }

    private generateDefaultDescription(filePath: string): string {
        const fileName = filePath.split('/').pop() || '';

        if (fileName === 'requirements.txt') return 'Python dependencies';
        if (fileName === 'README.md') return 'Project documentation';
        if (fileName.includes('train')) return 'Training script';
        if (fileName.includes('model')) return 'Model architecture';
        if (fileName.includes('data')) return 'Data processing utilities';
        if (fileName.includes('inference')) return 'Inference script';
        if (fileName.includes('config')) return 'Configuration file';

        return `${fileName.split('.')[0]} module`;
    }

    private mapFileType(type: string): ProjectFile['type'] {
        const typeMap: { [key: string]: ProjectFile['type'] } = {
            'python': 'python',
            'markdown': 'markdown',
            'text': 'text',
            'yaml': 'yaml',
            'json': 'json',
            'dockerfile': 'dockerfile',
            'config': 'config'
        };

        return typeMap[type] || 'text';
    }

    private async createZipFile(projectName: string, structure: ProjectStructure): Promise<Buffer> {
        const zip = new JSZip();

        // Create all folders first
        for (const folder of structure.folders) {
            zip.folder(folder);
        }

        // Add all files
        for (const file of structure.files) {
            zip.file(file.path, file.content);
        }

        const zipBuffer = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        return zipBuffer;
    }
}