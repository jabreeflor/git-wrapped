import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';
import type { WrappedStats, PERSONALITIES } from '../types.js';

const PERSONALITIES_MAP: typeof PERSONALITIES = {
  'night-owl': {
    type: 'night-owl',
    emoji: '🦉',
    title: 'Night Owl',
    description: 'Your best code comes after midnight'
  },
  'early-bird': {
    type: 'early-bird',
    emoji: '🌅',
    title: 'Early Bird',
    description: 'You catch the worm (and fix the bugs) at dawn'
  },
  'weekend-warrior': {
    type: 'weekend-warrior',
    emoji: '⚔️',
    title: 'Weekend Warrior',
    description: 'Saturdays are for coding, not sleeping in'
  },
  'nine-to-fiver': {
    type: 'nine-to-fiver',
    emoji: '💼',
    title: 'Nine-to-Fiver',
    description: 'Peak productivity during business hours'
  },
  'streak-master': {
    type: 'streak-master',
    emoji: '🔥',
    title: 'Streak Master',
    description: 'Consistency is your superpower'
  },
  'bug-squasher': {
    type: 'bug-squasher',
    emoji: '🐛',
    title: 'Bug Squasher',
    description: 'You delete more than you add (and that\'s a good thing)'
  },
  'feature-factory': {
    type: 'feature-factory',
    emoji: '🏭',
    title: 'Feature Factory',
    description: 'Shipping features like there\'s no tomorrow'
  },
  'reviewer': {
    type: 'reviewer',
    emoji: '👀',
    title: 'Code Guardian',
    description: 'No PR goes unreviewed on your watch'
  },
  'polyglot': {
    type: 'polyglot',
    emoji: '🌍',
    title: 'Polyglot',
    description: 'You speak many languages... programming languages'
  },
  'focused': {
    type: 'focused',
    emoji: '🎯',
    title: 'Laser Focused',
    description: 'One repo, one mission, total dedication'
  }
};

export function formatTerminal(stats: WrappedStats): string {
  const lines: string[] = [];
  
  // Header
  const headerGradient = gradient(['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff']);
  lines.push('');
  lines.push(headerGradient(`
   ██████╗ ██╗████████╗    ██╗    ██╗██████╗  █████╗ ██████╗ ██████╗ ███████╗██████╗ 
  ██╔════╝ ██║╚══██╔══╝    ██║    ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
  ██║  ███╗██║   ██║       ██║ █╗ ██║██████╔╝███████║██████╔╝██████╔╝█████╗  ██║  ██║
  ██║   ██║██║   ██║       ██║███╗██║██╔══██╗██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ██║  ██║
  ╚██████╔╝██║   ██║       ╚███╔███╔╝██║  ██║██║  ██║██║     ██║     ███████╗██████╔╝
   ╚═════╝ ╚═╝   ╚═╝        ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═════╝ 
  `));
  
  lines.push('');
  lines.push(chalk.dim(`                           🎁 Your ${stats.year} Year in Review 🎁`));
  lines.push('');
  
  // User info box
  lines.push(boxen(
    chalk.bold.white(`@${stats.username}`) + '\n' +
    chalk.dim(`GitHub Year in Review ${stats.year}`),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'cyan',
      title: '👤 Profile',
      titleAlignment: 'center'
    }
  ));
  
  // Main stats
  const statsBox = boxen(
    formatMainStats(stats),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'green',
      title: '📊 Stats',
      titleAlignment: 'center'
    }
  );
  lines.push(statsBox);
  
  // Code changes
  const codeBox = boxen(
    formatCodeChanges(stats),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'magenta',
      title: '📝 Code Changes',
      titleAlignment: 'center'
    }
  );
  lines.push(codeBox);
  
  // Time analysis
  const timeBox = boxen(
    formatTimeAnalysis(stats),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'yellow',
      title: '⏰ When You Code',
      titleAlignment: 'center'
    }
  );
  lines.push(timeBox);
  
  // Languages
  const langBox = boxen(
    formatLanguages(stats),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'blue',
      title: '💻 Languages',
      titleAlignment: 'center'
    }
  );
  lines.push(langBox);
  
  // Top repos
  const repoBox = boxen(
    formatTopRepos(stats),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'cyan',
      title: '📁 Top Repositories',
      titleAlignment: 'center'
    }
  );
  lines.push(repoBox);
  
  // Personality
  const personality = PERSONALITIES_MAP[stats.personality];
  const personalityBox = boxen(
    `${personality.emoji} ${chalk.bold(personality.title)}\n\n` +
    chalk.italic(personality.description),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 2, right: 2 },
      borderStyle: 'double',
      borderColor: 'magenta',
      title: '🎭 Your Developer Personality',
      titleAlignment: 'center'
    }
  );
  lines.push(personalityBox);
  
  // Fun insights
  const insightsBox = boxen(
    formatInsights(stats),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'yellow',
      title: '✨ Fun Insights',
      titleAlignment: 'center'
    }
  );
  lines.push(insightsBox);
  
  // Footer
  lines.push('');
  lines.push(chalk.dim('  Generated by git-wrapped • github.com/jabreeflor/git-wrapped'));
  lines.push('');
  
  return lines.join('\n');
}

function formatMainStats(stats: WrappedStats): string {
  const lines: string[] = [];
  
  lines.push(`${chalk.green('●')} ${chalk.bold(formatNumber(stats.totalCommits))} commits`);
  lines.push(`${chalk.blue('●')} ${chalk.bold(formatNumber(stats.totalPRs))} pull requests`);
  lines.push(`${chalk.yellow('●')} ${chalk.bold(formatNumber(stats.totalIssues))} issues`);
  lines.push(`${chalk.magenta('●')} ${chalk.bold(formatNumber(stats.totalReviews))} reviews`);
  lines.push(`${chalk.cyan('●')} ${chalk.bold(stats.repoCount)} repositories`);
  
  if (stats.longestStreak > 0) {
    lines.push('');
    lines.push(`🔥 Longest streak: ${chalk.bold(stats.longestStreak)} days`);
    if (stats.currentStreak > 0) {
      lines.push(`   Current streak: ${chalk.bold(stats.currentStreak)} days`);
    }
  }
  
  return lines.join('\n');
}

function formatCodeChanges(stats: WrappedStats): string {
  const lines: string[] = [];
  
  const totalChanges = stats.totalAdditions + stats.totalDeletions;
  const addPct = totalChanges > 0 ? Math.round((stats.totalAdditions / totalChanges) * 100) : 50;
  const delPct = 100 - addPct;
  
  lines.push(`${chalk.green('+')} ${formatNumber(stats.totalAdditions)} lines added`);
  lines.push(`${chalk.red('-')} ${formatNumber(stats.totalDeletions)} lines deleted`);
  lines.push('');
  
  // Visual bar
  const barWidth = 40;
  const addWidth = Math.round((addPct / 100) * barWidth);
  const delWidth = barWidth - addWidth;
  
  lines.push(chalk.green('█'.repeat(addWidth)) + chalk.red('█'.repeat(delWidth)));
  lines.push(chalk.dim(`${addPct}% additions`) + ' '.repeat(barWidth - 20) + chalk.dim(`${delPct}% deletions`));
  
  return lines.join('\n');
}

function formatTimeAnalysis(stats: WrappedStats): string {
  const lines: string[] = [];
  
  lines.push(`📅 Most productive day: ${chalk.bold(stats.mostProductiveDay)}`);
  lines.push(`⏰ Peak coding hour: ${chalk.bold(formatHour(stats.mostProductiveHour))}`);
  lines.push('');
  
  // Hour distribution chart
  lines.push(chalk.dim('Hour distribution:'));
  const maxHour = Math.max(...stats.commitsByHour);
  const hourLabels = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
  
  // Sparkline-style visualization
  const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  let sparkline = '';
  for (let i = 0; i < 24; i++) {
    const normalized = maxHour > 0 ? stats.commitsByHour[i] / maxHour : 0;
    const charIndex = Math.min(Math.floor(normalized * 8), 7);
    const char = sparkChars[charIndex];
    if (i === stats.mostProductiveHour) {
      sparkline += chalk.yellow(char);
    } else if (i >= 22 || i < 6) {
      sparkline += chalk.blue(char);
    } else if (i >= 9 && i < 17) {
      sparkline += chalk.green(char);
    } else {
      sparkline += chalk.cyan(char);
    }
  }
  lines.push(sparkline);
  lines.push(chalk.dim(hourLabels.join('  ')));
  
  return lines.join('\n');
}

function formatLanguages(stats: WrappedStats): string {
  const lines: string[] = [];
  
  const languages = Object.entries(stats.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (languages.length === 0) {
    lines.push(chalk.dim('No language data available'));
    return lines.join('\n');
  }
  
  const total = languages.reduce((sum, [, bytes]) => sum + bytes, 0);
  const colors = ['#f1e05a', '#3572A5', '#2b7489', '#b07219', '#563d7c', '#e34c26'];
  
  for (let i = 0; i < languages.length; i++) {
    const [lang, bytes] = languages[i];
    const pct = Math.round((bytes / total) * 100);
    const barWidth = Math.max(1, Math.round((bytes / total) * 30));
    const color = colors[i % colors.length];
    
    lines.push(
      chalk.hex(color)('█'.repeat(barWidth)) + ' ' +
      chalk.bold(lang) + ' ' +
      chalk.dim(`${pct}%`)
    );
  }
  
  return lines.join('\n');
}

function formatTopRepos(stats: WrappedStats): string {
  const lines: string[] = [];
  
  const topRepos = stats.repos
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 5);
  
  for (let i = 0; i < topRepos.length; i++) {
    const repo = topRepos[i];
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    lines.push(`${medal} ${chalk.bold(repo.name)} ${chalk.dim(`(${repo.commits} commits)`)}`);
  }
  
  return lines.join('\n');
}

function formatInsights(stats: WrappedStats): string {
  const lines: string[] = [];
  
  // Most committed day
  if (stats.biggestDay.commits > 0) {
    const date = new Date(stats.biggestDay.date);
    const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    lines.push(`📈 Your most committed day was ${chalk.bold(formatted)} with ${chalk.bold(stats.biggestDay.commits)} commits!`);
  }
  
  // Biggest deletion
  if (stats.biggestDeletion) {
    const date = new Date(stats.biggestDeletion.date);
    const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    lines.push(`🧹 You mass-deleted ${chalk.bold(formatNumber(stats.biggestDeletion.lines))} lines on ${formatted} (spring cleaning?)`);
  }
  
  // Peak hour insight
  const hourEmoji = stats.mostProductiveHour >= 22 || stats.mostProductiveHour < 4 ? '🦉' :
                    stats.mostProductiveHour >= 5 && stats.mostProductiveHour < 9 ? '🌅' : '☕';
  lines.push(`${hourEmoji} Peak coding hour: ${chalk.bold(formatHour(stats.mostProductiveHour))}`);
  
  // Collaborator
  if (stats.topCollaborator) {
    lines.push(`🤝 Most collaborated with: ${chalk.bold('@' + stats.topCollaborator)}`);
  }
  
  // Top language
  if (stats.topLanguage) {
    lines.push(`💝 Your top language: ${chalk.bold(stats.topLanguage)}`);
  }
  
  return lines.join('\n');
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
