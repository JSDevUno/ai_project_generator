import dotenv from 'dotenv';
import type { NotebookPlan } from './notebookPlanGenerator.js';

dotenv.config();

export interface NotebookJSON {
    cells: Array<{
        cell_type: 'markdown' | 'code';
        metadata: Record<string, unknown>;
        source: string[];
        execution_count?: null;
        outputs?: unknown[];
    }>;
    metadata: {
        kernelspec: {
            display_name: string;
            language: string;
            name: string;
        };
        language_info: {
            codemirror_mode: {
                name: string;
                version: number;
            };
            file_extension: string;
            mimetype: string;
            name: string;
            nbconvert_exporter: string;
            pygments_lexer: string;
            version: string;
        };
    };
    nbformat: number;
    nbformat_minor: number;
}

export class NotebookGenerator {
    private apiKey: string;
    private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY!;
    }

    async generateNotebook(plan: NotebookPlan, model: string): Promise<NotebookJSON> {
        const prompt = this.createGenerationPrompt(plan);

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-project-generator.local',
                'X-Title': 'Universal AI Project Generator - Notebook Mode',
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        let jsonText = data.choices[0].message.content;

        // Clean the response
        jsonText = this.cleanJSONResponse(jsonText);

        // Parse and validate
        const notebook = JSON.parse(jsonText);
        this.validateNotebook(notebook);

        return notebook;
    }

    private createGenerationPrompt(plan: NotebookPlan): string {
        const planText = this.formatPlanForGeneration(plan);

        return `You are an expert Jupyter notebook generator. Generate a valid Jupyter notebook JSON.

APPROVED PLAN:
${planText}

Generate a valid Jupyter notebook JSON following these CRITICAL CONSTRAINTS:

1. OUTPUT FORMAT:
   - Output ONLY valid JSON (no markdown blocks, no explanations)
   - Start with { and end with }
   - No preamble or explanatory text

2. REQUIRED STRUCTURE:
{
  "cells": [],
  "metadata": {...},
  "nbformat": 4,
  "nbformat_minor": 5
}

3. METADATA (exact format):
"metadata": {
  "kernelspec": {
    "display_name": "Python 3",
    "language": "python",
    "name": "python3"
  },
  "language_info": {
    "codemirror_mode": {"name": "ipython", "version": 3},
    "file_extension": ".py",
    "mimetype": "text/x-python",
    "name": "python",
    "nbconvert_exporter": "python",
    "pygments_lexer": "ipython3",
    "version": "3.10.0"
  }
}

4. CELL STRUCTURE:
Markdown cells:
{
  "cell_type": "markdown",
  "metadata": {},
  "source": ["line 1\\n", "line 2\\n", "last line"]
}

Code cells:
{
  "cell_type": "code",
  "execution_count": null,
  "metadata": {},
  "outputs": [],
  "source": ["line 1\\n", "line 2\\n", "last line"]
}

5. SOURCE ARRAY RULES (CRITICAL):
   - source MUST be an array of strings
   - Each line ends with \\n except optionally the last
   - Empty lines are "\\n"
   - Preserve indentation

6. CODE EXECUTION:
   - Code must execute top-to-bottom
   - No forward references
   - Imports before usage
   - Valid Python syntax

7. MATCH THE PLAN EXACTLY:
   - ${plan.totalCells} cells total
   - Follow cell types exactly (markdown/code)
   - Follow content descriptions exactly
   - Follow the user's specified style/pattern

8. PATTERN FLEXIBILITY (CRITICAL):
   - If plan mentions exploratory style: use exploratory data analysis approach
   - If plan mentions functional style: use functional programming patterns
   - If plan mentions OOP style: use object-oriented programming approach
   - If plan mentions minimal/compact: use concise, minimal code
   - If plan mentions verbose/detailed: include extensive comments and explanations
   - If plan mentions production-ready: include error handling, logging, validation
   - The pattern, style, and organization are ENTIRELY controlled by the approved plan
   - Do NOT add your own style preferences or assumptions
   - Do NOT deviate from the plan's specifications

Generate the notebook JSON now (JSON only, no markdown blocks):`;
    }

    private formatPlanForGeneration(plan: NotebookPlan): string {
        let text = `Title: ${plan.title}\nTotal Cells: ${plan.totalCells}\n\n`;

        for (const cell of plan.cells) {
            text += `Cell ${cell.cellNumber} [${cell.type}]:\n`;
            text += `Purpose: ${cell.purpose}\n`;
            text += `Content: ${cell.content}\n\n`;
        }

        return text;
    }

    private cleanJSONResponse(text: string): string {
        // Remove markdown code blocks
        text = text.replace(/```json\s*/g, '');
        text = text.replace(/```\s*/g, '');

        // Remove any text before first {
        const firstBrace = text.indexOf('{');
        if (firstBrace > 0) {
            text = text.substring(firstBrace);
        }

        // Remove any text after last }
        const lastBrace = text.lastIndexOf('}');
        if (lastBrace !== -1 && lastBrace < text.length - 1) {
            text = text.substring(0, lastBrace + 1);
        }

        return text.trim();
    }

    private validateNotebook(notebook: any): void {
        // Validate top-level structure
        if (!notebook.cells || !Array.isArray(notebook.cells)) {
            throw new Error('Invalid notebook: missing or invalid cells array');
        }

        if (!notebook.metadata) {
            throw new Error('Invalid notebook: missing metadata');
        }

        if (notebook.nbformat !== 4) {
            throw new Error('Invalid notebook: nbformat must be 4');
        }

        if (typeof notebook.nbformat_minor !== 'number') {
            throw new Error('Invalid notebook: nbformat_minor must be a number');
        }

        // Validate each cell
        for (let i = 0; i < notebook.cells.length; i++) {
            const cell = notebook.cells[i];

            if (!cell.cell_type || !['markdown', 'code'].includes(cell.cell_type)) {
                throw new Error(`Invalid cell ${i}: missing or invalid cell_type`);
            }

            if (!cell.source || !Array.isArray(cell.source)) {
                throw new Error(`Invalid cell ${i}: source must be an array`);
            }

            if (cell.cell_type === 'code') {
                if (!('execution_count' in cell)) {
                    throw new Error(`Invalid cell ${i}: code cells must have execution_count`);
                }

                if (!('outputs' in cell)) {
                    throw new Error(`Invalid cell ${i}: code cells must have outputs array`);
                }
            }
        }
    }
}
