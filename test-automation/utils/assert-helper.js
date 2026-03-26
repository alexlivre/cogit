class AssertHelper {
    static assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    static assertContains(actual, expected, message) {
        if (!actual.includes(expected)) {
            throw new Error(`Assertion failed: ${message}\nExpected: "${expected}" to be in: "${actual}"`);
        }
    }

    static assertNotContains(actual, unexpected, message) {
        if (actual.includes(unexpected)) {
            throw new Error(`Assertion failed: ${message}\nDid not expect: "${unexpected}" to be in: "${actual}"`);
        }
    }

    static assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${message}\nExpected: "${expected}"\nActual: "${actual}"`);
        }
    }

    static assertMatches(actual, pattern, message) {
        if (!pattern.test(actual)) {
            throw new Error(`Assertion failed: ${message}\nExpected pattern: ${pattern}\nActual: "${actual}"`);
        }
    }

    static assertArrayContains(array, item, message) {
        if (!array.includes(item)) {
            throw new Error(`Assertion failed: ${message}\nArray: [${array.join(', ')}]\nExpected to contain: "${item}"`);
        }
    }

    static assertArrayNotContains(array, item, message) {
        if (array.includes(item)) {
            throw new Error(`Assertion failed: ${message}\nArray: [${array.join(', ')}]\nDid not expect to contain: "${item}"`);
        }
    }

    static assertFileExists(filePath, message) {
        const fs = require('fs');
        if (!fs.existsSync(filePath)) {
            throw new Error(`Assertion failed: ${message}\nFile does not exist: ${filePath}`);
        }
    }

    static assertFileNotExists(filePath, message) {
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
            throw new Error(`Assertion failed: ${message}\nFile should not exist: ${filePath}`);
        }
    }

    static assertConventionalCommitFormat(message, messagePrefix = '') {
        const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|update)(\(.+\))?: .{1,50}/;
        
        if (!conventionalCommitPattern.test(message)) {
            throw new Error(`${messagePrefix}Invalid conventional commit format: "${message}"\nExpected format: <type>(<scope>): <description> (max 50 chars)`);
        }
    }

    static assertCommitMessageLength(message, maxLength = 50, messagePrefix = '') {
        const lines = message.split('\n');
        const title = lines[0];
        
        if (title.length > maxLength) {
            throw new Error(`${messagePrefix}Commit message title too long: ${title.length} chars (max: ${maxLength})\nTitle: "${title}"`);
        }
    }

    static assertSecurityBlocklist(files, messagePrefix = '') {
        const blockedPatterns = [
            '.env', '.env.local', 'id_rsa', '.aws/', '.kube/', 
            '.bash_history', 'secrets.yaml', 'token.txt', 'password.txt'
        ];
        
        const blockedFiles = files.filter(file => 
            blockedPatterns.some(pattern => file.includes(pattern))
        );
        
        if (blockedFiles.length > 0) {
            throw new Error(`${messagePrefix}Security check failed: Blocked files detected: ${blockedFiles.join(', ')}`);
        }
    }

    static assertNoSecretsInDiff(diff, messagePrefix = '') {
        const secretPatterns = [
            /password\s*[=:]\s*\S+/i,
            /api[_-]?key\s*[=:]\s*\S+/i,
            /token\s*[=:]\s*\S+/i,
            /secret\s*[=:]\s*\S+/i,
            /AKIA[0-9A-Z]{16}/g
        ];
        
        const foundSecrets = [];
        
        for (const pattern of secretPatterns) {
            const matches = diff.match(pattern);
            if (matches) {
                foundSecrets.push(...matches);
            }
        }
        
        if (foundSecrets.length > 0) {
            throw new Error(`${messagePrefix}Secrets detected in diff: ${foundSecrets.join(', ')}`);
        }
    }

    static assertGitOperationSuccess(output, operation, messagePrefix = '') {
        const failurePatterns = [
            /error:/i,
            /fatal:/i,
            /failed/i,
            /denied/i,
            /permission denied/i
        ];
        
        const hasFailure = failurePatterns.some(pattern => pattern.test(output));
        
        if (hasFailure) {
            throw new Error(`${messagePrefix}Git operation failed: ${operation}\nOutput: ${output}`);
        }
    }

    static assertI18nMessage(output, language, messagePrefix = '') {
        const i18nPatterns = {
            'pt': [/gerando/i, /processando/i, /sucesso/i, /cancelar/i],
            'en': [/generating/i, /processing/i, /success/i, /cancel/i]
        };
        
        const patterns = i18nPatterns[language] || i18nPatterns['en'];
        const hasLanguageSpecificMessages = patterns.some(pattern => pattern.test(output));
        
        if (!hasLanguageSpecificMessages) {
            throw new Error(`${messagePrefix}Expected ${language} language messages not found in output`);
        }
    }

    static assertPerformance(duration, maxDuration, operation, messagePrefix = '') {
        if (duration > maxDuration) {
            throw new Error(`${messagePrefix}Performance test failed: ${operation} took ${duration}ms (max: ${maxDuration}ms)`);
        }
    }

    static assertCommandExists(command, messagePrefix = '') {
        const { execSync } = require('child_process');
        try {
            execSync(`which ${command}`, { stdio: 'ignore' });
        } catch (error) {
            throw new Error(`${messagePrefix}Command not found: ${command}`);
        }
    }

    static assertEnvironmentVariable(varName, messagePrefix = '') {
        if (!process.env[varName]) {
            throw new Error(`${messagePrefix}Environment variable not set: ${varName}`);
        }
    }

    static assertJsonStructure(json, expectedStructure, messagePrefix = '') {
        const obj = typeof json === 'string' ? JSON.parse(json) : json;
        
        for (const [key, expectedType] of Object.entries(expectedStructure)) {
            if (!(key in obj)) {
                throw new Error(`${messagePrefix}Missing required key: ${key}`);
            }
            
            const actualType = Array.isArray(obj[key]) ? 'array' : typeof obj[key];
            if (actualType !== expectedType) {
                throw new Error(`${messagePrefix}Invalid type for key ${key}: expected ${expectedType}, got ${actualType}`);
            }
        }
    }
}

module.exports = AssertHelper;
