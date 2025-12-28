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
    private sessionCache: Map<string, Buffer> = new Map();

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY!;
    }

    async generateProjectStream(config: any, onProgress: (data: any) => void): Promise<void> {
        try {
            console.log(`[ProjectGenerator] Starting streaming generation for session: ${config.sessionId}`);

            // Extract structure from plan
            const planStructure = this.extractStructureFromPlan(config.plan);
            // Filter out user-provided files that shouldn't be generated
            const generatableFiles = planStructure.files.filter(file => this.shouldGenerateFile(file.path));
            const skippedFiles = planStructure.files.filter(file => !this.shouldGenerateFile(file.path));

            console.log(`[ProjectGenerator] 📊 Total files in plan: ${planStructure.files.length}`);
            console.log(`[ProjectGenerator] ✅ Files to generate: ${generatableFiles.length}`);
            console.log(`[ProjectGenerator] ⏭️  Files to skip (user-provided): ${skippedFiles.length}`);

            if (skippedFiles.length > 0) {
                console.log(`[ProjectGenerator] 📋 Skipped files: ${skippedFiles.map(f => f.path).join(', ')}`);
            }

            const totalFiles = generatableFiles.length;
            let completedFiles = 0;

            // Generate files one by one with progress updates
            const zip = new JSZip();

            for (const fileInfo of generatableFiles) {
                try {
                    console.log(`[ProjectGenerator] 🔄 Starting generation for: ${fileInfo.path}`);

                    // Clean filename for progress updates (remove comments and extra whitespace)
                    const cleanFilename = this.cleanFileName(fileInfo.path);
                    console.log(`[ProjectGenerator] 🧹 Cleaned filename: "${fileInfo.path}" → "${cleanFilename}"`);

                    // Notify file generation start
                    console.log(`[ProjectGenerator] 📤 Sending file_start progress for: ${cleanFilename}`);
                    onProgress({
                        type: 'file_start',
                        filename: cleanFilename,
                        progress: Math.round((completedFiles / totalFiles) * 100)
                    });

                    console.log(`[ProjectGenerator] 📡 Calling AI for: ${fileInfo.path}`);

                    // Generate file content
                    const content = await this.generateFileFromPlan(
                        config.projectName,
                        config.instruction,
                        config.plan,
                        fileInfo,
                        config.model || 'kwaipilot/kat-coder-pro:free'
                    );

                    console.log(`[ProjectGenerator] ✅ Generated ${content.length} chars for: ${fileInfo.path}`);

                    // Clean and add to ZIP with proper project structure
                    const cleanedContent = this.cleanContent(content);
                    // Note: Files will be organized into project folder after all generation is complete
                    zip.file(cleanFilename, cleanedContent); // Temporary storage, will be reorganized later

                    // Notify file completion
                    console.log(`[ProjectGenerator] 📤 Sending file_complete progress for: ${cleanFilename}`);
                    onProgress({
                        type: 'file_complete',
                        filename: cleanFilename,
                        content: cleanedContent,
                        progress: Math.round(((completedFiles + 1) / totalFiles) * 100)
                    });

                    completedFiles++;

                } catch (error) {
                    console.error(`[ProjectGenerator] Error generating ${fileInfo.path}:`, error);

                    // Clean filename for error progress too
                    const cleanFilename = this.cleanFileName(fileInfo.path);

                    onProgress({
                        type: 'error',
                        filename: cleanFilename,
                        message: error instanceof Error ? error.message : 'Generation failed'
                    });
                }
            }

            // Create folders and generate ZIP with proper project structure
            console.log(`[ProjectGenerator] 📦 Creating ZIP with project folder: ${config.projectName}`);

            // Create a new ZIP with proper project structure
            const finalZip = new JSZip();
            const projectFolder = finalZip.folder(config.projectName);
            if (!projectFolder) {
                throw new Error(`Failed to create project folder: ${config.projectName}`);
            }

            // Create all subfolders inside the project folder
            for (const folder of planStructure.folders) {
                // Skip the root project folder if it's already in the list
                if (folder === config.projectName) {
                    continue;
                }

                // Remove project name prefix if it exists to avoid duplication
                const cleanFolderPath = folder.startsWith(config.projectName + '/')
                    ? folder.substring(config.projectName.length + 1)
                    : folder;

                if (cleanFolderPath) {
                    projectFolder.folder(cleanFolderPath);
                    console.log(`[ProjectGenerator] 📁 Created folder: ${config.projectName}/${cleanFolderPath}`);
                }
            }

            // Move all files from temporary zip to project folder synchronously
            const filePromises: Promise<void>[] = [];
            zip.forEach((relativePath, file) => {
                if (!file.dir) { // Only process files, not directories
                    const promise = file.async('string').then((fileContent) => {
                        projectFolder.file(relativePath, fileContent);
                        console.log(`[ProjectGenerator] 📄 Added file: ${config.projectName}/${relativePath}`);
                    });
                    filePromises.push(promise);
                }
            });

            // Wait for all files to be processed
            await Promise.all(filePromises);

            // Store final ZIP in session cache
            const zipBuffer = await finalZip.generateAsync({ type: 'nodebuffer' });
            this.sessionCache.set(config.sessionId, zipBuffer);

            console.log(`[ProjectGenerator] 📤 Sending final progress update`);
            onProgress({
                type: 'progress',
                progress: 100,
                message: 'Project generation complete'
            });

        } catch (error) {
            console.error('[ProjectGenerator] Streaming error:', error);
            throw error;
        }
    }

    async getProjectZip(sessionId: string): Promise<Buffer | null> {
        console.log('[ProjectGenerator] Checking ZIP for session:', sessionId);

        const zipBuffer = this.sessionCache.get(sessionId);

        if (!zipBuffer) {
            console.log('[ProjectGenerator] ZIP not found for session:', sessionId);
            return null;
        }

        console.log('[ProjectGenerator] ZIP found, size:', zipBuffer.length, 'bytes');

        // Don't delete immediately - allow multiple downloads
        // ZIP will be cleaned up after timeout or server restart
        return zipBuffer;
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

        // Step 2: Filter and generate files following the plan exactly
        const generatableFiles = planStructure.files.filter(file => this.shouldGenerateFile(file.path));
        const skippedFiles = planStructure.files.filter(file => !this.shouldGenerateFile(file.path));

        console.log(`[ProjectGenerator] 📊 Total files in plan: ${planStructure.files.length}`);
        console.log(`[ProjectGenerator] ✅ Files to generate: ${generatableFiles.length}`);
        console.log(`[ProjectGenerator] ⏭️  Files to skip (user-provided): ${skippedFiles.length}`);

        if (skippedFiles.length > 0) {
            console.log(`[ProjectGenerator] 📋 Skipped files: ${skippedFiles.map(f => f.path).join(', ')}`);
        }

        const files: ProjectFile[] = [];
        const totalFiles = generatableFiles.length;

        console.log(`\n🚀 [ProjectGenerator] Starting AI/ML Project Generation`);
        console.log(`📊 [ProjectGenerator] Progress: 0/${totalFiles} files (0%)`);

        for (let i = 0; i < generatableFiles.length; i++) {
            const fileInfo = generatableFiles[i];
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

            try {
                const startTime = Date.now();
                const content = await this.generateFileFromPlan(projectName, instruction, plan, fileInfo, selectedModel);
                const endTime = Date.now();
                const duration = endTime - startTime;

                // Clean content
                const cleanedContent = this.cleanContent(content);
                const fileSize = Math.round(cleanedContent.length / 1024 * 100) / 100;

                // Use cleaned filename for the file path
                const cleanedPath = this.cleanFileName(fileInfo.path);

                files.push({
                    path: cleanedPath,
                    content: cleanedContent,
                    type: this.mapFileType(fileInfo.type)
                });

                // Send file completion update
                progressCallback?.({
                    type: 'file_complete',
                    message: `Generated ${cleanedPath}`,
                    currentFile: i + 1,
                    totalFiles,
                    progress,
                    fileInfo: {
                        path: cleanedPath,
                        type: fileInfo.type,
                        size: `${fileSize}KB`,
                        duration: `${duration}ms`
                    },
                    nextFile: i < planStructure.files.length - 1 ? {
                        path: this.cleanFileName(planStructure.files[i + 1].path),
                        type: planStructure.files[i + 1].type
                    } : null
                });

                console.log(`✅ Generated ${cleanedPath} (${fileSize}KB) in ${duration}ms`);

            } catch (error) {
                console.error(`❌ Failed to generate ${fileInfo.path}:`, error);

                // Create a placeholder file so the project structure is maintained
                const placeholderContent = `# ${fileInfo.path}\n# Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}\n# Please regenerate this file manually\n`;
                const cleanedPath = this.cleanFileName(fileInfo.path);

                files.push({
                    path: cleanedPath,
                    content: placeholderContent,
                    type: this.mapFileType(fileInfo.type)
                });

                // Send error notification but continue
                progressCallback?.({
                    type: 'file_error',
                    message: `Failed to generate ${cleanedPath}`,
                    currentFile: i + 1,
                    totalFiles,
                    progress,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }

            // Show current status
            if (i < generatableFiles.length - 1) {
                const nextFile = generatableFiles[i + 1];
                console.log(`⏭️  Next: ${nextFile.path} (${nextFile.type})`);
            }
        }

        // Add placeholder files for skipped user-provided files
        for (const skippedFile of skippedFiles) {
            const placeholderContent = this.createPlaceholderContent(skippedFile.path);
            const cleanedPath = this.cleanFileName(skippedFile.path);
            files.push({
                path: cleanedPath,
                content: placeholderContent,
                type: this.mapFileType(skippedFile.type)
            });
            console.log(`📝 Added placeholder for user-provided file: ${cleanedPath}`);
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
        console.log('[ProjectGenerator] 📄 Plan preview:', plan.substring(0, 200) + '...');

        const folders: string[] = [];
        const files: Array<{ path: string; type: string; description: string }> = [];
        const lines = plan.split('\n');
        const folderStack: string[] = []; // Track current folder path

        console.log('[ProjectGenerator] 📝 Total lines to process:', lines.length);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty lines and headers
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('=') ||
                trimmed.includes('Project Structure') || trimmed.includes('Overview')) {
                continue;
            }

            // FIXED: Better indentation calculation using tree structure
            const treeMatch = line.match(/^(\s*)((?:[│├└]\s*)*)(├|└)\s*─*\s*(.+)$/);
            if (treeMatch) {
                const pathItem = treeMatch[4].trim(); // the actual file/folder name

                // FIXED: Calculate depth by finding where the actual content starts
                const contentMatch = line.match(/^[│├└\s─]*([a-zA-Z0-9_])/);
                let indentLevel = 0;
                
                if (contentMatch) {
                    const contentStart = line.indexOf(contentMatch[1]);
                    // Each level of nesting adds approximately 4 characters
                    indentLevel = Math.max(0, Math.floor(contentStart / 4) - 1);
                }

                console.log(`[ProjectGenerator] 🔍 Line ${i}: "${line.trim()}" → Item: "${pathItem}", Depth: ${indentLevel}, ContentStart: ${contentMatch ? line.indexOf(contentMatch[1]) : 'N/A'}`);

                // FIXED: Adjust folder stack to match current depth
                folderStack.length = indentLevel;

                if (pathItem.endsWith('/')) {
                    // It's a folder
                    const folderName = pathItem.replace(/\/$/, '');
                    const fullPath = folderStack.length > 0 ?
                        folderStack.join('/') + '/' + folderName :
                        folderName;

                    if (fullPath && !folders.includes(fullPath)) {
                        folders.push(fullPath);
                        console.log(`[ProjectGenerator] 📁 Added folder: "${fullPath}" (depth: ${indentLevel})`);
                    }

                    // FIXED: Add to stack for nested items
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
                            description: this.generateDefaultDescription(pathItem)
                        });

                        console.log(`[ProjectGenerator] 📄 Added file: "${fullPath}" (depth: ${indentLevel})`);
                    }
                }
            } else {
                // Handle root level items (like "rapid/")
                const rootMatch = line.match(/^([a-zA-Z0-9_.-]+\/?)$/);
                if (rootMatch) {
                    const pathItem = rootMatch[1];
                    if (pathItem.endsWith('/')) {
                        const folderName = pathItem.replace(/\/$/, '');
                        if (!folders.includes(folderName)) {
                            folders.push(folderName);
                            console.log(`[ProjectGenerator] 📁 Added root folder: "${folderName}"`);
                        }
                    }
                }
            }
        }

        // FIXED: Ensure parent folders exist for all nested files
        files.forEach(file => {
            const pathParts = file.path.split('/');
            if (pathParts.length > 1) {
                for (let i = 1; i < pathParts.length; i++) {
                    const folderPath = pathParts.slice(0, i).join('/');
                    if (folderPath && !folders.includes(folderPath)) {
                        folders.push(folderPath);
                        console.log(`[ProjectGenerator] 📁 Added missing parent folder: "${folderPath}"`);
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log(`[ProjectGenerator] Request timeout for ${fileInfo.path} after 60 seconds`);
            controller.abort();
        }, 60000); // 60 second timeout

        try {
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
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content || '';
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`Request timeout for ${fileInfo.path} - please try again`);
                }
                if (error.message.includes('terminated')) {
                    throw new Error(`Connection lost for ${fileInfo.path} - please check your internet connection`);
                }
            }
            throw error;
        }
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
     * Clean file name by removing descriptions and comments
     */
    private cleanFileName(fileName: string): string {
        if (!fileName) return '';
        
        // Remove comments after # symbol
        let cleaned = fileName.split('#')[0].trim();
        
        // Remove parenthetical descriptions like "(single file containing...)"
        cleaned = cleaned.replace(/\s*\([^)]*\)\s*$/g, '');
        
        // Remove leading slashes
        cleaned = cleaned.replace(/^\/+/, '');
        
        // Remove extra whitespace
        cleaned = cleaned.trim();
        
        // Ensure we have a valid file extension
        if (cleaned && !cleaned.includes('.')) {
            // If no extension, try to infer from original name or skip
            const originalExt = fileName.match(/\.([a-zA-Z0-9]+)/);
            if (originalExt) {
                cleaned += '.' + originalExt[1];
            }
        }
        
        return cleaned;
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

    /**
     * Determine if a file should be generated or skipped (user-provided)
     */
    private shouldGenerateFile(filePath: string): boolean {
        const fileName = filePath.toLowerCase();
        const extension = fileName.split('.').pop() || '';

        // Skip user-provided file types
        const userProvidedExtensions = [
            '', 'avi', 'mov', 'mkv', 'webm',  // Video files
            'mp3', 'wav', 'flac', 'aac',         // Audio files
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', // Image files (datasets)
            'pt', 'pth', 'h5', 'pkl', 'joblib', 'model', // Model weight files
            'zip', 'tar', 'gz', '7z', 'rar',     // Archive files
            'db', 'sqlite', 'sql',               // Database files
            'csv', 'tsv',                        // CSV and TSV data files
            'xlsx', 'xls', 'xlsm', 'xlsb',      // Excel files
            'parquet', 'feather',                // Data format files
        ];

        if (userProvidedExtensions.includes(extension)) {
            return false;
        }

        // Skip specific user-provided files
        const userProvidedFiles = [
            // '__init__.py',                    // Generate these - they're essential for Python packages
            'setup.py',                          // Users create their own setup
            'pyproject.toml',                    // Users configure their own build
        ];

        const baseFileName = filePath.split('/').pop() || '';
        if (userProvidedFiles.includes(baseFileName.toLowerCase())) {
            return false;
        }

        // Skip files in certain directories that are typically user-provided
        const userProvidedDirs = [
            'data/', 'dataset/', 'datasets/',   // Data directories
            'models/weights/', 'weights/',      // Model weight directories
            'test_data/', 'sample_data/',       // Test data directories
            'assets/', 'media/',                // Media directories
        ];

        for (const dir of userProvidedDirs) {
            if (filePath.toLowerCase().startsWith(dir)) {
                return false;
            }
        }

        // Generate all other files (code, configs, docs)
        return true;
    }

    /**
     * Create placeholder content for user-provided files
     */
    private createPlaceholderContent(filePath: string): string {
        const fileName = filePath.split('/').pop() || '';
        const extension = fileName.split('.').pop()?.toLowerCase() || '';

        // Video files
        if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension)) {
            return `# ${fileName}\n\n` +
                `This is a placeholder for a video file that users should provide.\n\n` +
                `Instructions:\n` +
                `1. Replace this file with your actual video data\n` +
                `2. Supported formats: MP4, AVI, MOV, MKV, WebM\n` +
                `3. Place your video file at: ${filePath}\n\n` +
                `Example usage in code:\n` +
                `video_path = "${filePath}"\n` +
                `cap = cv2.VideoCapture(video_path)\n`;
        }

        // Model weight files
        if (['pt', 'pth', 'h5', 'pkl', 'joblib', 'model'].includes(extension)) {
            return `# ${fileName}\n\n` +
                `This is a placeholder for a trained model file that users should provide.\n\n` +
                `Instructions:\n` +
                `1. Train your model using the provided training scripts\n` +
                `2. Save your trained model to: ${filePath}\n` +
                `3. The model will be loaded automatically by the inference scripts\n\n` +
                `Example training command:\n` +
                `python train.py --save-path ${filePath}\n`;
        }

        // CSV and Excel data files
        if (['csv', 'tsv', 'xlsx', 'xls', 'xlsm', 'xlsb', 'parquet', 'feather'].includes(extension)) {
            return `# ${fileName}\n\n` +
                `This is a placeholder for a data file that users should provide.\n\n` +
                `Instructions:\n` +
                `1. Replace this file with your actual dataset\n` +
                `2. Supported formats: CSV, TSV, Excel (xlsx/xls), Parquet, Feather\n` +
                `3. Place your data file at: ${filePath}\n\n` +
                `Example usage in code:\n` +
                `import pandas as pd\n` +
                `df = pd.read_csv("${filePath}")  # For CSV files\n` +
                `df = pd.read_excel("${filePath}")  # For Excel files\n`;
        }

        // __init__.py files
        if (fileName === '__init__.py') {
            return `# ${filePath}\n\n` +
                `# This file makes Python treat the directory as a package.\n` +
                `# Add your package initialization code here if needed.\n\n` +
                `# Example:\n` +
                `# from .main_module import MainClass\n` +
                `# __version__ = "1.0.0"\n`;
        }

        // Generic placeholder
        return `# ${fileName}\n\n` +
            `This is a placeholder for a user-provided file.\n\n` +
            `Instructions:\n` +
            `1. Replace this placeholder with your actual file\n` +
            `2. File location: ${filePath}\n` +
            `3. Refer to the README for specific requirements\n`;
    }

    private async createZipFile(projectName: string, structure: ProjectStructure): Promise<Buffer> {
        const zip = new JSZip();

        console.log(`[ProjectGenerator] 📦 Creating ZIP with project folder: ${projectName}`);

        // Create the main project folder first
        const projectFolder = zip.folder(projectName);
        if (!projectFolder) {
            throw new Error(`Failed to create project folder: ${projectName}`);
        }

        // Create all subfolders inside the project folder
        for (const folder of structure.folders) {
            // Skip the root project folder if it's already in the list
            if (folder === projectName) {
                continue;
            }

            // Remove project name prefix if it exists to avoid duplication
            const cleanFolderPath = folder.startsWith(projectName + '/')
                ? folder.substring(projectName.length + 1)
                : folder;

            if (cleanFolderPath) {
                projectFolder.folder(cleanFolderPath);
                console.log(`[ProjectGenerator] 📁 Created folder: ${projectName}/${cleanFolderPath}`);
            }
        }

        // Add all files inside the project folder
        for (const file of structure.files) {
            // Remove project name prefix if it exists to avoid duplication
            const cleanFilePath = file.path.startsWith(projectName + '/')
                ? file.path.substring(projectName.length + 1)
                : file.path;

            projectFolder.file(cleanFilePath, file.content);
            console.log(`[ProjectGenerator] 📄 Added file: ${projectName}/${cleanFilePath}`);
        }

        const zipBuffer = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        console.log(`[ProjectGenerator] ✅ ZIP created successfully with ${structure.folders.length} folders and ${structure.files.length} files`);
        return zipBuffer;
    }
}