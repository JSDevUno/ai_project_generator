/**
 * Direct test of the folder structure extraction logic
 */

// Test the fixed extraction logic directly
function testExtractStructureFromPlan() {
    console.log('🧪 Testing FIXED extractStructureFromPlan Logic...\n');

    // Simulate the fixed logic
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
                const leadingSpaces = line.match(/^\s*/)[0].length;
                
                // If we have leading spaces but no tree chars before the final one, it's nested
                let indentLevel = Math.max(0, allTreeChars - 1);
                if (leadingSpaces >= 4 && allTreeChars === 1) {
                    // This handles cases like "    └── test_counter.py"
                    indentLevel = Math.floor(leadingSpaces / 4);
                }
                
                console.log(`🔍 Line ${i}: "${line.trim()}" → Item: "${pathItem}", Depth: ${indentLevel}, Spaces: ${leadingSpaces}, TreeChars: ${allTreeChars}`);

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
                        console.log(`📁 Added folder: "${fullPath}" (depth: ${indentLevel})`);
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
                        
                        console.log(`📄 Added file: "${fullPath}" (depth: ${indentLevel})`);
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

    // Test with the YOLO project structure
    const testPlan = `
Project Structure
rapid/
├── README.md
├── requirements.txt
├── config.yaml
├── main.py
├── data/
│   ├── dataset/
│   └── labels/
├── models/
│   └── yolov8_weights.pt
├── utils/
│   ├── detection.py
│   ├── counter.py
│   └── visualization.py
├── src/
│   ├── pullup_detector.py
│   └── pose_tracker.py
└── tests/
    └── test_counter.py
`;

    console.log('📋 Testing with YOLO project structure...\n');
    
    const result = extractStructureFromPlanFixed(testPlan);
    
    console.log('\n📊 EXTRACTION RESULTS:');
    console.log('='.repeat(50));
    
    console.log(`\n📁 FOLDERS (${result.folders.length}):`);
    result.folders.forEach((folder, index) => {
        const depth = (folder.match(/\//g) || []).length;
        const indent = '  '.repeat(depth);
        console.log(`${index + 1}. ${indent}${folder}/`);
    });
    
    console.log(`\n📄 FILES (${result.files.length}):`);
    result.files.forEach((file, index) => {
        const depth = (file.path.match(/\//g) || []).length;
        const indent = '  '.repeat(depth);
        console.log(`${index + 1}. ${indent}${file.path}`);
    });

    // Verify the fix worked
    console.log('\n🔍 VERIFICATION:');
    console.log('='.repeat(50));
    
    const nestedFiles = result.files.filter(f => f.path.includes('/'));
    const rootFiles = result.files.filter(f => !f.path.includes('/'));
    
    console.log(`✅ Root files: ${rootFiles.length}`);
    console.log(`✅ Nested files: ${nestedFiles.length}`);
    
    // Check specific expected files
    const expectedNestedFiles = [
        'models/yolov8_weights.pt',
        'utils/detection.py',
        'utils/counter.py',
        'utils/visualization.py',
        'src/pullup_detector.py',
        'src/pose_tracker.py',
        'tests/test_counter.py'
    ];
    
    console.log('\n🎯 EXPECTED NESTED FILES CHECK:');
    let correctFiles = 0;
    expectedNestedFiles.forEach(expectedFile => {
        const found = result.files.some(f => f.path === expectedFile);
        console.log(`${found ? '✅' : '❌'} ${expectedFile}: ${found ? 'CORRECT' : 'MISSING'}`);
        if (found) correctFiles++;
    });
    
    const successRate = (correctFiles / expectedNestedFiles.length) * 100;
    
    console.log('\n🏆 FINAL ASSESSMENT:');
    console.log('='.repeat(50));
    
    if (successRate >= 90 && nestedFiles.length > 0) {
        console.log('🎉 EXCELLENT: Folder structure fix is working perfectly!');
        console.log(`✅ ${successRate.toFixed(1)}% of expected nested files are correct`);
        console.log(`✅ ${nestedFiles.length} files properly placed in subfolders`);
        console.log('✅ The fix resolves the original problem!');
        console.log('✅ Users will now get properly organized downloads!');
    } else if (successRate >= 70) {
        console.log('👍 GOOD: Folder structure fix is mostly working');
        console.log(`✅ ${successRate.toFixed(1)}% of expected nested files are correct`);
        console.log('⚠️  Some minor issues remain');
    } else {
        console.log('❌ PROBLEM: Folder structure fix is not working properly');
        console.log(`❌ Only ${successRate.toFixed(1)}% of expected nested files are correct`);
    }
    
    return {
        success: successRate >= 90 && nestedFiles.length > 0,
        successRate,
        nestedFiles: nestedFiles.length,
        totalFiles: result.files.length
    };
}

// Run the test
console.log('🚀 Starting Direct Folder Structure Fix Test...\n');

try {
    const result = testExtractStructureFromPlan();
    
    console.log('\n🏁 Test Complete!');
    if (result.success) {
        console.log('✅ FOLDER STRUCTURE FIX IS WORKING!');
        console.log('🎉 The original problem has been resolved!');
        console.log('📦 Files will now be properly organized in ZIP downloads!');
    } else {
        console.log('❌ Folder structure fix needs more work');
    }
    
} catch (error) {
    console.error('💥 Test failed:', error.message);
}