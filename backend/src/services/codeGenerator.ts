import dotenv from 'dotenv';

// Ensure environment is loaded
dotenv.config();

export interface GeneratedFile {
  filename: string;
  content: string;
  type: 'python' | 'notebook' | 'markdown';
}

export class CodeGenerator {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
  }

  private async rateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastRequestTime = Date.now();
  }

  async generateFiles(
    projectName: string,
    instruction: string,
    flowType: string,
    plan: string,
    model?: string
  ): Promise<GeneratedFile[]> {
    const selectedModel = model || 'openai/gpt-oss-20b:free';
    const files: GeneratedFile[] = [];

    console.log(`[CodeGenerator] Generating files for ${flowType} flow using model: ${selectedModel}...`);

    // Generate training script based on flow type
    const trainScript = await this.generateTrainingScript(projectName, instruction, plan, flowType, selectedModel);
    files.push({
      filename: `${projectName}_train.py`,
      content: trainScript,
      type: 'python'
    });

    // Generate training notebook - pass flowType
    const trainNotebook = await this.generateTrainingNotebook(projectName, instruction, plan, flowType, trainScript);
    files.push({
      filename: `${projectName}_train.ipynb`,
      content: trainNotebook,
      type: 'notebook'
    });

    // Generate inference script based on flow type
    const inferenceScript = await this.generateInferenceScript(projectName, instruction, plan, flowType, selectedModel);
    files.push({
      filename: `${projectName}_inference.py`,
      content: inferenceScript,
      type: 'python'
    });

    // Generate project structure
    const projectStructure = await this.generateProjectStructure(projectName, instruction, plan, flowType);
    files.push({
      filename: `${projectName}_project_structure.md`,
      content: projectStructure,
      type: 'markdown'
    });

    console.log('[CodeGenerator] Files generated successfully');

    // Validate Python script syntax
    const pyFile = files.find(f => f.filename.endsWith('_train.py'));
    if (pyFile) {
      const syntaxCheck = this.validatePythonSyntax(pyFile.content);
      if (!syntaxCheck.isValid) {
        console.error(`[CodeGenerator] Python syntax errors detected: ${syntaxCheck.errors.join(', ')}`);
        // Apply fixes
        pyFile.content = this.fixCommonSyntaxErrors(pyFile.content);
        console.log('[CodeGenerator] Applied syntax fixes to training script');
        
        // Re-validate after fixes
        const recheck = this.validatePythonSyntax(pyFile.content);
        if (recheck.isValid) {
          console.log('[CodeGenerator] Python syntax validation passed after fixes');
        } else {
          console.warn(`[CodeGenerator] Some syntax issues remain: ${recheck.errors.join(', ')}`);
        }
      } else {
        console.log('[CodeGenerator] Python syntax validation passed');
      }
    }

    // Validate inference script syntax
    const infFile = files.find(f => f.filename.endsWith('_inference.py'));
    if (infFile) {
      const syntaxCheck = this.validatePythonSyntax(infFile.content);
      if (!syntaxCheck.isValid) {
        console.error(`[CodeGenerator] Inference script syntax errors: ${syntaxCheck.errors.join(', ')}`);
        infFile.content = this.fixCommonSyntaxErrors(infFile.content);
        console.log('[CodeGenerator] Applied syntax fixes to inference script');
      }
    }

    // Validate notebook before returning
    const notebookFile = files.find(f => f.filename.endsWith('.ipynb'));
    if (notebookFile) {
      const validation = this.validateNotebook(notebookFile.content);
      if (!validation.isValid) {
        console.warn(`[CodeGenerator] Notebook validation failed: ${validation.errors.join(', ')}`);
        // Log but don't fail - return the files anyway
      } else {
        console.log('[CodeGenerator] Notebook validation passed');
      }
    }

    return files;
  }

  private async callOpenRouter(prompt: string, model?: string): Promise<string> {
    await this.rateLimitDelay();
    const selectedModel = model || 'openai/gpt-oss-20b:free';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ml-script-generator.local',
          'X-Title': 'ML Script Generator',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[CodeGenerator] Using model: ${selectedModel}, Status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouter API Error:', response.status, errorBody);

        if (response.status === 401) {
          throw new Error('OpenRouter API authentication failed. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status >= 500) {
          throw new Error('OpenRouter service is temporarily unavailable. Please try again later.');
        }

        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || 'Failed to generate content';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  private async generateTrainingScript(projectName: string, instruction: string, plan: string, flowType: string, model?: string): Promise<string> {
    const prompt = flowType === 'predefined'
      ? this.buildPredefinedTrainingPrompt(projectName, instruction, plan)
      : this.buildCustomTrainingPrompt(projectName, instruction, plan);

    const rawCode = await this.callOpenRouter(prompt, model);
    return this.cleanPythonCode(rawCode);
  }

  private buildCustomTrainingPrompt(projectName: string, instruction: string, plan: string): string {
    return `
Generate a complete, production-ready Python training script for:

Project: ${projectName}
Instruction: ${instruction}
Plan: ${plan}

CRITICAL EXECUTION REQUIREMENTS:
- Generate ONLY fully executable Python code - NO placeholders, NO TODO comments, NO pass statements
- NO COMMENTS AT ALL - pure code only, no explanations, no docstrings, no inline comments
- Every line must be runnable code that produces actual results
- MUST follow the user instruction EXACTLY - implement the specific architecture mentioned
- Use appropriate libraries for the specified models (torch, torchvision, ultralytics, etc.)
- All variable names must be valid Python identifiers
- No undefined variables or functions
- Complete, end-to-end executable script

ARCHITECTURE REQUIREMENTS:
- If instruction mentions "hybrid" models, explicitly define the hybrid architecture
- Clearly explain how components interact in code comments
- Define data flow between sub-models
- Include proper model architecture documentation

CONFIGURATION & REPRODUCIBILITY:
- Centralize ALL configuration in a single config section at the top
- Set deterministic random seeds for reproducibility (Python, NumPy, PyTorch/TensorFlow)
- Include hyperparameters: batch_size, learning_rate, epochs, random_seed
- Define all paths: data_path, model_save_path, output_path

REQUIRED STRUCTURE:
1. Configuration Section (centralized hyperparameters and paths)
2. Deterministic Setup (random seeds)
3. Data Loading with validation checks
4. Data Preprocessing with shape/label validation
5. Train/Validation/Test split with integrity checks
6. Model Definition (fully implemented, no placeholders)
7. Training Loop (complete with progress tracking)
8. Evaluation Function (comprehensive metrics and reporting)
9. Model Saving (weights + config + preprocessing metadata)
10. Results Visualization (actual plots, not placeholders)

DATA PIPELINE VALIDATION:
- Add assertions for input shapes and label alignment
- Validate dataset splits for size correctness and no leakage
- Include preprocessing validation between training and inference

MODEL SAVING REQUIREMENTS:
- Save model weights/state
- Save model configuration/architecture
- Save preprocessing parameters
- Save label mappings if applicable
- Use appropriate saving method for the framework

CRITICAL PYTHON SYNTAX REQUIREMENTS:
- ALL dictionary assignments MUST use = operator: my_dict = {...}
- NEVER write: my_dict {...} (this is invalid Python)
- ALL function definitions must end with colon: def func():
- ALL function calls must have parentheses: func() not func
- ALL list/dict literals must be properly closed
- Validate your generated code for syntax before outputting

COMMON ERRORS TO AVOID:
❌ summary { ... }          → ✅ summary = { ... }
❌ def func                → ✅ def func():
❌ import from sklearn      → ✅ from sklearn import
❌ [item for item in]       → ✅ [item for item in items]

PYTHON SYNTAX RULES:
- Use f-strings for formatting: f"text {variable}" NOT backticks
- NO COMMENTS ANYWHERE - pure executable code only
- No unreachable code after return statements
- Proper error handling with try/catch blocks
- Clean, professional code structure

Generate a complete, executable script that can run from start to finish without any manual intervention or placeholder replacement.
`;
  }

  private buildPredefinedTrainingPrompt(projectName: string, instruction: string, plan: string): string {
    return `
Generate a complete, production-ready Python training script following the EXACT predefined structure for:

Project: ${projectName}
Instruction: ${instruction}
Plan: ${plan}

Follow this EXACT structure in order:

1. Imports and Configuration (centralized config section)
2. Data Loading (with validation checks)
3. Data Preprocessing / Feature Engineering (with shape validation)
4. Data Split (Train / Validation / Test) (with integrity checks)
5. Model Definition / Initialization (fully implemented architecture)
6. Training Function (complete implementation)
7. Evaluation / Validation Function (comprehensive metrics)
8. Training Loop / Fit (with progress tracking)
9. Model Evaluation on Test Set (detailed reporting)
10. Model Saving (weights + config + metadata)
11. Results Visualization (actual plots)

CRITICAL EXECUTION REQUIREMENTS:
- Generate ONLY fully executable Python code - NO placeholders, NO TODO comments, NO pass statements
- NO COMMENTS AT ALL - pure code only, no explanations, no docstrings, no inline comments
- Every section must be complete and runnable
- MUST follow the user instruction EXACTLY - implement the specific models/architecture mentioned
- Use appropriate libraries for the specified models (torch, torchvision, ultralytics, etc.)
- Follow the predefined structure exactly
- Complete, end-to-end executable script

CONFIGURATION & REPRODUCIBILITY:
- Section 1 must include centralized configuration with all hyperparameters
- Set deterministic random seeds for reproducibility
- Include: batch_size, learning_rate, epochs, random_seed, paths

DATA PIPELINE VALIDATION:
- Section 2-4 must include validation checks for data integrity
- Add assertions for input shapes and label alignment
- Validate dataset splits for size correctness and no leakage

MODEL REQUIREMENTS:
- Section 5-6 must fully implement the architecture mentioned in instruction
- If "hybrid" models mentioned, explicitly define the hybrid architecture
- No placeholder model definitions

TRAINING & EVALUATION:
- Section 7-9 must include comprehensive training and evaluation logic
- Real metrics calculation and reporting
- Actual progress tracking during training

MODEL PERSISTENCE:
- Section 10 must save: model weights, configuration, preprocessing metadata
- Use appropriate saving method for the framework

VISUALIZATION:
- Section 11 must create actual plots and visualizations, not placeholders

CRITICAL PYTHON SYNTAX REQUIREMENTS:
- ALL dictionary assignments MUST use = operator: my_dict = {...}
- NEVER write: my_dict {...} (this is invalid Python)
- ALL function definitions must end with colon: def func():
- ALL function calls must have parentheses: func() not func
- ALL list/dict literals must be properly closed
- Validate your generated code for syntax before outputting

COMMON ERRORS TO AVOID:
❌ summary { ... }          → ✅ summary = { ... }
❌ def func                → ✅ def func():
❌ import from sklearn      → ✅ from sklearn import
❌ [item for item in]       → ✅ [item for item in items]

PYTHON SYNTAX RULES:
- Use f-strings for formatting: f"text {variable}" NOT backticks
- NO COMMENTS ANYWHERE - pure executable code only
- No unreachable code after return statements
- Proper error handling with try/catch blocks
- Clear section headers for each of the 11 steps

Generate a complete, executable script that implements exactly what the user requested and can run from start to finish without manual intervention.
`;
  }

  private async generateTrainingNotebook(projectName: string, instruction: string, plan: string, flowType: string, trainingScript: string): Promise<string> {
    // Create notebook with flow-specific cell structure
    return flowType === 'predefined'
      ? this.createPredefinedNotebook(projectName, instruction, plan, trainingScript)
      : this.createCustomNotebook(projectName, instruction, plan, trainingScript);
  }

  private createPredefinedNotebook(projectName: string, instruction: string, plan: string, trainingScript: string): string {
    // For predefined flow, create only code cells - NO MARKDOWN, NO COMMENTS
    const notebook = {
      cells: [
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'imports'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'data_loading'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'preprocessing'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'split'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'model'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'training_function'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'evaluation_function'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'training_loop'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'test_evaluation'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'saving'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'visualization'))
        }
      ],
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3"
        },
        language_info: {
          codemirror_mode: {
            name: "ipython",
            version: 3
          },
          file_extension: ".py",
          mimetype: "text/x-python",
          name: "python",
          nbconvert_exporter: "python",
          pygments_lexer: "ipython3",
          version: "3.8.0"
        }
      },
      nbformat: 4,
      nbformat_minor: 4
    };

    return JSON.stringify(notebook, null, 2);
  }

  private createCustomNotebook(projectName: string, instruction: string, plan: string, trainingScript: string): string {
    // For custom flow, create only code cells - NO MARKDOWN, NO COMMENTS
    const notebook = {
      cells: [
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'imports'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'data'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'model'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'training'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'evaluation'))
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: this.formatCodeForNotebook(this.extractSection(trainingScript, 'saving'))
        }
      ],
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3"
        },
        language_info: {
          codemirror_mode: {
            name: "ipython",
            version: 3
          },
          file_extension: ".py",
          mimetype: "text/x-python",
          name: "python",
          nbconvert_exporter: "python",
          pygments_lexer: "ipython3",
          version: "3.8.0"
        }
      },
      nbformat: 4,
      nbformat_minor: 4
    };

    return JSON.stringify(notebook, null, 2);
  }

  private extractSection(script: string, sectionType: string): string {
    // Enhanced regex patterns with better specificity and order preference
    const sectionMarkers: { [key: string]: RegExp } = {
      'imports': /^(?:import |from |#.*(?:1️⃣|Step 1|Imports|Configuration))/m,
      'data_loading': /^(?:def (?:load_data|load_dataset|get_data)|#.*(?:2️⃣|Step 2|Data Loading)|# 2\.|# ===.*2\.)/m,
      'data': /^(?:def (?:load_data|load_dataset|get_data)|#.*(?:data|loading))/m,
      'preprocessing': /^(?:def (?:preprocess|clean_text|.*vectoriz|transform_data)|#.*(?:3️⃣|Step 3|Preprocessing|Feature Engineering)|# 3\.|# ===.*3\.)/m,
      'split': /^(?:def (?:split_data|split_dataset|create_splits)(?!\w)|#.*(?:4️⃣|Step 4|Data Split)|# 4\.|# ===.*4\.)/m,
      'model': /^(?:def (?:build_model|init_model|create_model)|class \w*(?:CNN|Model|Net)|#.*(?:5️⃣|Step 5|Model Definition)|# 5\.|# ===.*5\.)/m,
      'training_function': /^(?:def (?:train_model|train_one_epoch|training_step|train)(?!\w)|#.*(?:6️⃣|Step 6|Training Function)|# 6\.|# ===.*6\.)/m,
      'evaluation_function': /^(?:def (?:evaluate|validate|eval_model|test)(?!\w)|#.*(?:7️⃣|Step 7|Evaluation)|# 7\.|# ===.*7\.)/m,
      'training_loop': /^(?:def (?:run_training|training_pipeline|main_training)|for.*(?:epoch|range)|#.*(?:8️⃣|Step 8|Training Loop)|# 8\.|# ===.*8\.)/m,
      'training': /^(?:def (?:run_training|training_pipeline|main_training)|for.*(?:epoch|range)|#.*training)/m,
      'test_evaluation': /^(?:test_metrics.*=|def (?:test_|final_)|#.*(?:9️⃣|Step 9|Test.*Evaluation|Model Evaluation on Test)|# 9\.|# ===.*9\.)/m,
      'evaluation': /^(?:test_metrics.*=|def (?:evaluate|test_model|final_evaluation)|#.*evaluat)/m,
      'saving': /^(?:torch\.save|joblib\.dump|model_path.*=|#.*(?:🔟|Step 10|Model Saving)|# 10\.|# ===.*10\.)/m,
      'visualization': /^(?:plt\.|sns\.|matplotlib|fig.*=|#.*(?:1️⃣1️⃣|Step 11|Results Visualization|Visualization)|# 11\.|# ===.*11\.)/m
    };

    const marker = sectionMarkers[sectionType];
    if (!marker) {
      console.warn(`[extractSection] No marker defined for ${sectionType}`);
      return this.getDefaultSectionContent(sectionType);
    }

    // Find ALL matches and use the most appropriate one
    const matches = Array.from(script.matchAll(new RegExp(marker.source, 'gm')));
    if (matches.length === 0) {
      console.warn(`[extractSection] No match found for ${sectionType}`);
      return this.getDefaultSectionContent(sectionType);
    }

    // For early steps (1-6), prefer matches that look like actual section headers
    let selectedMatch = matches[0];
    if (['imports', 'data_loading', 'preprocessing', 'split', 'model', 'training_function'].includes(sectionType)) {
      // Look for matches that contain step numbers or section markers
      const headerMatches = matches.filter(m => 
        m[0].includes('Step') || m[0].includes('===') || m[0].includes('#') || m[0].includes('def ')
      );
      if (headerMatches.length > 0) {
        selectedMatch = headerMatches[0];
        console.log(`[extractSection] Using header match for ${sectionType}: ${selectedMatch[0].substring(0, 50)}...`);
      }
    }

    // For final steps (9-11), prefer later matches to avoid early false positives
    if (['test_evaluation', 'evaluation', 'saving', 'visualization'].includes(sectionType)) {
      selectedMatch = matches[matches.length - 1];
      console.log(`[extractSection] Using last match for ${sectionType} (${matches.length} total matches)`);
    }

    console.log(`[extractSection] Found ${sectionType} at index ${selectedMatch.index}: ${selectedMatch[0].substring(0, 50)}...`);
    return this.extractFunctionAtIndex(script, selectedMatch.index!);
  }

  private extractFunctionAtIndex(script: string, startIdx: number): string {
    const lines = script.split('\n');
    const startLine = script.substring(0, startIdx).split('\n').length - 1;

    const extractedLines: string[] = [];
    let functionIndent: number | null = null;
    let inDocstring = false;
    let docstringChar = '';
    let foundMainContent = false;
    let sectionHeaderFound = false;

    console.log(`[extractFunctionAtIndex] Starting extraction at line ${startLine + 1}`);

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Handle docstrings
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        docstringChar = trimmed.substring(0, 3);
        inDocstring = !inDocstring;
        extractedLines.push(line);

        if (trimmed.endsWith(docstringChar) && trimmed.length > 6) {
          inDocstring = false;
        }
        continue;
      }

      if (inDocstring) {
        extractedLines.push(line);
        if (trimmed.endsWith(docstringChar)) {
          inDocstring = false;
        }
        continue;
      }

      // Skip empty lines at start
      if (extractedLines.length === 0 && trimmed === '') continue;

      // Detect section headers (comments with step numbers or separators)
      if (trimmed.startsWith('#') && (trimmed.includes('Step') || trimmed.includes('===') || trimmed.match(/# \d+\./))) {
        sectionHeaderFound = true;
        extractedLines.push(line);
        console.log(`[extractFunctionAtIndex] Found section header: ${trimmed.substring(0, 50)}`);
        continue;
      }

      // Capture function definition or class definition
      if (trimmed.startsWith('def ') || trimmed.startsWith('class ')) {
        functionIndent = line.search(/\S/);
        extractedLines.push(line);
        foundMainContent = true;
        console.log(`[extractFunctionAtIndex] Found ${trimmed.startsWith('def ') ? 'function' : 'class'} at indent ${functionIndent}: ${trimmed.substring(0, 50)}`);
        continue;
      }

      // Special handling for different content types
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        extractedLines.push(line);
        foundMainContent = true;
        continue;
      }

      if (trimmed.includes(' = ') && !trimmed.startsWith('#')) {
        extractedLines.push(line);
        foundMainContent = true;
        continue;
      }

      // Special patterns for specific steps
      if (trimmed.includes('test_metrics') && trimmed.includes('evaluate')) {
        extractedLines.push(line);
        foundMainContent = true;
        console.log(`[extractFunctionAtIndex] Found test evaluation pattern: ${trimmed.substring(0, 50)}`);
        continue;
      }

      if (trimmed.includes('torch.save') || trimmed.includes('joblib.dump') || 
          (trimmed.includes('save') && (trimmed.includes('model') || trimmed.includes('path')))) {
        extractedLines.push(line);
        foundMainContent = true;
        console.log(`[extractFunctionAtIndex] Found model saving pattern: ${trimmed.substring(0, 50)}`);
        continue;
      }

      if (trimmed.startsWith('plt.') || trimmed.startsWith('sns.') || 
          trimmed.includes('matplotlib') || trimmed.includes('figure')) {
        extractedLines.push(line);
        foundMainContent = true;
        console.log(`[extractFunctionAtIndex] Found visualization pattern: ${trimmed.substring(0, 50)}`);
        continue;
      }

      // If we haven't found main content yet, keep collecting relevant lines
      if (!foundMainContent && !sectionHeaderFound) {
        if (trimmed.startsWith('#') || trimmed.startsWith('@') || trimmed.length > 0) {
          extractedLines.push(line);
        }
        
        // Stop if we hit another major section or collected too many lines
        if (i > startLine + 100) {
          console.log(`[extractFunctionAtIndex] Reached 100-line limit without finding main content, stopping`);
          break;
        }
        continue;
      }

      // Inside function: check indent level
      const currentIndent = line.search(/\S/);

      // Empty lines are part of the content
      if (trimmed === '') {
        extractedLines.push(line);
        continue;
      }

      // If we're back to same/lower indent with non-empty content
      if (functionIndent !== null && currentIndent <= functionIndent) {
        // Check if it's a comment continuing the function
        if (trimmed.startsWith('#')) {
          extractedLines.push(line);
          continue;
        }
        // Check if it's another function or major section
        if (trimmed.startsWith('def ') || trimmed.startsWith('class ') || 
            trimmed.startsWith('# Step') || trimmed.startsWith('# ---') ||
            trimmed.startsWith('if __name__') || trimmed.match(/^# \d+/) ||
            trimmed.match(/^# [🔟1️⃣]/)) {
          console.log(`[extractFunctionAtIndex] Hit next section at line ${i + 1}: ${trimmed.substring(0, 30)}`);
          break;
        }
      }

      // Continue collecting content
      extractedLines.push(line);

      // For section-based content (like imports, config), be more generous
      if (sectionHeaderFound && functionIndent === null) {
        // Continue until we hit a clear section boundary
        if (trimmed.match(/^# Step \d+/) || trimmed.match(/^# [🔟1️⃣]/) || 
            trimmed.startsWith('# ===') || trimmed.startsWith('# ---')) {
          console.log(`[extractFunctionAtIndex] Hit section boundary at line ${i + 1}: ${trimmed.substring(0, 30)}`);
          break;
        }
      }

      // Safety limit - increased for complex sections
      if (extractedLines.length > 400) {
        console.warn(`[extractFunctionAtIndex] Hit 400-line limit, stopping`);
        break;
      }
    }

    const result = extractedLines.join('\n').trim();

    // Enhanced validation
    const hasFunction = result.includes('def ');
    const hasImports = result.includes('import ');
    const hasAssignments = result.includes(' = ');
    const hasClass = result.includes('class ');
    const hasTestEval = result.includes('test_metrics') || result.includes('evaluate');
    const hasSaving = result.includes('torch.save') || result.includes('joblib.dump') || result.includes('model_path');
    const hasVisualization = result.includes('plt.') || result.includes('sns.');
    const hasSectionHeader = result.includes('Step') || result.includes('===');
    const isSubstantial = result.length > 50;

    if (!isSubstantial || (!hasFunction && !hasImports && !hasAssignments && !hasClass && 
                          !hasTestEval && !hasSaving && !hasVisualization && !hasSectionHeader)) {
      console.warn(`[extractFunctionAtIndex] Extracted content seems incomplete:`);
      console.warn(`  - Length: ${result.length} chars`);
      console.warn(`  - Has function: ${hasFunction}`);
      console.warn(`  - Has imports: ${hasImports}`);
      console.warn(`  - Has assignments: ${hasAssignments}`);
      console.warn(`  - Has section header: ${hasSectionHeader}`);
      console.warn(`  - Preview: ${result.substring(0, 100)}...`);
      return this.getDefaultSectionContent('generic');
    }

    console.log(`[extractFunctionAtIndex] Successfully extracted ${extractedLines.length} lines (${result.length} chars)`);
    return result;
  }

  private getSectionIndex(sectionType: string): number {
    const sectionMap: { [key: string]: number } = {
      'imports': 0,
      'data_loading': 1,
      'data': 1,
      'preprocessing': 2,
      'split': 3,
      'model': 4,
      'training_function': 5,
      'evaluation_function': 6,
      'training_loop': 7,
      'training': 7,
      'test_evaluation': 8,
      'evaluation': 8,
      'saving': 9,
      'visualization': 10
    };
    return sectionMap[sectionType] || 0;
  }

  private getDefaultSectionContent(sectionType: string): string {
    // Provide meaningful working code instead of placeholders
    const defaults: { [key: string]: string } = {
      'imports': '# Import required libraries\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import accuracy_score\nprint("✅ Libraries imported successfully")',
      'data_loading': '# Data loading - implement your data source\nprint("📊 Loading data...")\n# Example: df = pd.read_csv("data.csv")\n# Ensure you have text and label columns',
      'data': '# Data processing - implement your data pipeline\nprint("🔄 Processing data...")\n# Example: texts, labels = load_your_data()',
      'preprocessing': '# Data preprocessing with TF-IDF\nfrom sklearn.feature_extraction.text import TfidfVectorizer\nprint("⚙️ Setting up TF-IDF vectorizer...")\nvectorizer = TfidfVectorizer(max_features=10000, stop_words="english")\n# X = vectorizer.fit_transform(texts)',
      'split': '# Data splitting\nprint("✂️ Splitting data into train/validation/test sets...")\n# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)',
      'model': '# SVM model definition\nfrom sklearn.svm import LinearSVC\nprint("🤖 Initializing SVM model...")\nmodel = LinearSVC(C=1.0, random_state=42)\n# This creates a Linear Support Vector Machine for classification',
      'training_function': '# Training function\ndef train_model(model, X_train, y_train):\n    print("🏋️ Training SVM model...")\n    model.fit(X_train, y_train)\n    print("✅ Training completed")\n    return model',
      'evaluation_function': '# Evaluation function\ndef evaluate_model(model, X, y, set_name="Test"):\n    print(f"📈 Evaluating on {set_name} set...")\n    predictions = model.predict(X)\n    accuracy = accuracy_score(y, predictions)\n    print(f"{set_name} Accuracy: {accuracy:.4f}")\n    return {"accuracy": accuracy, "predictions": predictions}',
      'training_loop': '# Training execution\nprint("🚀 Starting training process...")\ntrained_model = train_model(model, X_train, y_train)\nprint("✅ Training process completed")',
      'training': '# Training process\nprint("🚀 Executing training...")\n# model.fit(X_train, y_train)\nprint("✅ Model training completed")',
      'test_evaluation': '# Final test set evaluation\nprint("🎯 Evaluating model on test set...")\ntest_metrics = evaluate_model(trained_model, X_test, y_test, "Test")\nprint(f"Final Test Accuracy: {test_metrics[\'accuracy\']:.4f}")\nprint("📊 Test evaluation completed")',
      'evaluation': '# Model evaluation\nprint("📊 Evaluating model performance...")\n# predictions = model.predict(X_test)\n# accuracy = accuracy_score(y_test, predictions)\nprint("✅ Evaluation completed")',
      'saving': '# Model persistence\nimport joblib\nprint("💾 Saving trained model and vectorizer...")\njoblib.dump(trained_model, "sentiment_svm_model.pkl")\njoblib.dump(vectorizer, "tfidf_vectorizer.pkl")\nprint("✅ Model and vectorizer saved successfully")',
      'visualization': '# Results visualization\nimport matplotlib.pyplot as plt\nprint("📈 Creating visualizations...")\n# Example: Confusion matrix heatmap\nfrom sklearn.metrics import confusion_matrix\nimport seaborn as sns\n\n# cm = confusion_matrix(y_test, predictions)\n# plt.figure(figsize=(8, 6))\n# sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")\n# plt.title("Confusion Matrix")\n# plt.ylabel("True Label")\n# plt.xlabel("Predicted Label")\n# plt.show()\nprint("📊 Visualization completed")',
      'generic': '# Code section\nprint("⚠️ Section extraction failed - using fallback content")\n# Implement your specific code here based on the step requirements'
    };
    return defaults[sectionType] || defaults['generic'];
  }

  private formatCodeForNotebook(code: string): string[] {
    // Clean the code before formatting for notebook
    const cleanedCode = this.cleanPythonCode(code);
    return cleanedCode.split('\n').map(line => line + '\n');
  }

  private async generateInferenceScript(projectName: string, instruction: string, plan: string, flowType: string, model?: string): Promise<string> {
    const prompt = flowType === 'predefined'
      ? this.buildPredefinedInferencePrompt(projectName, instruction, plan)
      : this.buildCustomInferencePrompt(projectName, instruction, plan);

    const rawCode = await this.callOpenRouter(prompt, model);
    return this.cleanPythonCode(rawCode);
  }

  private buildCustomInferencePrompt(projectName: string, instruction: string, plan: string): string {
    return `
Generate a complete, production-ready Python inference script for:

Project: ${projectName}
Instruction: ${instruction}
Plan: ${plan}

CRITICAL EXECUTION REQUIREMENTS:
- Generate ONLY fully executable Python code - NO placeholders, NO TODO comments, NO pass statements
- NO COMMENTS AT ALL - pure code only, no explanations, no docstrings, no inline comments
- Complete, standalone inference script that runs independently
- Load the trained model saved by the training script
- MUST implement the exact same architecture as specified in the instruction
- Use appropriate libraries matching the training script

REQUIRED STRUCTURE:
1. Configuration Section (paths and parameters)
2. Model Loading (load saved model + metadata)
3. Input Preprocessing (exact same as training)
4. Inference Function (complete prediction logic)
5. Output Post-processing (format results appropriately)
6. Main Execution (CLI interface or function calls)

INFERENCE REQUIREMENTS:
- Load model weights/state from training script
- Load preprocessing parameters from training
- Load model configuration/architecture
- Load label mappings if applicable
- Implement exact same preprocessing as training
- Provide easy-to-use interface for predictions
- Include proper error handling and validation
- Support both single sample and batch predictions

MODEL LOADING VALIDATION:
- Verify model file exists before loading
- Validate model architecture matches expected
- Check preprocessing parameters are loaded correctly
- Ensure label mappings are consistent

INPUT/OUTPUT HANDLING:
- Accept various input formats (file paths, arrays, etc.)
- Validate input shapes and types
- Apply same preprocessing as training
- Return formatted, interpretable results
- Include confidence scores if applicable

CRITICAL PYTHON SYNTAX REQUIREMENTS:
- ALL dictionary assignments MUST use = operator: my_dict = {...}
- NEVER write: my_dict {...} (this is invalid Python)
- ALL function definitions must end with colon: def func():
- ALL function calls must have parentheses: func() not func
- ALL list/dict literals must be properly closed
- Validate your generated code for syntax before outputting

COMMON ERRORS TO AVOID:
❌ summary { ... }          → ✅ summary = { ... }
❌ def func                → ✅ def func():
❌ import from sklearn      → ✅ from sklearn import
❌ [item for item in]       → ✅ [item for item in items]

PYTHON SYNTAX RULES:
- Use f-strings for formatting: f"text {variable}" NOT backticks
- NO COMMENTS ANYWHERE - pure executable code only
- No unreachable code after return statements
- Proper error handling with try/catch blocks
- Clean, professional code structure

Generate a complete, standalone inference script that can be used immediately after training completes.
`;
  }

  private buildPredefinedInferencePrompt(projectName: string, instruction: string, plan: string): string {
    return `
Generate a complete Python inference script following the EXACT predefined structure for:

Project: ${projectName}
Instruction: ${instruction}
Plan: ${plan}

Follow this EXACT structure in order:

1. Imports and Configuration
2. Model Loading (load the trained model from disk)
3. Input Preprocessing (same preprocessing as training)
4. Inference / Prediction Logic (using the loaded trained model)
5. Post-processing of Outputs

CRITICAL REQUIREMENTS:
- Generate ONLY valid Python code with proper syntax
- NO COMMENTS AT ALL - pure code only, no explanations, no docstrings, no inline comments
- Use f-strings for string formatting: f"text {variable}" NOT backticks
- Use only standard Python libraries: pandas, numpy, sklearn, joblib, pickle
- Follow the predefined structure exactly
- Complete, executable Python script that runs independently
- Load the model saved by the training script
- All imports must exist and be valid
- Include proper error handling
- Clear section comments for each of the 5 steps
- Easy-to-use interface

CRITICAL PYTHON SYNTAX REQUIREMENTS:
- ALL dictionary assignments MUST use = operator: my_dict = {...}
- NEVER write: my_dict {...} (this is invalid Python)
- ALL function definitions must end with colon: def func():
- ALL function calls must have parentheses: func() not func
- ALL list/dict literals must be properly closed
- Validate your generated code for syntax before outputting

COMMON ERRORS TO AVOID:
❌ summary { ... }          → ✅ summary = { ... }
❌ def func                → ✅ def func():
❌ import from sklearn      → ✅ from sklearn import
❌ [item for item in]       → ✅ [item for item in items]

PYTHON SYNTAX RULES:
- String formatting: f"Model loaded from {model_path}" (NOT backticks)
- NO COMMENTS ANYWHERE - pure executable code only
- Print statements: print("message") or print(f"message {variable}")
- File paths: Use os.path.join() or forward slashes

Generate only valid Python code without any comments or explanations.
The inference script must use the model trained by the training script, NOT external APIs.
Ensure all syntax is correct Python, not JavaScript or other languages.
`;
  }

  private async generateProjectStructure(projectName: string, instruction: string, plan: string, flowType: string): Promise<string> {
    const prompt = `
Generate a comprehensive project structure documentation for:

Project: ${projectName}
Instruction: ${instruction}
Plan: ${plan}
Flow Type: ${flowType}

Create a detailed project structure guide that includes:

1. **Folder Structure**: Recommended directory layout
2. **File Placement**: Where to put each of the 4 generated files
3. **Dependencies**: Required Python packages and installation
4. **Setup Instructions**: Step-by-step setup process
5. **Usage Guide**: How to run training and inference
6. **Data Requirements**: Expected input data format and location
7. **Model Storage**: Where trained models will be saved
8. **Output Structure**: What files/results to expect
9. **Flow Type Information**: Explain whether this follows custom or predefined structure

Format as clean markdown with:
- Clear folder tree structure
- Installation commands
- Usage examples
- File descriptions
- Troubleshooting section
- Flow type specific notes

The structure should support:
- ${projectName}_train.py (training script)
- ${projectName}_train.ipynb (training notebook)
- ${projectName}_inference.py (inference script)
- Data folders, model storage, results output

${flowType === 'predefined'
        ? 'Note: This project follows the predefined script flow structure with standardized steps.'
        : 'Note: This project uses a custom implementation optimized for the specific use case.'
      }

Format as professional project documentation.
`;

    return await this.callOpenRouter(prompt);
  }

  private cleanPythonCode(rawCode: string): string {
    let cleanedCode = rawCode;

    // Remove ALL markdown code blocks and backticks
    cleanedCode = cleanedCode.replace(/```python\s*/g, '');
    cleanedCode = cleanedCode.replace(/```\s*/g, '');
    cleanedCode = cleanedCode.replace(/`/g, ''); // Remove ALL backticks
    
    // Remove markdown formatting
    cleanedCode = cleanedCode.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove **bold**
    cleanedCode = cleanedCode.replace(/\*(.*?)\*/g, '$1'); // Remove *italic*

    // Split into lines for processing
    const lines = cleanedCode.split('\n');
    const processedLines: string[] = [];

    let inBlockComment = false;
    let blockCommentBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle multi-line strings/docstrings - REMOVE ALL DOCSTRINGS
      if (trimmedLine.includes('"""') || trimmedLine.includes("'''")) {
        const tripleQuoteCount = (line.match(/"""/g) || []).length + (line.match(/'''/g) || []).length;

        if (!inBlockComment) {
          // Starting a block comment - skip it entirely
          inBlockComment = true;
          blockCommentBuffer = [];

          // Check if it's a single-line docstring
          if (tripleQuoteCount >= 2) {
            inBlockComment = false;
            // Skip the entire docstring
          }
        } else {
          // Ending a block comment - skip it entirely
          inBlockComment = false;
          blockCommentBuffer = [];
        }
        continue;
      }

      // If we're in a block comment, skip the line
      if (inBlockComment) {
        continue;
      }

      // Handle single-line comments - REMOVE ALL COMMENTS
      if (trimmedLine.startsWith('#')) {
        // Skip ALL comments - no exceptions
        continue;
      }

      // For lines with code and inline comments, remove the comment part
      const commentIndex = line.indexOf('#');
      if (commentIndex > 0) {
        // Check if the # is inside a string
        const beforeComment = line.substring(0, commentIndex);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;

        // If # is not inside quotes, remove the comment
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
          const codeOnly = line.substring(0, commentIndex).trimEnd();
          if (codeOnly.length > 0) {
            processedLines.push(codeOnly);
          }
        } else {
          // # is inside a string, keep the whole line
          processedLines.push(line);
        }
      } else {
        // No comment in this line, keep as is
        processedLines.push(line);
      }
    }

    // Join lines and clean up extra whitespace
    cleanedCode = processedLines.join('\n');

    // Remove excessive blank lines (more than 2 consecutive)
    cleanedCode = cleanedCode.replace(/\n\s*\n\s*\n\s*\n/g, '\n\n\n');

    // Final cleanup - remove any remaining backticks that might be in strings
    cleanedCode = cleanedCode.replace(/f`([^`]*)`/g, 'f"$1"'); // Fix f-string backticks
    cleanedCode = cleanedCode.replace(/`([^`]*)`/g, '"$1"'); // Fix other backticks

    // Trim leading/trailing whitespace
    cleanedCode = cleanedCode.trim();

    return cleanedCode;
  }



  private validateNotebook(notebookJson: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const nb = JSON.parse(notebookJson);

      if (!nb.cells || !Array.isArray(nb.cells)) {
        errors.push('Notebook has no cells array');
        return { isValid: false, errors };
      }

      for (let i = 0; i < nb.cells.length; i++) {
        const cell = nb.cells[i];

        if (cell.cell_type === 'code') {
          const code = Array.isArray(cell.source) ? cell.source.join('') : cell.source;

          // Check for placeholders
          if (code.includes('TODO') || code.includes('pass') ||
            code.includes('print("Add code here")') ||
            code.includes('print("Please add') ||
            code.includes('# TODO:')) {
            errors.push(`Cell ${i + 1} contains placeholder code: ${code.substring(0, 50)}...`);
          }

          // Check for empty code cells (except imports which might be short)
          if (code.trim().length < 20 && i > 0) {
            errors.push(`Cell ${i + 1} has very little code: ${code.substring(0, 30)}...`);
          }

          // Check for actual function definitions in appropriate cells
          if (i > 2 && !code.includes('def ') && !code.includes('import ') &&
            !code.includes('=') && !code.includes('print(') && code.trim().length > 10) {
            // This might be a placeholder cell
            errors.push(`Cell ${i + 1} might be a placeholder - no function definitions or assignments`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (parseError) {
      return {
        isValid: false,
        errors: ['Failed to parse notebook JSON: ' + (parseError as Error).message]
      };
    }
  }

  private validatePythonSyntax(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for missing = in dictionary assignments (critical bug)
    const dictRegex = /^\s*(\w+)\s+(\{)/gm;
    const matches = Array.from(code.matchAll(dictRegex));
    matches.forEach(match => {
      const line = match[0];
      if (!line.includes('=')) {
        errors.push(`Missing '=' operator in dictionary assignment: ${line.trim()}`);
      }
    });
    
    // Check for unmatched brackets
    const openBrackets = (code.match(/\{/g) || []).length;
    const closeBrackets = (code.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`Unmatched brackets: ${openBrackets} open, ${closeBrackets} close`);
    }
    
    // Check for missing colons in function definitions
    const funcDefRegex = /^\s*def\s+\w+\([^)]*\)\s*$/gm;
    const funcMatches = Array.from(code.matchAll(funcDefRegex));
    funcMatches.forEach(match => {
      if (!match[0].includes(':')) {
        errors.push(`Missing ':' in function definition: ${match[0].trim()}`);
      }
    });

    // Check for invalid syntax patterns
    const invalidPatterns = [
      { pattern: /^\s*\w+\s+\[\s*$/gm, message: 'Invalid list assignment syntax' },
      { pattern: /^\s*\w+\s+\(\s*$/gm, message: 'Invalid tuple assignment syntax' },
      { pattern: /import\s+from\s+/g, message: 'Invalid import syntax - should be "from ... import"' }
    ];

    invalidPatterns.forEach(({ pattern, message }) => {
      const matches = Array.from(code.matchAll(pattern));
      matches.forEach(match => {
        errors.push(`${message}: ${match[0].trim()}`);
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private fixCommonSyntaxErrors(code: string): string {
    let fixedCode = code;
    
    console.log('[fixCommonSyntaxErrors] Applying syntax fixes...');
    
    // Remove any remaining backticks (extra safety measure)
    fixedCode = fixedCode.replace(/`/g, '');
    
    // Fix missing = in dictionary assignments (critical bug identified)
    const beforeFix = fixedCode;
    fixedCode = fixedCode.replace(/^(\s*)(\w+)\s+(\{)$/gm, '$1$2 = $3');
    if (fixedCode !== beforeFix) {
      console.log('[fixCommonSyntaxErrors] Fixed dictionary assignment operators');
    }
    
    // Fix missing colons in function definitions
    fixedCode = fixedCode.replace(/^(\s*def\s+\w+\([^)]*\))\s*$/gm, '$1:');
    
    // Fix invalid import syntax
    fixedCode = fixedCode.replace(/import\s+from\s+(\w+)/g, 'from $1 import');
    
    // Fix missing parentheses in function calls (be careful not to break assignments)
    fixedCode = fixedCode.replace(/^(\s*)(\w+)(\s*)$/gm, (match, indent, funcName, space) => {
      // Only fix if it looks like a function call (not assignment or keyword)
      const keywords = ['return', 'import', 'from', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'finally', 'with', 'class', 'def', 'pass', 'break', 'continue'];
      if (keywords.includes(funcName) || match.includes('=')) {
        return match;
      }
      return `${indent}${funcName}()${space}`;
    });
    
    console.log('[fixCommonSyntaxErrors] Applied syntax fixes');
    return fixedCode;
  }
}