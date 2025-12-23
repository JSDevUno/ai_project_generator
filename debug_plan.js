import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function debugPlan() {
    try {
        const planConfig = {
            projectName: "test_ml_project",
            instruction: "Create a simple image classification project",
            model: "kwaipilot/kat-coder-pro:free"
        };
        
        console.log('Sending request to:', `${BASE_URL}/api/plan/generate`);
        console.log('Config:', JSON.stringify(planConfig, null, 2));
        
        const response = await fetch(`${BASE_URL}/api/plan/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planConfig)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));
        
        const text = await response.text();
        console.log('Raw response:', text);
        
        try {
            const json = JSON.parse(text);
            console.log('Parsed JSON:', json);
        } catch (e) {
            console.log('Failed to parse as JSON:', e.message);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

debugPlan();