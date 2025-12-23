import { PROJECT_TEMPLATES, type ProjectTemplate } from '../templates/projectTemplates.js';

export interface ValidationResult {
    isValid: boolean;
    score: number;
    missingFiles: string[];
    missingDependencies: string[];
    suggestions: string[];
    enhancedPlan: string;
}

export class StructureValidator {
    static validate(plan: string, domain: string): ValidationResult {
        const template = PROJECT_TEMPLATES[domain] || PROJECT_TEMPLATES.general;

        // Check for required files
        const missingFiles = this.findMissingFiles(plan, template.requiredFiles);

        // Check for required dependencies
        const missingDependencies = this.findMissingDependencies(plan, template.dependencies);

        // Calculate score
        const score = this.calculateScore(plan, template, missingFiles, missingDependencies);

        // Generate suggestions
        const suggestions = this.generateSuggestions(missingFiles, missingDependencies, domain);

        // Enhance plan if needed
        const enhancedPlan = this.enhancePlan(plan, missingFiles, missingDependencies, template);

        return {
            isValid: score >= 80,
            score,
            missingFiles,
            missingDependencies,
            suggestions,
            enhancedPlan
        };
    }

    private static findMissingFiles(plan: string, requiredFiles: string[]): string[] {
        return requiredFiles.filter(file =>
            !plan.toLowerCase().includes(file.toLowerCase())
        );
    }

    private static findMissingDependencies(plan: string, requiredDeps: string[]): string[] {
        return requiredDeps.filter(dep => {
            const depName = dep.split('>=')[0].split('==')[0];
            return !plan.toLowerCase().includes(depName.toLowerCase());
        });
    }

    private static calculateScore(plan: string, template: ProjectTemplate, missingFiles: string[], missingDeps: string[]): number {
        let score = 100;

        // Deduct for missing files
        score -= (missingFiles.length / template.requiredFiles.length) * 40;

        // Deduct for missing dependencies
        score -= (missingDeps.length / template.dependencies.length) * 20;

        // Check for structure sections
        if (!plan.includes('PROJECT STRUCTURE') && !plan.includes('Directory Structure')) {
            score -= 15;
        }

        // Check for training section
        if (!plan.toLowerCase().includes('training') || !plan.toLowerCase().includes('train.py')) {
            score -= 10;
        }

        // Check for evaluation section
        if (!plan.toLowerCase().includes('evaluation') && !plan.toLowerCase().includes('metrics')) {
            score -= 10;
        }

        // Check for deployment section
        if (!plan.toLowerCase().includes('deployment') && !plan.toLowerCase().includes('api')) {
            score -= 5;
        }

        return Math.max(0, score);
    }

    private static generateSuggestions(missingFiles: string[], missingDeps: string[], domain: string): string[] {
        const suggestions = [];

        if (missingFiles.length > 0) {
            suggestions.push(`Add missing essential files: ${missingFiles.join(', ')}`);
        }

        if (missingDeps.length > 0) {
            suggestions.push(`Include missing dependencies: ${missingDeps.join(', ')}`);
        }

        // Domain-specific suggestions
        if (domain === 'computer_vision') {
            if (missingFiles.some(f => f.includes('transforms'))) {
                suggestions.push('Add data augmentation and preprocessing transforms');
            }
        }

        if (domain === 'nlp') {
            if (missingFiles.some(f => f.includes('tokenizer'))) {
                suggestions.push('Include text tokenization and preprocessing');
            }
        }

        return suggestions;
    }

    private static enhancePlan(plan: string, missingFiles: string[], missingDeps: string[], template: ProjectTemplate): string {
        let enhanced = plan;

        if (missingFiles.length > 0) {
            enhanced += '\n\n## ADDITIONAL REQUIRED FILES\n\n';
            missingFiles.forEach(file => {
                enhanced += `### ${file}\n`;
                enhanced += this.getFileDescription(file, template) + '\n\n';
            });
        }

        if (missingDeps.length > 0) {
            enhanced += '\n\n## MISSING DEPENDENCIES\n\n```txt\n';
            enhanced += missingDeps.join('\n');
            enhanced += '\n```\n\n';
        }

        return enhanced;
    }

    private static getFileDescription(filename: string, template: ProjectTemplate): string {
        const descriptions: Record<string, string> = {
            'data_loader.py': 'Handles data loading, preprocessing, and batch creation for training and inference.',
            'transforms.py': 'Contains data augmentation and preprocessing transformations.',
            'model.py': 'Defines the neural network architecture and model classes.',
            'train.py': 'Main training script with epoch loops, validation, and checkpointing.',
            'evaluate.py': 'Model evaluation with metrics calculation and performance analysis.',
            'inference.py': 'Handles model inference and prediction on new data.',
            'config.py': 'Configuration management and hyperparameter settings.',
            'utils.py': 'Utility functions for logging, file operations, and helper methods.',
            'api.py': 'REST API endpoints for model serving and deployment.',
            'requirements.txt': 'Python package dependencies with version specifications.',
            'README.md': 'Project documentation with setup and usage instructions.'
        };

        return descriptions[filename] || `Essential file for project functionality: ${filename}`;
    }
}