import dotenv from 'dotenv';

dotenv.config();

export interface NotebookCell {
    cellNumber: number;
    type: 'markdown' | 'code';
    purpose: string;
    content: string;
}

export interface NotebookPlan {
    title: string;
    totalCells: number;
    cells: NotebookCell[];
}

export class NotebookPlanGenerator {
    private apiKey: string;
    private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY!;
    }

    async generatePlan(instruction: string, model: string): Promise<NotebookPlan> {
        const prompt = this.createPlanPrompt(instruction);

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
        const planText = data.choices[0].message.content;

        return this.parsePlan(planText);
    }

    async revisePlan(originalPlan: NotebookPlan, feedback: string, model: string): Promise<NotebookPlan> {
        const prompt = this.createRevisionPrompt(originalPlan, feedback);

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
        const planText = data.choices[0].message.content;

        return this.parsePlan(planText);
    }

    private createPlanPrompt(instruction: string): string {
        return `You are an expert Jupyter notebook planner. Create a detailed notebook plan.

User Request: ${instruction}

Create a detailed notebook plan following this EXACT format:

NOTEBOOK PLAN:
Title: [Descriptive title]
Total Cells: [Number]

Cell 1 [markdown/code]:
Purpose: [What this accomplishes]
Content: [Brief description]

Cell 2 [markdown/code]:
Purpose: [What this accomplishes]
Content: [Brief description]

... continue for all cells ...

---
Does this plan look good? Reply 'yes' to proceed with generation, or suggest changes.

RULES:
- Be specific about what each cell will contain
- Number all cells sequentially starting from 1
- Clearly mark cell types as [markdown] or [code]
- Make the plan easy to understand
- Include appropriate mix of markdown (documentation) and code cells
- Ensure code flows logically from cell to cell
- First cell should typically be markdown with title
- Import cells should come before usage`;
    }

    private createRevisionPrompt(originalPlan: NotebookPlan, feedback: string): string {
        const planText = this.formatPlanAsText(originalPlan);

        return `You are an expert Jupyter notebook planner. Revise the notebook plan based on user feedback.

Original Plan:
${planText}

User Feedback: ${feedback}

Create a REVISED notebook plan following this EXACT format:

NOTEBOOK PLAN (Revised):
Title: [Descriptive title]
Total Cells: [Number]

Cell 1 [markdown/code]:
Purpose: [What this accomplishes]
Content: [Brief description]

Cell 2 [markdown/code]:
Purpose: [What this accomplishes]
Content: [Brief description]

... continue for all cells ...

---
Does this revised plan look good? Reply 'yes' to proceed with generation, or suggest changes.

RULES:
- Incorporate the user's feedback
- Maintain logical flow
- Number cells sequentially
- Mark types clearly as [markdown] or [code]`;
    }

    private formatPlanAsText(plan: NotebookPlan): string {
        let text = `NOTEBOOK PLAN:\nTitle: ${plan.title}\nTotal Cells: ${plan.totalCells}\n\n`;

        for (const cell of plan.cells) {
            text += `Cell ${cell.cellNumber} [${cell.type}]:\n`;
            text += `Purpose: ${cell.purpose}\n`;
            text += `Content: ${cell.content}\n\n`;
        }

        return text;
    }

    private parsePlan(planText: string): NotebookPlan {
        const lines = planText.split('\n');
        let title = 'Untitled Notebook';
        let totalCells = 0;
        const cells: NotebookCell[] = [];

        let currentCell: Partial<NotebookCell> | null = null;

        for (const line of lines) {
            const trimmed = line.trim();

            // Parse title
            if (trimmed.startsWith('Title:')) {
                title = trimmed.substring(6).trim();
                continue;
            }

            // Parse total cells
            if (trimmed.startsWith('Total Cells:')) {
                const match = trimmed.match(/\d+/);
                if (match) {
                    totalCells = parseInt(match[0]);
                }
                continue;
            }

            // Parse cell header
            const cellMatch = trimmed.match(/^Cell\s+(\d+)\s+\[(markdown|code)\]:/i);
            if (cellMatch) {
                if (currentCell && currentCell.cellNumber) {
                    cells.push(currentCell as NotebookCell);
                }

                currentCell = {
                    cellNumber: parseInt(cellMatch[1]),
                    type: cellMatch[2].toLowerCase() as 'markdown' | 'code',
                    purpose: '',
                    content: ''
                };
                continue;
            }

            // Parse purpose
            if (trimmed.startsWith('Purpose:') && currentCell) {
                currentCell.purpose = trimmed.substring(8).trim();
                continue;
            }

            // Parse content
            if (trimmed.startsWith('Content:') && currentCell) {
                currentCell.content = trimmed.substring(8).trim();
                continue;
            }
        }

        // Add last cell
        if (currentCell && currentCell.cellNumber) {
            cells.push(currentCell as NotebookCell);
        }

        return {
            title,
            totalCells: totalCells || cells.length,
            cells
        };
    }
}
