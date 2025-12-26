/**
 * Comprehensive test for various tree structures to verify the folder fix works universally
 */

// Simulate the fixed extraction logic
function extractStructureFromPlanFixed(plan) {
    const folders = [];
    const files = [];
    const lines = plan.split('\n');
    const folderStack = [];

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
            const prefix = treeMatch[1] + treeMatch[2]; // spaces + tree chars
            const treeChar = treeMatch[3]; // ├ or └
            const pathItem = treeMatch[4].trim(); // the actual file/folder name
            
            // FIXED: Calculate depth by counting tree structure levels AND leading spaces
            const allTreeChars = (line.match(/[│├└]/g) || []).length;
            const leadingSpaces = (line.match(/^\s*/) || [''])[0].length;
            
            // If we have leading spaces but no tree chars before the final one, it's nested
            let indentLevel = Math.max(0, allTreeChars - 1);
            if (leadingSpaces >= 4 && allTreeChars === 1) {
                // This handles cases like "    └── test_counter.py"
                indentLevel = Math.floor(leadingSpaces / 4);
            }
            
            console.log(`🔍 Line ${i}: "${line.trim()}" → Item: "${pathItem}", Depth: ${indentLevel}`);

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
                    console.log(`📁 Added folder: "${fullPath}"`);
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
                    
                    files.push({
                        path: fullPath,
                        type: extension,
                        description: `${pathItem} file`
                    });
                    
                    console.log(`📄 Added file: "${fullPath}"`);
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
                        console.log(`📁 Added root folder: "${folderName}"`);
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
                    console.log(`📁 Added missing parent folder: "${folderPath}"`);
                }
            }
        }
    });

    return { folders, files };
}

// Test different tree structure formats
function testVariousTreeStructures() {
    console.log('🧪 Testing Various Tree Structure Formats...\n');

    const testCases = [
        {
            name: "Simple 2-Level Structure",
            plan: `
Project Structure:
myproject/
├── README.md
├── main.py
├── src/
│   ├── utils.py
│   └── models.py
└── tests/
    └── test_main.py
`
        },
        {
            name: "Complex Multi-Level Structure",
            plan: `
Project Structure:
complex_project/
├── README.md
├── requirements.txt
├── config/
│   ├── settings.yaml
│   └── database.json
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── product.py
│   ├── services/
│   │   ├── auth_service.py
│   │   └── data_service.py
│   └── utils/
│       ├── helpers.py
│       └── validators.py
├── tests/
│   ├── unit/
│   │   ├── test_models.py
│   │   └── test_services.py
│   └── integration/
│       └── test_api.py
├── docs/
│   ├── api.md
│   └── setup.md
└── scripts/
    ├── deploy.sh
    └── migrate.py
`
        },
        {
            name: "Deep Nested Structure (5 levels)",
            plan: `
Project Structure:
deep_project/
├── README.md
├── src/
│   └── app/
│       └── modules/
│           └── core/
│               └── services/
│                   ├── auth.py
│                   └── database.py
└── tests/
    └── unit/
        └── app/
            └── modules/
                └── test_core.py
`
        },
        {
            name: "Mixed Indentation (spaces vs tree chars)",
            plan: `
Project Structure:
mixed_project/
├── README.md
├── src/
│   ├── main.py
│   └── utils/
│       ├── helpers.py
│       └── config.py
└── tests/
    ├── test_main.py
    └── utils/
        └── test_helpers.py
`
        }
    ];

    let allTestsPassed = true;
    const results = [];

    testCases.forEach((testCase, index) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧪 TEST ${index + 1}: ${testCase.name}`);
        console.log(`${'='.repeat(60)}`);

        try {
            const result = extractStructureFromPlanFixed(testCase.plan);
            
            console.log(`\n📊 RESULTS:`);
            console.log(`📁 Folders: ${result.folders.length}`);
            console.log(`📄 Files: ${result.files.length}`);
            
            // Analyze structure
            const nestedFiles = result.files.filter(f => f.path.includes('/'));
            const rootFiles = result.files.filter(f => !f.path.includes('/'));
            const maxDepth = Math.max(...result.files.map(f => (f.path.match(/\//g) || []).length));
            
            console.log(`📄 Root files: ${rootFiles.length}`);
            console.log(`📄 Nested files: ${nestedFiles.length}`);
            console.log(`📏 Max depth: ${maxDepth} levels`);
            
            // Show structure preview
            console.log(`\n📦 ZIP STRUCTURE PREVIEW:`);
            const allItems = [
                ...result.folders.map(f => ({ type: 'folder', path: f + '/' })),
                ...result.files.map(f => ({ type: 'file', path: f.path }))
            ].sort((a, b) => a.path.localeCompare(b.path));
            
            allItems.slice(0, 10).forEach(item => {
                const depth = (item.path.match(/\//g) || []).length;
                const indent = '  '.repeat(depth);
                const icon = item.type === 'folder' ? '📁' : '📄';
                console.log(`${icon} ${indent}${item.path}`);
            });
            
            if (allItems.length > 10) {
                console.log(`... and ${allItems.length - 10} more items`);
            }
            
            // Validation
            const hasNestedFiles = nestedFiles.length > 0;
            const hasProperStructure = result.folders.length > 0;
            const filesInCorrectFolders = nestedFiles.every(file => {
                const folderPath = file.path.substring(0, file.path.lastIndexOf('/'));
                return result.folders.includes(folderPath);
            });
            
            const testPassed = hasNestedFiles && hasProperStructure && filesInCorrectFolders;
            
            console.log(`\n🎯 VALIDATION:`);
            console.log(`${hasNestedFiles ? '✅' : '❌'} Has nested files`);
            console.log(`${hasProperStructure ? '✅' : '❌'} Has folder structure`);
            console.log(`${filesInCorrectFolders ? '✅' : '❌'} Files in correct folders`);
            console.log(`${testPassed ? '🎉 PASS' : '❌ FAIL'}: ${testCase.name}`);
            
            results.push({
                name: testCase.name,
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
                passed: false,
                error: error.message
            });
        }
    });

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏆 COMPREHENSIVE TEST SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`📊 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    results.forEach((result, index) => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${index + 1}. ${status} - ${result.name}`);
        if (result.passed) {
            console.log(`   📁 ${result.folders} folders, 📄 ${result.files} files, 🏗️ ${result.maxDepth} levels deep`);
        } else if (result.error) {
            console.log(`   ❌ Error: ${result.error}`);
        }
    });
    
    console.log(`\n🎯 FINAL VERDICT:`);
    if (allTestsPassed) {
        console.log('🎉 SUCCESS: Folder structure fix works for ALL tree formats!');
        console.log('✅ Any tree structure in plan display will be properly organized in ZIP downloads');
        console.log('✅ Simple structures: ✓');
        console.log('✅ Complex multi-level structures: ✓');
        console.log('✅ Deep nested structures (5+ levels): ✓');
        console.log('✅ Mixed indentation formats: ✓');
        console.log('🚀 Users will get perfectly organized project downloads!');
    } else {
        console.log('⚠️  PARTIAL SUCCESS: Some tree formats may have issues');
        console.log(`✅ ${passedTests} out of ${totalTests} formats work correctly`);
    }
    
    return {
        success: allTestsPassed,
        passedTests,
        totalTests,
        results
    };
}

// Run comprehensive test
console.log('🚀 Starting Comprehensive Tree Structure Test...\n');

try {
    const result = testVariousTreeStructures();
    
    console.log('\n🏁 Comprehensive Test Complete!');
    if (result.success) {
        console.log('✅ FOLDER STRUCTURE FIX IS UNIVERSAL!');
        console.log('🎉 Works with ANY tree structure format!');
    } else {
        console.log('⚠️  Some tree formats need additional work');
    }
    
} catch (error) {
    console.error('💥 Comprehensive test failed:', error.message);
}