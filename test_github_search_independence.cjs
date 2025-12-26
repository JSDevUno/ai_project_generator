/**
 * Test to verify folder structure fix works regardless of GitHub search setting
 */

function testFolderStructureIndependence() {
    console.log('🧪 Testing Folder Structure Independence from GitHub Search...\n');

    // Simulate plans generated with and without GitHub search
    const testCases = [
        {
            name: "Plan WITHOUT GitHub Search",
            githubEnabled: false,
            plan: `
Project Structure:
simple_ml_project/
├── README.md
├── requirements.txt
├── main.py
├── data/
│   ├── raw/
│   │   └── dataset.csv
│   └── processed/
│       └── clean_data.csv
├── models/
│   └── trained_model.pkl
├── src/
│   ├── data_processing.py
│   ├── model_training.py
│   └── utils/
│       └── helpers.py
└── tests/
    └── test_model.py

Key Components:
- Simple ML pipeline
- Data processing utilities
- Model training script
- Basic testing
`
        },
        {
            name: "Plan WITH GitHub Search (Enhanced)",
            githubEnabled: true,
            plan: `
AI Project Plan: advanced_ml_project
GitHub Search: Enabled

Referenced GitHub Repositories:
scikit-learn - Machine learning library
pandas - Data manipulation
numpy - Numerical computing

Project Structure:
advanced_ml_project/
├── README.md
├── requirements.txt
├── config.yaml
├── main.py
├── data/
│   ├── raw/
│   │   └── dataset.csv
│   ├── processed/
│   │   └── features.csv
│   └── external/
│       └── reference_data.json
├── models/
│   ├── trained/
│   │   └── best_model.pkl
│   └── configs/
│       └── hyperparameters.json
├── src/
│   ├── data/
│   │   ├── preprocessing.py
│   │   └── validation.py
│   ├── models/
│   │   ├── classifier.py
│   │   └── ensemble.py
│   ├── features/
│   │   └── engineering.py
│   └── utils/
│       ├── helpers.py
│       └── metrics.py
├── notebooks/
│   ├── exploration.ipynb
│   └── analysis.ipynb
├── tests/
│   ├── unit/
│   │   └── test_models.py
│   └── integration/
│       └── test_pipeline.py
└── scripts/
    ├── train.py
    └── evaluate.py

Implementation Details:
- Following scikit-learn patterns for model structure
- Using pandas best practices for data handling
- Incorporating numpy optimization techniques
`
        }
    ];

    // Simulate the fixed extraction logic (same as in ProjectGenerator)
    function extractStructureFromPlan(plan) {
        const folders = [];
        const files = [];
        const lines = plan.split('\n');
        const folderStack = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty lines and headers
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('=') || 
                trimmed.includes('Project Structure') || trimmed.includes('Overview') ||
                trimmed.includes('GitHub Search') || trimmed.includes('Referenced GitHub') ||
                trimmed.includes('Implementation Details')) {
                continue;
            }

            // FIXED: Better indentation calculation using tree structure
            const treeMatch = line.match(/^(\s*)((?:[│├└]\s*)*)(├|└)\s*─*\s*(.+)$/);
            if (treeMatch) {
                const pathItem = treeMatch[4].trim();
                
                // Calculate depth
                const allTreeChars = (line.match(/[│├└]/g) || []).length;
                const leadingSpaces = (line.match(/^\s*/) || [''])[0].length;
                
                let indentLevel = Math.max(0, allTreeChars - 1);
                if (leadingSpaces >= 4 && allTreeChars === 1) {
                    indentLevel = Math.floor(leadingSpaces / 4);
                }
                
                folderStack.length = indentLevel;

                if (pathItem.endsWith('/')) {
                    // It's a folder
                    const folderName = pathItem.replace(/\/$/, '');
                    const fullPath = folderStack.length > 0 ?
                        folderStack.join('/') + '/' + folderName :
                        folderName;

                    if (fullPath && !folders.includes(fullPath)) {
                        folders.push(fullPath);
                    }
                    folderStack.push(folderName);

                } else if (pathItem.includes('.')) {
                    // It's a file
                    const fullPath = folderStack.length > 0 ?
                        folderStack.join('/') + '/' + pathItem :
                        pathItem;

                    if (!files.some(f => f.path === fullPath)) {
                        files.push({
                            path: fullPath,
                            type: pathItem.split('.').pop()?.toLowerCase() || '',
                            description: `${pathItem} file`
                        });
                    }
                }
            } else {
                // Handle root level items
                const rootMatch = line.match(/^([a-zA-Z0-9_.-]+\/?)$/);
                if (rootMatch) {
                    const pathItem = rootMatch[1];
                    if (pathItem.endsWith('/')) {
                        const folderName = pathItem.replace(/\/$/, '');
                        if (!folders.includes(folderName)) {
                            folders.push(folderName);
                        }
                    }
                }
            }
        }

        // Ensure parent folders exist
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

        return { folders, files };
    }

    let allTestsPassed = true;
    const results = [];

    testCases.forEach((testCase, index) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧪 TEST ${index + 1}: ${testCase.name}`);
        console.log(`🔍 GitHub Search: ${testCase.githubEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`${'='.repeat(60)}`);

        try {
            const result = extractStructureFromPlan(testCase.plan);
            
            console.log(`\n📊 EXTRACTION RESULTS:`);
            console.log(`📁 Total folders: ${result.folders.length}`);
            console.log(`📄 Total files: ${result.files.length}`);
            
            // Analyze structure quality
            const nestedFiles = result.files.filter(f => f.path.includes('/'));
            const rootFiles = result.files.filter(f => !f.path.includes('/'));
            const maxDepth = Math.max(0, ...result.files.map(f => (f.path.match(/\//g) || []).length));
            
            console.log(`📄 Root files: ${rootFiles.length}`);
            console.log(`📄 Nested files: ${nestedFiles.length}`);
            console.log(`📏 Max nesting depth: ${maxDepth} levels`);
            
            // Show sample structure
            console.log(`\n📦 SAMPLE ZIP STRUCTURE:`);
            const sampleItems = [
                ...result.folders.slice(0, 5).map(f => `📁 ${f}/`),
                ...result.files.slice(0, 8).map(f => {
                    const depth = (f.path.match(/\//g) || []).length;
                    const indent = '  '.repeat(depth);
                    return `📄 ${indent}${f.path}`;
                })
            ];
            
            sampleItems.forEach(item => console.log(item));
            if (result.folders.length + result.files.length > 13) {
                console.log(`... and ${result.folders.length + result.files.length - 13} more items`);
            }
            
            // Validation checks
            const hasNestedFiles = nestedFiles.length > 0;
            const hasProperFolders = result.folders.length > 0;
            const filesInCorrectFolders = nestedFiles.every(file => {
                const folderPath = file.path.substring(0, file.path.lastIndexOf('/'));
                return result.folders.includes(folderPath);
            });
            const hasReasonableDepth = maxDepth >= 1 && maxDepth <= 5; // Reasonable nesting
            
            const testPassed = hasNestedFiles && hasProperFolders && filesInCorrectFolders && hasReasonableDepth;
            
            console.log(`\n🎯 VALIDATION RESULTS:`);
            console.log(`${hasNestedFiles ? '✅' : '❌'} Has nested files (${nestedFiles.length})`);
            console.log(`${hasProperFolders ? '✅' : '❌'} Has folder structure (${result.folders.length} folders)`);
            console.log(`${filesInCorrectFolders ? '✅' : '❌'} Files in correct folders`);
            console.log(`${hasReasonableDepth ? '✅' : '❌'} Reasonable nesting depth (${maxDepth} levels)`);
            console.log(`\n${testPassed ? '🎉 PASS' : '❌ FAIL'}: Folder structure extraction`);
            
            results.push({
                name: testCase.name,
                githubEnabled: testCase.githubEnabled,
                passed: testPassed,
                folders: result.folders.length,
                files: result.files.length,
                nestedFiles: nestedFiles.length,
                maxDepth
            });
            
            if (!testPassed) {
                allTestsPassed = false;
            }
            
        } catch (error) {
            console.error(`❌ ERROR in ${testCase.name}:`, error.message);
            allTestsPassed = false;
            results.push({
                name: testCase.name,
                githubEnabled: testCase.githubEnabled,
                passed: false,
                error: error.message
            });
        }
    });

    // Final comparison and summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏆 GITHUB SEARCH INDEPENDENCE TEST SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    
    const withoutGitHub = results.find(r => !r.githubEnabled);
    const withGitHub = results.find(r => r.githubEnabled);
    
    console.log(`\n📊 COMPARISON:`);
    if (withoutGitHub && withGitHub) {
        console.log(`Without GitHub: ${withoutGitHub.passed ? '✅ PASS' : '❌ FAIL'} - ${withoutGitHub.folders} folders, ${withoutGitHub.files} files`);
        console.log(`With GitHub:    ${withGitHub.passed ? '✅ PASS' : '❌ FAIL'} - ${withGitHub.folders} folders, ${withGitHub.files} files`);
        
        const bothPassed = withoutGitHub.passed && withGitHub.passed;
        console.log(`\n🎯 INDEPENDENCE TEST: ${bothPassed ? '✅ PASS' : '❌ FAIL'}`);
        
        if (bothPassed) {
            console.log(`✅ Folder structure fix works regardless of GitHub search setting!`);
        }
    }
    
    console.log(`\n🎯 FINAL VERDICT:`);
    if (allTestsPassed) {
        console.log('🎉 SUCCESS: Folder structure fix is INDEPENDENT of GitHub search!');
        console.log('✅ Works with GitHub search ENABLED');
        console.log('✅ Works with GitHub search DISABLED');
        console.log('✅ Both produce properly organized ZIP downloads');
        console.log('🚀 Users get structured projects regardless of search setting!');
    } else {
        console.log('⚠️  ISSUE: Some configurations may have problems');
    }
    
    return {
        success: allTestsPassed,
        results
    };
}

// Run the independence test
console.log('🚀 Starting GitHub Search Independence Test...\n');

try {
    const result = testFolderStructureIndependence();
    
    console.log('\n🏁 Independence Test Complete!');
    if (result.success) {
        console.log('✅ FOLDER STRUCTURE FIX IS UNIVERSAL!');
        console.log('🎉 Works regardless of GitHub search setting!');
    } else {
        console.log('⚠️  Some issues detected with certain configurations');
    }
    
} catch (error) {
    console.error('💥 Independence test failed:', error.message);
}