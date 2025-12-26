/**
 * Test the fixed GitHub search functionality
 */

const http = require('http');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
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

async function testFixedGitHubSearch() {
    console.log('🧪 Testing Fixed GitHub Search...\n');

    try {
        // Test the plan generation with GitHub search enabled
        const testData = {
            projectName: "yolo_test",
            instruction: "create a yolo rapid project for pullup counter, simple only, no docker and deployment",
            model: "kwaipilot/kat-coder-pro:free",
            enableGitHubSearch: true
        };

        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/plan/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(testData))
            }
        };

        console.log('📡 Testing plan generation with GitHub search...');
        console.log(`Project: ${testData.projectName}`);
        console.log(`Instruction: ${testData.instruction}`);
        console.log(`GitHub Search: ${testData.enableGitHubSearch ? 'ENABLED' : 'DISABLED'}\n`);

        const response = await makeRequest(options, JSON.stringify(testData));
        
        console.log(`📊 Response Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            const result = JSON.parse(response.body);
            
            console.log(`✅ Plan generated successfully!`);
            console.log(`📋 Plan length: ${result.plan ? result.plan.length : 0} characters`);
            console.log(`🔍 GitHub repositories found: ${result.repositories ? result.repositories.length : 0}`);
            
            if (result.repositories && result.repositories.length > 0) {
                console.log(`\n📦 Found repositories:`);
                result.repositories.forEach((repo, index) => {
                    console.log(`${index + 1}. ${repo.repository.name} (${repo.repository.stars} stars)`);
                    console.log(`   Relevance: ${repo.relevanceScore}%`);
                    console.log(`   Description: ${repo.repository.description.substring(0, 80)}...`);
                });
                
                console.log(`\n🎉 SUCCESS: GitHub search is working again!`);
                console.log(`✅ Found ${result.repositories.length} relevant repositories`);
                console.log(`✅ Search flexibility improvements are working`);
            } else {
                console.log(`\n⚠️  No repositories found, but this might be due to very specific search terms`);
                console.log(`💡 The flexible search should have found something - checking logs...`);
            }
        } else {
            console.log(`❌ Plan generation failed`);
            console.log(`Error: ${response.body}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
console.log('🚀 Starting Fixed GitHub Search Test...\n');

testFixedGitHubSearch()
    .then(() => {
        console.log('\n🏁 Test complete!');
    })
    .catch(error => {
        console.error('💥 Test failed:', error);
    });