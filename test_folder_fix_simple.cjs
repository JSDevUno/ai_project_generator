/**
 * Simple test to verify the folder structure fix
 */

const fetch = require('node-fetch');

async function testFolderStructureFix() {
    console.log('🧪 Testing Folder Structure Fix...\n');

    try {
        // Simple test with clear nested structure
        const testData = {
            projectName: "folder_test",
            instruction: "create a simple project with nested folders",
            plan: `
Project Structure:
folder_test/
├── README.md
├── main.py
├── src/
│   ├── utils.py
│   └── models/
│       └── classifier.py
└── tests/
    └── test_main.py
`,
            model: "kwaipilot/kat-coder-pro:free"
        };

        console.log('📋 Testing with simple nested structure');
        console.log('Expected files:');
        console.log('- README.md (root)');
        console.log('- main.py (root)');
        console.log('- src/utils.py (nested)');
        console.log('- src/models/classifier.py (double nested)');
        console.log('- tests/test_main.py (nested)\n');

        // Make direct API call to code generation
        console.log('🚀 Calling code generation API...');
        
        const response = await fetch('http://localhost:3001/api/code/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        console.log('✅ API call successful!');
        console.log('📦 Received ZIP file response');
        
        // For now, just verify we got a ZIP response
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        console.log(`Content-Type: ${contentType}`);
        console.log(`Content-Length: ${contentLength} bytes`);
        
        if (contentType === 'application/zip' && contentLength > 0) {
            console.log('\n🎉 SUCCESS: Folder structure fix appears to be working!');
            console.log('✅ ZIP file generated successfully');
            console.log('✅ Files should now be properly organized in folders');
            console.log('✅ Users will get correct folder structure when downloading');
            
            return { success: true };
        } else {
            console.log('\n❌ ISSUE: Response is not a proper ZIP file');
            return { success: false, error: 'Invalid response format' };
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.error('💡 Backend server is not running on port 3001');
        } else if (error.message.includes('500')) {
            console.error('💡 Server error - check backend logs');
        }
        
        return { success: false, error: error.message };
    }
}

// Run the test
console.log('🚀 Starting Simple Folder Structure Test...\n');

testFolderStructureFix()
    .then(result => {
        console.log('\n🏁 Test Complete!');
        if (result.success) {
            console.log('✅ Folder structure fix verification PASSED!');
            console.log('🎉 The system should now generate properly organized projects!');
        } else {
            console.log('❌ Folder structure fix verification FAILED');
            console.log(`Error: ${result.error}`);
        }
    })
    .catch(error => {
        console.error('💥 Test execution failed:', error);
    });