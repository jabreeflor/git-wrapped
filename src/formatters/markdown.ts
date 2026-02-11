import type { WrappedStats } from '../types.js';

const PERSONALITIES = {
  'night-owl': { emoji: '🦉', title: 'Night Owl', description: 'Your best code comes after midnight' },
  'early-bird': { emoji: '🌅', title: 'Early Bird', description: 'You catch the worm (and fix the bugs) at dawn' },
  'weekend-warrior': { emoji: '⚔️', title: 'Weekend Warrior', description: 'Saturdays are for coding, not sleeping in' },
  'nine-to-fiver': { emoji: '💼', title: 'Nine-to-Fiver', description: 'Peak productivity during business hours' },
  'streak-master': { emoji: '🔥', title: 'Streak Master', description: 'Consistency is your superpower' },
  'bug-squasher': { emoji: '🐛', title: 'Bug Squasher', description: "You delete more than you add (and that's a good thing)" },
  'feature-factory': { emoji: '🏭', title: 'Feature Factory', description: "Shipping features like there's no tomorrow" },
  'reviewer': { emoji: '👀', title: 'Code Guardian', description: 'No PR goes unreviewed on your watch' },
  'polyglot': { emoji: '🌍', title: 'Polyglot', description: 'You speak many languages... programming languages' },
  'focused': { emoji: '🎯', title: 'Laser Focused', description: 'One repo, one mission, total dedication' }
};

export function formatMarkdown(stats: WrappedStats): string {
  const lines: string[] = [];
  const personality = PERSONALITIES[stats.personality];

  lines.push(`# 🎁 Git Wrapped ${stats.year}`);
  lines.push('');
  lines.push(`## @${stats.username}'s Year in Review`);
  lines.push('');
  
  // Main stats
  lines.push('### 📊 Overview');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| 💻 Commits | ${formatNumber(stats.totalCommits)} |`);
  lines.push(`| 🔀 Pull Requests | ${formatNumber(stats.totalPRs)} |`);
  lines.push(`| 🐛 Issues | ${formatNumber(stats.totalIssues)} |`);
  lines.push(`| 👀 Reviews | ${formatNumber(stats.totalReviews)} |`);
  lines.push(`| 📁 Repositories | ${stats.repoCount} |`);
  lines.push('');
  
  // Code changes
  lines.push('### 📝 Code Changes');
  lines.push('');
  lines.push(`- **+${formatNumber(stats.totalAdditions)}** lines added`);
  lines.push(`- **-${formatNumber(stats.totalDeletions)}** lines deleted`);
  lines.push('');
  
  const totalChanges = stats.totalAdditions + stats.totalDeletions;
  const addPct = totalChanges > 0 ? Math.round((stats.totalAdditions / totalChanges) * 100) : 50;
  lines.push(`\`\`\`
${createProgressBar(addPct, 50)}
${addPct}% additions | ${100 - addPct}% deletions
\`\`\``);
  lines.push('');
  
  // Streaks
  lines.push('### 🔥 Streaks');
  lines.push('');
  lines.push(`- **Longest streak:** ${stats.longestStreak} days`);
  if (stats.currentStreak > 0) {
    lines.push(`- **Current streak:** ${stats.currentStreak} days`);
  }
  lines.push('');
  
  // Time analysis
  lines.push('### ⏰ When You Code');
  lines.push('');
  lines.push(`- **Most productive day:** ${stats.mostProductiveDay}`);
  lines.push(`- **Peak coding hour:** ${formatHour(stats.mostProductiveHour)}`);
  lines.push('');
  
  // Day distribution
  lines.push('#### Commits by Day');
  lines.push('');
  lines.push('```');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayValues = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const maxDay = Math.max(...dayValues.map(d => stats.commitsByDay[d] || 0));
  for (let i = 0; i < days.length; i++) {
    const count = stats.commitsByDay[dayValues[i]] || 0;
    const bar = createBar(count, maxDay, 30);
    lines.push(`${days[i]} ${bar} ${count}`);
  }
  lines.push('```');
  lines.push('');
  
  // Languages
  lines.push('### 💻 Top Languages');
  lines.push('');
  const languages = Object.entries(stats.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (languages.length > 0) {
    const totalBytes = languages.reduce((sum, [, bytes]) => sum + bytes, 0);
    for (const [lang, bytes] of languages) {
      const pct = Math.round((bytes / totalBytes) * 100);
      lines.push(`- **${lang}** — ${pct}%`);
    }
  } else {
    lines.push('_No language data available_');
  }
  lines.push('');
  
  // Top repos
  lines.push('### 📁 Top Repositories');
  lines.push('');
  const topRepos = stats.repos.sort((a, b) => b.commits - a.commits).slice(0, 5);
  const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
  for (let i = 0; i < topRepos.length; i++) {
    const repo = topRepos[i];
    lines.push(`${medals[i]} **${repo.name}** — ${repo.commits} commits`);
  }
  lines.push('');
  
  // Personality
  lines.push('### 🎭 Developer Personality');
  lines.push('');
  lines.push(`> ${personality.emoji} **${personality.title}**`);
  lines.push(`>`);
  lines.push(`> _${personality.description}_`);
  lines.push('');
  
  // Fun insights
  lines.push('### ✨ Fun Insights');
  lines.push('');
  
  if (stats.biggestDay.commits > 0) {
    const date = new Date(stats.biggestDay.date);
    const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    lines.push(`- 📈 Your most committed day was **${formatted}** with **${stats.biggestDay.commits}** commits!`);
  }
  
  if (stats.biggestDeletion) {
    const date = new Date(stats.biggestDeletion.date);
    const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    lines.push(`- 🧹 You mass-deleted **${formatNumber(stats.biggestDeletion.lines)}** lines on ${formatted} (spring cleaning?)`);
  }
  
  const hourEmoji = stats.mostProductiveHour >= 22 || stats.mostProductiveHour < 4 ? '🦉' :
                    stats.mostProductiveHour >= 5 && stats.mostProductiveHour < 9 ? '🌅' : '☕';
  lines.push(`- ${hourEmoji} Peak coding hour: **${formatHour(stats.mostProductiveHour)}**`);
  
  if (stats.topCollaborator) {
    lines.push(`- 🤝 Most collaborated with: **@${stats.topCollaborator}**`);
  }
  
  if (stats.topLanguage) {
    lines.push(`- 💝 Your top language: **${stats.topLanguage}**`);
  }
  lines.push('');
  
  // Contribution Heatmap
  lines.push('### 📆 Contribution Heatmap');
  lines.push('');
  lines.push('```');
  lines.push(generateAsciiHeatmap(stats));
  lines.push('```');
  lines.push('');
  
  // Year over year comparison
  if (stats.yearComparison && stats.yearComparison.commits.previous > 0) {
    const comp = stats.yearComparison;
    lines.push(`### 📊 ${comp.previousYear} vs ${stats.year}`);
    lines.push('');
    lines.push('| Metric | ' + comp.previousYear + ' | ' + stats.year + ' | Change |');
    lines.push('|--------|------|------|--------|');
    lines.push(`| Commits | ${formatNumber(comp.commits.previous)} | ${formatNumber(comp.commits.current)} | ${formatChange(comp.commits.change)} |`);
    lines.push(`| Pull Requests | ${formatNumber(comp.prs.previous)} | ${formatNumber(comp.prs.current)} | ${formatChange(comp.prs.change)} |`);
    lines.push(`| Repositories | ${comp.repos.previous} | ${comp.repos.current} | ${formatChange(comp.repos.change)} |`);
    lines.push('');
    
    if (comp.commits.change > 20) {
      lines.push(`> 🚀 You coded **${comp.commits.change}%** more in ${stats.year}! Keep crushing it!`);
    } else if (comp.commits.change > 0) {
      lines.push(`> 📈 Steady growth! **${comp.commits.change}%** more commits than last year.`);
    } else if (comp.commits.change < -20) {
      lines.push(`> 🧘 Taking it easier in ${stats.year} — quality over quantity!`);
    }
    lines.push('');
  }
  
  // Fun Facts
  if (stats.funFacts.length > 0) {
    lines.push('### 🎲 Fun Facts');
    lines.push('');
    for (const fact of stats.funFacts) {
      lines.push(`- ${fact.emoji} ${fact.text}`);
    }
    lines.push('');
  }
  
  // Footer
  lines.push('---');
  lines.push('');
  lines.push('_Generated by [git-wrapped](https://github.com/jabreeflor/git-wrapped)_ 🎁');
  
  return lines.join('\n');
}

function generateAsciiHeatmap(stats: import('../types.js').WrappedStats): string {
  const lines: string[] = [];
  const { heatmap } = stats;
  
  const chars = [' ', '░', '▒', '▓', '█'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Month header
  let monthHeader = '     ';
  let currentMonth = -1;
  for (let w = 0; w < Math.min(heatmap.weeks.length, 52); w++) {
    const week = heatmap.weeks[w];
    if (week.days.length > 0) {
      const firstDay = new Date(week.days[0].date);
      if (firstDay.getMonth() !== currentMonth) {
        currentMonth = firstDay.getMonth();
        monthHeader += months[currentMonth].substring(0, 3);
        monthHeader += ' ';
      } else {
        monthHeader += ' ';
      }
    }
  }
  lines.push(monthHeader);
  
  // Days
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let d = 0; d < 7; d++) {
    let row = dayLabels[d] + '  ';
    for (let w = 0; w < Math.min(heatmap.weeks.length, 52); w++) {
      const week = heatmap.weeks[w];
      if (week.days[d]) {
        const day = week.days[d];
        const yearCheck = new Date(day.date).getFullYear();
        row += yearCheck === stats.year ? chars[day.level] : ' ';
      } else {
        row += ' ';
      }
    }
    lines.push(row);
  }
  
  lines.push('');
  lines.push('Less ' + chars.join('') + ' More');
  
  return lines.join('\n');
}

function formatChange(change: number): string {
  if (change > 0) return `+${change}%`;
  if (change < 0) return `${change}%`;
  return '0%';
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function createProgressBar(percentage: number, width: number): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function createBar(value: number, max: number, width: number): string {
  if (max === 0) return '░'.repeat(width);
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}
