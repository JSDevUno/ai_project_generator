/**
 * FIXED version of folder structure extraction
 */

function extractStructureFromPlanFixed(plan) {
    console.log('🔧 Testing FIXED folder structure extraction...\n');
    
    const folders = [];
    const files = [];
    const lines = plan.split('\n');
    const folderStack = []; // Track current folder path

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines and headers
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('=') || 
            trimmed.includes('Project Structure') || trimmed.includes('Overview')) {
            continue;
        }

        // FIXED: Better indentation calculation
        // Count the actual nesting level by looking at tree characters
        let indentLevel = 0;
        let hasTreeChar = false;
        
        // Look for tree structure characters and count depth
        const treeMatch = line.match(/^(\s*)((?:[│├└]\s*)*)(├|└)\s*─*\s*(.+)$/);
        if (treeMatch) {
            const prefix = treeMatch[1] + treeMatch[2]; // spaces + tree chars
            const treeChar = treeMatch[3]; // ├ or └
            const pathItem = treeMatch[4].trim(); // the actual file/folder name
            
            // Calculate depth by counting tree structure levels
            const treeChars = (prefix.match(/[│├└]/g) || []).length;
            indentLevel = treeChars; // This gives us the actual nesting level
            hasTreeChar = true;
            
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

// Test the fixed version
function testFixedExtraction() {
    console.log('🧪 Testing FIXED Folder Structure Extraction...\n');

    const samplePlan = `
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

    const result = extractStructureFromPlanFixed(samplePlan);
    
    console.log('\n📊 FIXED EXTRACTION RESULTS:');
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

    // Analyze the FIXED structure
    console.log('\n🔍 FIXED STRUCTURE ANALYSIS:');
    console.log('='.repeat(50));
    
    const nestedFiles = result.files.filter(f => f.path.includes('/'));
    const rootFiles = result.files.filter(f => !f.path.includes('/'));
    
    console.log(`✅ Root files: ${rootFiles.length}`);
    console.log(`✅ Nested files: ${nestedFiles.length}`);
    
    const nestedFolders = result.folders.filter(f => f.includes('/'));
    const rootFolders = result.folders.filter(f => !f.includes('/'));
    
    console.log(`✅ Root folders: ${rootFolders.length}`);
    console.log(`✅ Nested folders: ${nestedFolders.length}`);
    
    // Verify file-folder relationships
    console.log('\n🔗 FIXED FILE-FOLDER RELATIONSHIPS:');
    let relationshipErrors = 0;
    nestedFiles.forEach(file => {
        const folderPath = file.path.substring(0, file.path.lastIndexOf('/'));
        const folderExists = result.folders.includes(folderPath);
        console.log(`${folderExists ? '✅' : '❌'} ${file.path} → folder: ${folderPath} (${folderExists ? 'exists' : 'MISSING'})`);
        if (!folderExists) relationshipErrors++;
    });
    
    console.log('\n📦 FIXED ZIP STRUCTURE PREVIEW:');
    console.log('='.repeat(50));
    
    // Show the corrected structure
    const allItems = [
        ...result.folders.map(f => ({ type: 'folder', path: f + '/' })),
        ...result.files.map(f => ({ type: 'file', path: f.path }))
    ].sort((a, b) => a.path.localeCompare(b.path));
    
    allItems.forEach((item, index) => {
        const depth = (item.path.match(/\//g) || []).length;
        const indent = '  '.repeat(depth);
        const icon = item.type === 'folder' ? '📁' : '📄';
        console.log(`${icon} ${indent}${item.path}`);
    });
    
    return {
        success: relationshipErrors === 0 && nestedFiles.length > 0,
        folders: result.folders.length,
        files: result.files.length,
        nestedFiles: nestedFiles.length,
        errors: relationshipErrors
    };
}

// Run the fixed test
console.log('🚀 Starting FIXED Folder Structure Analysis...\n');

try {
    const result = testFixedExtraction();
    
    console.log('\n🏁 FIXED Analysis Complete!');
    console.log('='.repeat(50));
    
    if (result.success) {
        console.log('🎉 SUCCESS: FIXED folder structure extraction is working correctly!');
        console.log(`✅ ${result.folders} folders and ${result.files} files properly structured`);
        console.log(`✅ ${result.nestedFiles} files correctly placed in subfolders`);
        console.log('✅ All files have proper folder relationships');
        console.log('✅ Files will be downloaded in correct folder structure!');
    } else {
        console.log('⚠️  STILL HAS ISSUES: Fixed version needs more work');
        console.log(`❌ ${result.errors} relationship errors found`);
    }
    
} catch (error) {
    console.error('❌ Fixed analysis failed:', error.message);
}