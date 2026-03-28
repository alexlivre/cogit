/**
 * Check Connectivity Command
 * Test network connectivity and GitHub access
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { checkConnectivity, getCachedConnectivity, getConnectivityMessage } from '../../services/network/connectivity';
import { getAutoPushStatus } from '../../services/network/auto-push';
import { CONFIG } from '../../config/env';

export const checkConnectivityCommand = new Command('check-connectivity')
  .description('Check network connectivity and GitHub access')
  .option('-f, --force', 'Force fresh connectivity check (ignore cache)')
  .option('-r, --repo <path>', 'Repository path (default: current directory)')
  .action(async (options) => {
    try {
      const repoPath = options.repo || process.cwd();
      
      console.log(chalk.cyan.bold('\n🌐 CONNECTIVITY CHECK'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Check connectivity
      const connectivity = await checkConnectivity(repoPath, { 
        forceCheck: options.force 
      });
      
      console.log(chalk.blue('\n📡 Connectivity Status:'));
      console.log(`   ${getConnectivityMessage(connectivity)}`);
      
      console.log(chalk.blue('\n🔧 Auto Push Configuration:'));
      console.log(`   ${getAutoPushStatus()}`);
      
      console.log(chalk.blue('\n📊 Detailed Status:'));
      console.log(`   Internet: ${connectivity.hasInternet ? '🟢' : '🔴'}`);
      console.log(`   GitHub: ${connectivity.hasGitHubConnection ? '🟢' : '🔴'}`);
      console.log(`   GitHub Repo: ${connectivity.isGitHubRepo ? '🟢' : '🔴'}`);
      console.log(`   Last Checked: ${connectivity.lastChecked.toLocaleString()}`);
      console.log(`   Source: ${connectivity.source === 'cache' ? '📦 Cached' : '🔴 Live'}`);
      
      // Show configuration details
      console.log(chalk.blue('\n⚙️  Configuration:'));
      console.log(`   Auto Push Enabled: ${CONFIG.AUTO_PUSH_ENABLED ? '🟢' : '🔴'}`);
      console.log(`   Branch Auto Push: ${CONFIG.AUTO_PUSH_BRANCHES ? '🟢' : '🔴'}`);
      console.log(`   Tag Auto Push: ${CONFIG.AUTO_PUSH_TAGS ? '🟢' : '🔴'}`);
      console.log(`   Internet Check: ${CONFIG.AUTO_PUSH_INTERNET_CHECK ? '🟢' : '🔴'}`);
      console.log(`   GitHub Only: ${CONFIG.AUTO_PUSH_GITHUB_ONLY ? '🟢' : '🔴'}`);
      console.log(`   Delay: ${CONFIG.AUTO_PUSH_DELAY / 1000}s`);
      console.log(`   Retries: ${CONFIG.AUTO_PUSH_RETRY_COUNT}`);
      console.log(`   Silent Mode: ${CONFIG.AUTO_PUSH_SILENT ? '🟢' : '🔴'}`);
      
      // Recommendations
      console.log(chalk.blue('\n💡 Recommendations:'));
      
      if (!connectivity.hasInternet) {
        console.log(chalk.yellow('   • Check your internet connection'));
        console.log(chalk.yellow('   • Auto push will be disabled until connection is restored'));
      } else if (!connectivity.hasGitHubConnection) {
        console.log(chalk.yellow('   • GitHub is unreachable - check firewall/proxy settings'));
        console.log(chalk.yellow('   • Auto push to GitHub will be disabled'));
      } else if (!connectivity.isGitHubRepo && CONFIG.AUTO_PUSH_GITHUB_ONLY) {
        console.log(chalk.yellow('   • Current repository is not hosted on GitHub'));
        console.log(chalk.yellow('   • Auto push is disabled for non-GitHub repositories'));
        console.log(chalk.yellow('   • Set AUTO_PUSH_GITHUB_ONLY=false to enable for any remote'));
      } else if (connectivity.hasInternet && connectivity.hasGitHubConnection && connectivity.isGitHubRepo) {
        if (CONFIG.AUTO_PUSH_ENABLED) {
          console.log(chalk.green('   • All systems ready! Auto push is enabled and configured'));
        } else {
          console.log(chalk.yellow('   • Connectivity is good, but auto push is disabled'));
          console.log(chalk.yellow('   • Set AUTO_PUSH_ENABLED=true to enable automatic pushing'));
        }
      }
      
      console.log(chalk.green('\n✅ Connectivity check completed\n'));
      
    } catch (error: any) {
      console.log(chalk.red('\n❌ Connectivity check failed:'));
      console.log(chalk.gray(`   ${error.message}\n`));
      console.log(chalk.gray(`   Stack: ${error.stack}\n`));
      process.exit(1);
    }
  });
