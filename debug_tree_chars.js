const testLines = [
    "├── src/",
    "│   ├── main.py",
    "│   └── utils/",
    "│       ├── visualization.py",
    "│       └── config.py"
];

testLines.forEach((line, i) => {
    console.log(`Line ${i}: "${line}"`);
    console.log(`  Length: ${line.length}`);
    console.log(`  Chars: ${line.split('').map(c => `'${c}'(${c.charCodeAt(0)})`).join(' ')}`);
    
    const leadingSpaces = (line.match(/^\s*/) || [''])[0].length;
    console.log(`  Leading spaces: ${leadingSpaces}`);
    
    // Count tree characters
    const treeChars = (line.match(/[│├└]/g) || []).length;
    console.log(`  Tree chars: ${treeChars}`);
    
    // Try to calculate depth by position of the actual content
    const contentMatch = line.match(/^[│├└\s]*([a-zA-Z])/);
    if (contentMatch) {
        const contentStart = line.indexOf(contentMatch[1]);
        const depth = Math.floor(contentStart / 4);
        console.log(`  Content starts at: ${contentStart}, Calculated depth: ${depth}`);
    }
    
    console.log('---');
});