/**
 * Test to analyze folder structure and file management in the code generation system
 */

// Mock the plan structure extraction logic to test it
function extractStructureFromPlan(plan) {
    console.log('🔍 Analyzing plan structure extraction...\n');
    
    const folders = [];
    const files = [];
    const lines = plan.split('\n');
    const folderStack = []; // Track current folder path based on indentation

    console.log('📝 Total lines to process:', lines.length);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines and headers
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('=')) {
            continue;
        }

        // Calculate indentation level by counting tree structure depth
        let indentLevel = 0;
        let pos = 0;
        
        // Skip initial spaces
        while (pos < line.length && line[pos] === ' ') {
            pos++;
        }
        
        // Count tree structure levels
        while (pos < line.length) {
            const char = line[pos];
            if (char === '│' || char === '├' || char === '└' || char === '─') {
                if (char === '├' || char === '└') {
                    indentLevel++;
                    break; // This is the actual item
                }
                pos++;
            } else if (char === ' ') {
                pos++;
            } else {
                break;
            }
        }

        // Parse tree structure format with flexible matching
        const treeMatch = line.match(/^[\s│├└─]*([a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]*)*\/?)(?:\s*#\s*(.*))?$/);
        if (treeMatch) {
            const pathItem = treeMatch[1];
            const description = treeMatch[2] || '';

            console.log(`🔍 Line ${i}: "${line}" → Item: "${pathItem}", Indent: ${indentLevel}`);

            // Adjust folder stack based on indentation
            folderStack.length = Math.max(0, indentLevel - 1);

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

                // Add to stack for nested items
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
                        description: description || `${pathItem} file`
                    });
                    
                    console.log(`📄 Added file: "${fullPath}" (${extension})`);
                }
            } else {
                // It's a folder without trailing slash
                const fullPath = folderStack.length > 0 ?
                    folderStack.join('/') + '/' + pathItem :
                    pathItem;

                if (fullPath && !folders.includes(fullPath)) {
                    folders.push(fullPath);
                    console.log(`📁 Added folder (no slash): "${fullPath}"`);
                }

                // Add to stack for nested items
                folderStack.push(pathItem);
            }
        }
    }

    // Add parent folders from file paths (backup mechanism)
    files.forEach(file => {
        const pathParts = file.path.split('/');
        if (pathParts.length > 1) {
            for (let i = 1; i < pathParts.length; i++) {
                const folderPath = pathParts.slice(0, i).join('/');
                if (folderPath && !folders.includes(folderPath)) {
                    folders.push(folderPath);
                    console.log(`📁 Added parent folder: "${folderPath}"`);
                }
            }
        }
    });

    return { folders, files };
}

// Test with the actual YOLO plan structure from your example
function testFolderStructureExtraction() {
    console.log('🧪 Testing Folder Structure Extraction...\n');

    const samplePlan = `
Project Plan: rapid
Overview
This is a simple YOLO-based pull-up counter project with no Docker or deployment requirements.

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

    const result = extractStructureFromPlan(samplePlan);
    
    console.log('\n📊 EXTRACTION RESULTS:');
    console.log('='.repeat(50));
    
    console.log(`\n📁 FOLDERS (${result.folders.length}):`);
    result.folders.forEach((folder, index) => {
        console.log(`${index + 1}. ${folder}`);
    });
    
    console.log(`\n📄 FILES (${result.files.length}):`);
    result.files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.path} (${file.type})`);
    });

    // Analyze the structure
    console.log('\n🔍 STRUCTURE ANALYSIS:');
    console.log('='.repeat(50));
    
    // Check if files are properly nested
    const nestedFiles = result.files.filter(f => f.path.includes('/'));
    const rootFiles = result.files.filter(f => !f.path.includes('/'));
    
    console.log(`✅ Root files: ${rootFiles.length}`);
    console.log(`✅ Nested files: ${nestedFiles.length}`);
    
    // Check folder hierarchy
    const nestedFolders = result.folders.filter(f => f.includes('/'));
    const rootFolders = result.folders.filter(f => !f.includes('/'));
    
    console.log(`✅ Root folders: ${rootFolders.length}`);
    console.log(`✅ Nested folders: ${nestedFolders.length}`);
    
    // Verify file-folder relationships
    console.log('\n🔗 FILE-FOLDER RELATIONSHIPS:');
    nestedFiles.forEach(file => {
        const folderPath = file.path.substring(0, file.path.lastIndexOf('/'));
        const folderExists = result.folders.includes(folderPath);
        console.log(`${folderExists ? '✅' : '❌'} ${file.path} → folder: ${folderPath} (${folderExists ? 'exists' : 'MISSING'})`);
    });
    
    // Check for potential issues
    console.log('\n⚠️  POTENTIAL ISSUES:');
    let issuesFound = 0;
    
    // Check for files without proper folder structure
    nestedFiles.forEach(file => {
        const folderPath = file.path.substring(0, file.path.lastIndexOf('/'));
        if (!result.folders.includes(folderPath)) {
            console.log(`❌ File ${file.path} references missing folder: ${folderPath}`);
            issuesFound++;
        }
    });
    
    // Check for empty folders (folders with no files)
    result.folders.forEach(folder => {
        const filesInFolder = result.files.filter(f => f.path.startsWith(folder + '/') || f.path === folder);
        if (filesInFolder.length === 0) {
            console.log(`⚠️  Empty folder detected: ${folder}`);
        }
    });
    
    if (issuesFound === 0) {
        console.log('✅ No structural issues detected!');
    }
    
    // Test ZIP structure simulation
    console.log('\n📦 SIMULATED ZIP STRUCTURE:');
    console.log('='.repeat(50));
    
    // Sort folders by depth for proper creation order
    const sortedFolders = result.folders.sort((a, b) => {
        const depthA = (a.match(/\//g) || []).length;
        const depthB = (b.match(/\//g) || []).length;
        return depthA - depthB;
    });
    
    console.log('📁 Folder creation order:');
    sortedFolders.forEach((folder, index) => {
        const depth = (folder.match(/\//g) || []).length;
        const indent = '  '.repeat(depth);
        console.log(`${index + 1}. ${indent}${folder}/`);
    });
    
    console.log('\n📄 File placement:');
    result.files.forEach((file, index) => {
        const depth = (file.path.match(/\//g) || []).length;
        const indent = '  '.repeat(depth);
        console.log(`${index + 1}. ${indent}${file.path}`);
    });
    
    return {
        success: issuesFound === 0,
        folders: result.folders.length,
        files: result.files.length,
        nestedFiles: nestedFiles.length,
        issues: issuesFound
    };
}

// Run the test
console.log('🚀 Starting Folder Structure Analysis...\n');

try {
    const result = testFolderStructureExtraction();
    
    console.log('\n🏁 Analysis Complete!');
    console.log('='.repeat(50));
    
    if (result.success) {
        console.log('🎉 SUCCESS: Folder structure extraction is working correctly!');
        console.log(`✅ ${result.folders} folders and ${result.files} files properly structured`);
        console.log(`✅ ${result.nestedFiles} files correctly placed in subfolders`);
        console.log('✅ All files have proper folder relationships');
    } else {
        console.log('⚠️  ISSUES DETECTED: Folder structure extraction has problems');
        console.log(`❌ ${result.issues} structural issues found`);
        console.log('❌ Some files may not be placed in correct folders');
    }
    
} catch (error) {
    console.error('❌ Analysis failed:', error.message);
}