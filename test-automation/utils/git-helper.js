const { execSync } = require('child_process');

class GitHelper {
    constructor(repoPath) {
        this.repoPath = repoPath;
    }

    exec(command, options = {}) {
        try {
            return execSync(command, { 
                cwd: this.repoPath, 
                encoding: 'utf8',
                ...options 
            });
        } catch (error) {
            throw new Error(`Git command failed: ${command}\nError: ${error.message}`);
        }
    }

    getStatus() {
        try {
            return this.exec('git status --porcelain');
        } catch (error) {
            return '';
        }
    }

    hasChanges() {
        const status = this.getStatus();
        return status.trim().length > 0;
    }

    getStagedFiles() {
        try {
            return this.exec('git diff --name-only --cached')
                .split('\n')
                .filter(f => f.trim());
        } catch (error) {
            return [];
        }
    }

    getUnstagedFiles() {
        try {
            return this.exec('git diff --name-only')
                .split('\n')
                .filter(f => f.trim());
        } catch (error) {
            return [];
        }
    }

    getDiff() {
        try {
            return this.exec('git diff HEAD');
        } catch (error) {
            return '';
        }
    }

    addAll() {
        this.exec('git add -A');
    }

    commit(message) {
        this.exec(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    }

    push() {
        this.exec('git push');
    }

    getLastCommit() {
        try {
            return this.exec('git log -1 --pretty=format:"%H|%s|%an|%ad" --date=iso')
                .trim();
        } catch (error) {
            return null;
        }
    }

    getCommitHistory(limit = 5) {
        try {
            return this.exec(`git log -${limit} --pretty=format:"%H|%s|%an|%ad" --date=iso`)
                .trim()
                .split('\n')
                .filter(line => line.trim());
        } catch (error) {
            return [];
        }
    }

    resetHard() {
        this.exec('git reset --hard HEAD');
    }

    clean() {
        this.exec('git clean -fd');
    }

    createFile(filePath, content) {
        const fullPath = require('path').join(this.repoPath, filePath);
        const dir = require('path').dirname(fullPath);
        
        // Create directory if it doesn't exist
        if (!require('fs').existsSync(dir)) {
            require('fs').mkdirSync(dir, { recursive: true });
        }
        
        require('fs').writeFileSync(fullPath, content);
    }

    deleteFile(filePath) {
        const fullPath = require('path').join(this.repoPath, filePath);
        if (require('fs').existsSync(fullPath)) {
            require('fs').unlinkSync(fullPath);
        }
    }

    getCurrentBranch() {
        try {
            return this.exec('git rev-parse --abbrev-ref HEAD').trim();
        } catch (error) {
            return 'unknown';
        }
    }

    getRemoteUrl() {
        try {
            return this.exec('git remote get-url origin').trim();
        } catch (error) {
            return null;
        }
    }
}

module.exports = GitHelper;
