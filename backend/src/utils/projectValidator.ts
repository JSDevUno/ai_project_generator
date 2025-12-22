/**
 * Project Validation Utility
 * Validates that generated projects match their plans exactly
 */

export interface ValidationReport {
    isValid: boolean;
    score: number; // 0-100 percentage
    summary: string;
    details: {
        structureMatch: boolean;
        filesMatch: boolean;
        contentQuality: boolean;
    };
    errors: string[];
    warnings: string[];
    suggestions: string[];
}

export class ProjectValidator {
    /**
     * Validate a generated project against its plan
     */
    static validateProject(
        plan: string,
        generatedFiles: Array<{ path: string; content: string }>,
        generatedFolders: string[]
    ): ValidationReport {
        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];
        
        // Extract expected structure from plan
        const expectedStructure = this.extractExpectedStructure(plan);
        
        // Check structure match
        const structureMatch = this.validateStructure(
            expectedStructure,
            generatedFiles,
            generatedFolders,
            errors,
            warnings
        );
        
        // Check file content quality
        const contentQuality = this.validateContentQuality(
            generatedFiles,
            errors,
            warnings,
            suggestions
        );
        
        // Calculate score
        const score = this.calculateScore(structureMatch, contentQuality, errors.length, warnings.length);
        
        // Generate summary
        const summary = this.generateSummary(score, errors.length, warnings.length);
        
        return {
            isValid: errors.length === 0,
            score,
            summary,
            details: {
                structureMatch,
                filesMatch: structureMatch, // Same for now
                contentQuality
            },
            errors,
            warnings,
            suggestions
        };
    }
    
    /**
     * Extract expected structure from plan text
     */
    private static extractExpectedStructure(plan: string): {
        expectedFiles: string[];
        expectedFolders: string[];
    } {
        const expectedFiles: string[] = [];
        const expectedFolders: string[] = [];
        
        const lines = plan.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Extract files (have extensions)
            const fileMatches = trimmed.match(/([a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+)/g);
            if (fileMatches) {
                fileMatches.forEach(file => {
                    if (!expectedFiles.includes(file)) {
                        expectedFiles.push(file);
                    }
                });
            }
            
            // Extract folders (end with / or are directory names)
            const folderMatches = trimmed.match(/([a-zA-Z0-9_-]+\/(?:[a-zA-Z0-9_/-]*)?)/g);
            if (folderMatches) {
                folderMatches.forEach(folder => {
                    const cleanFolder = folder.replace(/\/$/, '');
                    if (cleanFolder && !expectedFolders.includes(cleanFolder)) {
                        expectedFolders.push(cleanFolder);
                    }
                });
            }
        }
        
        return { expectedFiles, expectedFolders };
    }
    
    /**
     * Validate project structure
     */
    private static validateStructure(
        expected: { expectedFiles: string[]; expectedFolders: string[] },
        generatedFiles: Array<{ path: string; content: string }>,
        generatedFolders: string[],
        errors: string[],
        warnings: string[]
    ): boolean {
        let structureValid = true;
        
        // Check for missing files
        for (const expectedFile of expected.expectedFiles) {
            const found = generatedFiles.find(f => f.path === expectedFile);
            if (!found) {
                errors.push(`Missing expected file: ${expectedFile}`);
                structureValid = false;
            }
        }
        
        // Check for missing folders
        for (const expectedFolder of expected.expectedFolders) {
            const hasFileInFolder = generatedFiles.some(f => 
                f.path.startsWith(expectedFolder + '/') || 
                generatedFolders.includes(expectedFolder)
            );
            if (!hasFileInFolder) {
                warnings.push(`Expected folder not represented: ${expectedFolder}`);
            }
        }
        
        // Check for unexpected files (not necessarily bad)
        for (const generatedFile of generatedFiles) {
            if (!expected.expectedFiles.includes(generatedFile.path)) {
                warnings.push(`Generated file not in plan: ${generatedFile.path}`);
            }
        }
        
        return structureValid;
    }
    
    /**
     * Validate content quality
     */
    private static validateContentQuality(
        generatedFiles: Array<{ path: string; content: string }>,
        errors: string[],
        warnings: string[],
        suggestions: string[]
    ): boolean {
        let contentValid = true;
        
        for (const file of generatedFiles) {
            const { path, content } = file;
            
            // Basic content checks
            if (!content || content.trim().length === 0) {
                errors.push(`Empty file: ${path}`);
                contentValid = false;
                continue;
            }
            
            // Python file validation
            if (path.endsWith('.py')) {
                const pythonIssues = this.validatePythonContent(content);
                if (pythonIssues.errors.length > 0) {
                    errors.push(...pythonIssues.errors.map(e => `${path}: ${e}`));
                    contentValid = false;
                }
                warnings.push(...pythonIssues.warnings.map(w => `${path}: ${w}`));
                suggestions.push(...pythonIssues.suggestions.map(s => `${path}: ${s}`));
            }
            
            // YAML file validation
            if (path.endsWith('.yaml') || path.endsWith('.yml')) {
                const yamlIssues = this.validateYamlContent(content);
                if (yamlIssues.errors.length > 0) {
                    errors.push(...yamlIssues.errors.map(e => `${path}: ${e}`));
                    contentValid = false;
                }
                warnings.push(...yamlIssues.warnings.map(w => `${path}: ${w}`));
            }
            
            // JSON file validation
            if (path.endsWith('.json')) {
                try {
                    JSON.parse(content);
                } catch (e) {
                    errors.push(`${path}: Invalid JSON syntax`);
                    contentValid = false;
                }
            }
            
            // Check for markdown artifacts
            if (content.includes('```') || content.includes('**') && path.endsWith('.py')) {
                warnings.push(`${path}: Contains markdown formatting that should be cleaned`);
            }
        }
        
        return contentValid;
    }
    
    /**
     * Validate Python content
     */
    private static validatePythonContent(content: string): {
        errors: string[];
        warnings: string[];
        suggestions: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];
        
        // Check for basic Python structure
        if (!content.includes('import') && !content.includes('def') && !content.includes('class')) {
            warnings.push('Missing imports, functions, or classes');
        }
        
        // Check bracket matching
        const openBrackets = (content.match(/\[/g) || []).length;
        const closeBrackets = (content.match(/\]/g) || []).length;
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        
        if (openBrackets !== closeBrackets) {
            errors.push('Unmatched square brackets');
        }
        if (openParens !== closeParens) {
            errors.push('Unmatched parentheses');
        }
        if (openBraces !== closeBraces) {
            errors.push('Unmatched curly braces');
        }
        
        // Check for common issues
        if (content.includes('```python') || content.includes('```')) {
            warnings.push('Contains markdown code blocks');
        }
        
        // Check for good practices
        if (content.includes('def ') && !content.includes('"""') && !content.includes("'''")) {
            suggestions.push('Consider adding docstrings to functions');
        }
        
        if (content.includes('import ') && !content.includes('from ')) {
            suggestions.push('Consider using specific imports (from module import function)');
        }
        
        return { errors, warnings, suggestions };
    }
    
    /**
     * Validate YAML content
     */
    private static validateYamlContent(content: string): {
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        const lines = content.split('\n');
        let hasValidYamlStructure = false;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                if (trimmed.includes(':') || trimmed.startsWith('-')) {
                    hasValidYamlStructure = true;
                }
            }
        }
        
        if (!hasValidYamlStructure) {
            warnings.push('May not be valid YAML format');
        }
        
        return { errors, warnings };
    }
    
    /**
     * Calculate overall score
     */
    private static calculateScore(
        structureMatch: boolean,
        contentQuality: boolean,
        errorCount: number,
        warningCount: number
    ): number {
        let score = 100;
        
        // Deduct for structure issues
        if (!structureMatch) score -= 30;
        
        // Deduct for content quality issues
        if (!contentQuality) score -= 20;
        
        // Deduct for errors and warnings
        score -= errorCount * 10;
        score -= warningCount * 2;
        
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * Generate summary message
     */
    private static generateSummary(score: number, errorCount: number, warningCount: number): string {
        if (score >= 90) {
            return `Excellent project quality (${score}%). Ready for use!`;
        } else if (score >= 75) {
            return `Good project quality (${score}%). Minor issues to address.`;
        } else if (score >= 60) {
            return `Fair project quality (${score}%). Several issues need attention.`;
        } else {
            return `Poor project quality (${score}%). Significant issues require fixing.`;
        }
    }
}