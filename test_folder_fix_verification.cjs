/**
 * Test to verify the folder structure fix is working in the actual system
 */

const fetch = require('node-fetch');

async function testFolderStructureFix() {
    console.log('🧪 Testing Folder Structure Fix in Live System...\n');

    try {
        // Test data with nested folder structure
        const testData = {
            projectName: "test_folder_structure",
            instruction: "create a simple ML project with proper folder structure",
            plan: `
Project Structure
test_folder_structure/
├── README.md
├── requirements.txt
├── config.yaml
├── main.py
├── data/
│   ├── raw/
│   │   └── dataset.csv
│   └── processed/
│       └── clean_data.csv
├── models/
│   ├── trained/
│   │   └── model.pkl
│   └── configs/
│       └── model_config.json
├── src/
│   ├── data_processing.py
│   ├── model_training.py
│   └── utils/
│       ├── helpers.py
│       └── validators.py
├── tests/
│   ├── test_data.py
│   └── test_models.py
└── notebooks/
    ├── exploration.ipynb
    └── analysis.ipynb

Key Components:
- Data processing pipeline in src/
- Model training scripts
- Utility functions in src/utils/
- Comprehensive test suite
- Jupyter notebooks for analysis
`,
            model: "kwaipilot/kat-coder-pro:free",
            sessionId: "test_folder_fix_" + Date.now()
        };

        console.log('📋 Test Parameters:');
        console.log(`Project: ${testData.projectName}`);
        console.log(`Session: ${testData.sessionId}`);
        console.log('Expected nested structure with multiple levels\n');

        // Start streaming generation
        console.log('🚀 Starting project generation with streaming...');
        
        const streamResponse = await fetch('http://localhost:3001/api/stream/generate-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        if (!streamResponse.ok) {
            throw new Error(`Stream API failed: ${streamResponse.status} ${streamResponse.statusText}`);
        }

        console.log('📡 Monitoring generation progress...');
        
        // Monitor the stream
        let generationComplete = false;
        let filesGenerated = [];
        
        const reader = streamResponse.body;
        reader.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            lines.forEach(line => {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        
                        if (data.type === 'file_complete') {
                            filesGenerated.push({
                                path: data.filename,
                                content: data.content
                            });
                            console.log(`✅ Generated: ${data.filename}`);
                        } else if (data.type === 'complete') {
                            generationComplete = true;
                            console.log('🎉 Generation completed!');
                        } else if (data.type === 'error') {
                            console.error(`❌ Error: ${data.message}`);
                        }
                    } catch (e) {
                        // Ignore JSON parse errors for non-JSON lines
                    }
                }
            });
        });

        // Wait for completion
        await new Promise((resolve) => {
            const checkComplete = () => {
                if (generationComplete) {
                    resolve();
                } else {
                    setTimeout(checkComplete, 1000);
                }
            };
            checkComplete();
        });

        console.log('\n📊 FOLDER STRUCTURE ANALYSIS:');
        console.log('='.repeat(50));

        // Analyze the generated file structure
        const nestedFiles = filesGenerated.filter(f => f.path.includes('/'));
        const rootFiles = filesGenerated.filter(f => !f.path.includes('/'));

        console.log(`📄 Total files generated: ${filesGenerated.length}`);
        console.log(`📄 Root files: ${rootFiles.length}`);
        console.log(`📄 Nested files: ${nestedFiles.length}`);

        // Check specific nested paths
        const expectedNestedPaths = [
            'src/data_processing.py',
            'src/model_training.py',
            'src/utils/helpers.py',
            'src/utils/validators.py',
            'data/raw/dataset.csv',
            'data/processed/clean_data.csv',
            'models/trained/model.pkl',
            'models/configs/model_config.json',
            'tests/test_data.py',
            'tests/test_models.py',
            'notebooks/exploration.ipynb',
            'notebooks/analysis.ipynb'
        ];

        console.log('\n🔍 NESTED PATH VERIFICATION:');
        let correctPaths = 0;
        expectedNestedPaths.forEach(expectedPath => {
            const found = filesGenerated.some(f => f.path === expectedPath);
            console.log(`${found ? '✅' : '❌'} ${expectedPath}: ${found ? 'CORRECT' : 'MISSING'}`);
            if (found) correctPaths++;
        });

        // Check folder depth levels
        console.log('\n📁 FOLDER DEPTH ANALYSIS:');
        const depthLevels = {};
        filesGenerated.forEach(file => {
            const depth = (file.path.match(/\//g) || []).length;
            depthLevels[depth] = (depthLevels[depth] || 0) + 1;
        });

        Object.keys(depthLevels).sort().forEach(depth => {
            console.log(`Level ${depth}: ${depthLevels[depth]} files`);
        });

        // Final assessment
        console.log('\n🎯 FOLDER STRUCTURE FIX ASSESSMENT:');
        console.log('='.repeat(50));

        const successRate = (correctPaths / expectedNestedPaths.length) * 100;
        const hasNestedFiles = nestedFiles.length > 0;
        const hasMultipleLevels = Object.keys(depthLevels).length > 2;

        if (successRate >= 80 && hasNestedFiles && hasMultipleLevels) {
            console.log('🎉 SUCCESS: Folder structure fix is working perfectly!');
            console.log(`✅ ${successRate.toFixed(1)}% of expected nested paths are correct`);
            console.log(`✅ ${nestedFiles.length} files properly placed in subfolders`);
            console.log(`✅ Multiple folder depth levels detected`);
            console.log('✅ Files will download in proper folder structure!');
        } else if (successRate >= 50) {
            console.log('⚠️  PARTIAL SUCCESS: Folder structure is improved but not perfect');
            console.log(`⚠️  ${successRate.toFixed(1)}% of expected nested paths are correct`);
            if (!hasNestedFiles) {
                console.log('❌ No nested files detected - still placing all files in root');
            }
        } else {
            console.log('❌ FAILURE: Folder structure fix is not working');
            console.log(`❌ Only ${successRate.toFixed(1)}% of expected nested paths are correct`);
            console.log('❌ Files are still being placed incorrectly');
        }

        return {
            success: successRate >= 80 && hasNestedFiles,
            successRate,
            totalFiles: filesGenerated.length,
            nestedFiles: nestedFiles.length,
            correctPaths
        };

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test
console.log('🚀 Starting Folder Structure Fix Verification...\n');

testFolderStructureFix()
    .then(result => {
        console.log('\n🏁 Test Complete!');
        if (result.success) {
            console.log('✅ Folder structure fix is working correctly!');
            console.log('🎉 Users will now get properly organized project downloads!');
        } else {
            console.log('❌ Folder structure fix needs more work');
            if (result.error) {
                console.log(`Error: ${result.error}`);
            }
        }
    })
    .catch(error => {
        console.error('💥 Test execution failed:', error);
    });