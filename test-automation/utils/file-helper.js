const fs = require('fs');
const path = require('path');

class FileHelper {
    constructor(basePath) {
        this.basePath = basePath;
    }

    createFile(filePath, content) {
        const fullPath = path.join(this.basePath, filePath);
        const dir = path.dirname(fullPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, content);
    }

    createJsonFile(filePath, data) {
        const content = JSON.stringify(data, null, 2);
        this.createFile(filePath, content);
    }

    createSensitiveFiles() {
        // Create various sensitive files for security testing
        const sensitiveFiles = [
            { path: '.env.local', content: 'DATABASE_URL=secret\nAPI_KEY=supersecret123' },
            { path: 'id_rsa', content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...' },
            { path: '.aws/credentials', content: '[default]\naws_access_key_id=AKIAIOSFODNN7EXAMPLE\naws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
            { path: '.bash_history', content: 'ls -la\ncat /etc/passwd\nssh user@server' },
            { path: 'secrets.yaml', content: 'database:\n  password: secret123\napi:\n  key: abcdefghijklmnopqrstuvwxyz' },
            { path: 'token.txt', content: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz' },
            { path: 'password.txt', content: 'mysupersecretpassword123!' },
            { path: 'credentials.json', content: '{"username":"admin","password":"admin123","token":"secret_token_123"}' }
        ];

        sensitiveFiles.forEach(file => {
            this.createFile(file.path, file.content);
        });

        return sensitiveFiles.map(f => f.path);
    }

    createCodeFiles() {
        // Create various code files for testing
        const codeFiles = [
            {
                path: 'src/index.js',
                content: `// Main application file
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(\`Server running on port \${port}\`);
});`
            },
            {
                path: 'src/utils/helper.js',
                content: `// Utility functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}

module.exports = { formatDate, calculateTotal };`
            },
            {
                path: 'README.md',
                content: `# Test Project

This is a test project for Cogit CLI testing.

## Features
- Feature 1
- Feature 2

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\``
            },
            {
                path: 'package.json',
                content: `{
  "name": "test-project",
  "version": "1.0.0",
  "description": "Test project for Cogit CLI",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}`
            }
        ];

        codeFiles.forEach(file => {
            this.createFile(file.path, file.content);
        });

        return codeFiles.map(f => f.path);
    }

    modifyFile(filePath, content) {
        const fullPath = path.join(this.basePath, filePath);
        if (fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, content);
        } else {
            this.createFile(filePath, content);
        }
    }

    appendToFile(filePath, content) {
        const fullPath = path.join(this.basePath, filePath);
        fs.appendFileSync(fullPath, content);
    }

    deleteFile(filePath) {
        const fullPath = path.join(this.basePath, filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }

    fileExists(filePath) {
        const fullPath = path.join(this.basePath, filePath);
        return fs.existsSync(fullPath);
    }

    readFile(filePath) {
        const fullPath = path.join(this.basePath, filePath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath, 'utf8');
        }
        return null;
    }

    getFileSize(filePath) {
        const fullPath = path.join(this.basePath, filePath);
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            return stats.size;
        }
        return 0;
    }

    createTempFile(content) {
        const tempDir = path.join(this.basePath, '.tmp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const fileName = `temp_${Date.now()}.txt`;
        const filePath = path.join('.tmp', fileName);
        this.createFile(filePath, content);
        
        return filePath;
    }

    cleanup() {
        // Clean up temporary files
        const tempDir = path.join(this.basePath, '.tmp');
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}

module.exports = FileHelper;
