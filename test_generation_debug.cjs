/**
 * Test to debug why code generation isn't working
 */

const https = require('https');
const http = require('http');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const protocol = options.port === 443 ? https : http;
        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function testGenerationAPI() {
    console.log('🧪 Testing Code Generation API...\n');

    try {
        // Test 1: Check if backend is responding
        console.log('1️⃣ Testing backend health...');
        const healthOptions = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/health',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const healthResponse = await makeRequest(healthOptions);
        console.log(`✅ Health check: ${healthResponse.statusCode}`);
        console.log(`Response: ${healthResponse.body.substring(0, 100)}...\n`);

        // Test 2: Try a simple code generation request
        console.log('2️⃣ Testing code generation endpoint...');
        const testData = {
            projectName: "test_simple",
            instruction: "create a simple python hello world project",
            plan: `
Project Structure:
test_simple/
├── README.md
├── main.py
└── requirements.txt

Key Components:
- Simple hello world script
- Basic documentation
- Dependencies file
`,
            model: "kwaipilot/kat-coder-pro:free"
        };

        const genOptions = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/code/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(testData))
            }
        };

        console.log('📡 Sending generation request...');
        console.log(`Project: ${testData.projectName}`);
        console.log(`Files expected: 3 (README.md, main.py, requirements.txt)`);

        const genResponse = await makeRequest(genOptions, JSON.stringify(testData));
        
        console.log(`\n📊 Generation Response:`);
        console.log(`Status: ${genResponse.statusCode}`);
        console.log(`Content-Type: ${genResponse.headers['content-type']}`);
        console.log(`Content-Length: ${genResponse.headers['content-length']}`);

        if (genResponse.statusCode === 200) {
            if (genResponse.headers['content-type'] === 'application/zip') {
                console.log('✅ SUCCESS: Received ZIP file!');
                console.log(`📦 ZIP size: ${genResponse.headers['content-length']} bytes`);
                console.log('🎉 Code generation is working!');
            } else {
                console.log('⚠️  Received response but not a ZIP file');
                console.log(`Response body: ${genResponse.body.substring(0, 200)}...`);
            }
        } else {
            console.log('❌ Generation failed');
            console.log(`Error response: ${genResponse.body}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Backend server is not running or not accessible on port 3002');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('💡 Request timed out - backend might be overloaded');
        }
    }
}

// Run the test
console.log('🚀 Starting Generation Debug Test...\n');

testGenerationAPI()
    .then(() => {
        console.log('\n🏁 Debug test complete!');
    })
    .catch(error => {
        console.error('💥 Debug test failed:', error);
    });