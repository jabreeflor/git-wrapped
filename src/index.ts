#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { GitHubService } from './services/github.js';
import { formatTerminal, formatMarkdown, formatHtml, formatJson } from './formatters/index.js';
import type { GitWrappedOptions } from './types.js';

const program = new Command();

program
  .name('git-wrapped')
  .description('🎁 Your Spotify Wrapped, but for GitHub commits')
  .version('1.0.0')
  .option('-u, --user <username>', 'GitHub username (default: authenticated user)')
  .option('-y, --year <year>', 'Year to analyze (default: current year)', String(new Date().getFullYear()))
  .option('-r, --repo <owner/repo>', 'Analyze a specific repository')
  .option('-f, --format <format>', 'Output format: terminal, markdown, json, html (default: terminal)', 'terminal')
  .option('-o, --output <file>', 'Save output to file')
  .option('-t, --token <token>', 'GitHub personal access token (or set GITHUB_TOKEN env)')
  .action(async (options: GitWrappedOptions) => {
    const spinner = ora({
      text: 'Fetching your GitHub data...',
      spinner: 'dots12'
    }).start();

    try {
      // Validate token
      const token = options.token || process.env.GITHUB_TOKEN;
      if (!token && !options.user) {
        spinner.fail('No GitHub token found');
        console.log('');
        console.log(chalk.yellow('To use git-wrapped, you need a GitHub personal access token.'));
        console.log('');
        console.log('Options:');
        console.log('  1. Set GITHUB_TOKEN environment variable');
        console.log('  2. Use --token flag: git-wrapped --token ghp_xxxxx');
        console.log('  3. Analyze public user: git-wrapped --user octocat');
        console.log('');
        console.log('Create a token at: https://github.com/settings/tokens');
        console.log('Required scopes: repo, read:user');
        process.exit(1);
      }

      const github = new GitHubService(token);
      
      spinner.text = 'Fetching commits and activity...';
      const stats = await github.getStats(
        options.user,
        options.year ? parseInt(options.year as unknown as string) : undefined,
        options.repo
      );
      
      spinner.succeed(`Found ${stats.totalCommits} commits in ${stats.year}`);

      // Format output
      let output: string;
      const format = options.format || 'terminal';
      
      switch (format) {
        case 'markdown':
          output = formatMarkdown(stats);
          break;
        case 'json':
          output = formatJson(stats);
          break;
        case 'html':
          output = formatHtml(stats);
          break;
        case 'terminal':
        default:
          output = formatTerminal(stats);
      }

      // Save to file or print
      if (options.output) {
        writeFileSync(options.output, output);
        console.log(chalk.green(`✓ Saved to ${options.output}`));
        
        // If HTML, also print helpful message
        if (format === 'html') {
          console.log(chalk.dim(`  Open in browser: open ${options.output}`));
        }
      } else {
        console.log(output);
      }

    } catch (error) {
      spinner.fail('Failed to fetch GitHub data');
      
      if (error instanceof Error) {
        if (error.message.includes('Bad credentials')) {
          console.log(chalk.red('\nInvalid GitHub token. Please check your token and try again.'));
        } else if (error.message.includes('rate limit')) {
          console.log(chalk.red('\nGitHub API rate limit exceeded. Try again later or use a token for higher limits.'));
        } else {
          console.log(chalk.red(`\nError: ${error.message}`));
        }
      }
      
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
