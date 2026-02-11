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

export function formatHtml(stats: WrappedStats): string {
  const personality = PERSONALITIES[stats.personality];
  const topLanguages = Object.entries(stats.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalBytes = topLanguages.reduce((sum, [, bytes]) => sum + bytes, 0);
  
  const topRepos = stats.repos.sort((a, b) => b.commits - a.commits).slice(0, 3);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Git Wrapped ${stats.year} - @${stats.username}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .card {
      width: 100%;
      max-width: 600px;
      background: rgba(0, 0, 0, 0.85);
      border-radius: 24px;
      padding: 40px;
      color: white;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    
    .header .year {
      font-size: 48px;
      font-weight: 800;
      color: white;
      margin: 10px 0;
    }
    
    .header .username {
      font-size: 18px;
      color: #a0a0a0;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    
    .stat-box {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
    }
    
    .stat-box .number {
      font-size: 32px;
      font-weight: 800;
      color: #48dbfb;
    }
    
    .stat-box .label {
      font-size: 12px;
      text-transform: uppercase;
      color: #a0a0a0;
      margin-top: 4px;
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #feca57;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    
    .code-changes {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-bottom: 16px;
    }
    
    .code-changes .added {
      color: #2ecc71;
      font-size: 24px;
      font-weight: 700;
    }
    
    .code-changes .deleted {
      color: #e74c3c;
      font-size: 24px;
      font-weight: 700;
    }
    
    .progress-bar {
      height: 8px;
      background: #e74c3c;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-bar .fill {
      height: 100%;
      background: #2ecc71;
    }
    
    .language-bars {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .language-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .language-name {
      width: 80px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .language-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .language-fill {
      height: 100%;
      border-radius: 4px;
    }
    
    .language-pct {
      width: 40px;
      text-align: right;
      font-size: 12px;
      color: #a0a0a0;
    }
    
    .personality {
      background: linear-gradient(135deg, rgba(118, 75, 162, 0.3), rgba(102, 126, 234, 0.3));
      border-radius: 16px;
      padding: 24px;
      text-align: center;
    }
    
    .personality .emoji {
      font-size: 48px;
      margin-bottom: 8px;
    }
    
    .personality .title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .personality .description {
      font-size: 14px;
      color: #a0a0a0;
      font-style: italic;
    }
    
    .insights {
      font-size: 14px;
      line-height: 1.8;
    }
    
    .insights span {
      color: #48dbfb;
      font-weight: 600;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 12px;
      color: #666;
    }
    
    .footer a {
      color: #48dbfb;
      text-decoration: none;
    }
    
    .streak-badge {
      display: inline-block;
      background: linear-gradient(135deg, #f093fb, #f5576c);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 8px;
    }

    .top-repos {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .repo-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .repo-medal {
      font-size: 18px;
    }

    .repo-name {
      flex: 1;
      font-weight: 500;
    }

    .repo-commits {
      color: #a0a0a0;
    }

    .heatmap {
      overflow-x: auto;
      padding: 10px 0;
    }

    .heatmap-grid {
      display: flex;
      gap: 2px;
    }

    .heatmap-week {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .heatmap-day {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }

    .heatmap-level-0 { background: rgba(255, 255, 255, 0.1); }
    .heatmap-level-1 { background: #0e4429; }
    .heatmap-level-2 { background: #006d32; }
    .heatmap-level-3 { background: #26a641; }
    .heatmap-level-4 { background: #39d353; }

    .heatmap-legend {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 8px;
      font-size: 10px;
      color: #a0a0a0;
    }

    .heatmap-legend .box {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }

    .comparison {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
    }

    .comparison-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .comparison-label {
      width: 80px;
      font-size: 12px;
      color: #a0a0a0;
    }

    .comparison-old {
      font-size: 14px;
      color: #888;
    }

    .comparison-arrow {
      color: #666;
    }

    .comparison-new {
      font-size: 16px;
      font-weight: 600;
      color: #48dbfb;
    }

    .comparison-change {
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .comparison-change.positive {
      background: rgba(46, 204, 113, 0.2);
      color: #2ecc71;
    }

    .comparison-change.negative {
      background: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
    }

    .comparison-message {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 14px;
      text-align: center;
    }

    .fun-facts {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .fact {
      font-size: 14px;
      line-height: 1.5;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🎁 GIT WRAPPED</h1>
      <div class="year">${stats.year}</div>
      <div class="username">@${stats.username}</div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-box">
        <div class="number">${formatNumber(stats.totalCommits)}</div>
        <div class="label">Commits</div>
      </div>
      <div class="stat-box">
        <div class="number">${formatNumber(stats.totalPRs)}</div>
        <div class="label">Pull Requests</div>
      </div>
      <div class="stat-box">
        <div class="number">${stats.repoCount}</div>
        <div class="label">Repositories</div>
      </div>
      <div class="stat-box">
        <div class="number">${stats.longestStreak}</div>
        <div class="label">Day Streak 🔥</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">📝 Code Changes</div>
      <div class="code-changes">
        <div class="added">+${formatNumber(stats.totalAdditions)}</div>
        <div class="deleted">-${formatNumber(stats.totalDeletions)}</div>
      </div>
      <div class="progress-bar">
        <div class="fill" style="width: ${getAdditionPercentage(stats)}%"></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">💻 Top Languages</div>
      <div class="language-bars">
        ${topLanguages.map(([lang, bytes], i) => {
          const pct = Math.round((bytes / totalBytes) * 100);
          const colors = ['#f1e05a', '#3572A5', '#2b7489', '#b07219', '#563d7c'];
          return `
        <div class="language-row">
          <span class="language-name">${lang}</span>
          <div class="language-bar">
            <div class="language-fill" style="width: ${pct}%; background: ${colors[i % colors.length]}"></div>
          </div>
          <span class="language-pct">${pct}%</span>
        </div>`;
        }).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">📁 Top Repositories</div>
      <div class="top-repos">
        ${topRepos.map((repo, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          return `
        <div class="repo-row">
          <span class="repo-medal">${medals[i]}</span>
          <span class="repo-name">${repo.name}</span>
          <span class="repo-commits">${repo.commits} commits</span>
        </div>`;
        }).join('')}
      </div>
    </div>
    
    <div class="section">
      <div class="personality">
        <div class="emoji">${personality.emoji}</div>
        <div class="title">${personality.title}</div>
        <div class="description">${personality.description}</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">📆 Contribution Heatmap</div>
      <div class="heatmap">
        ${generateHtmlHeatmap(stats)}
      </div>
    </div>

    ${stats.yearComparison && stats.yearComparison.commits.previous > 0 ? `
    <div class="section">
      <div class="section-title">📊 ${stats.yearComparison.previousYear} vs ${stats.year}</div>
      <div class="comparison">
        <div class="comparison-row">
          <span class="comparison-label">Commits</span>
          <span class="comparison-old">${formatNumber(stats.yearComparison.commits.previous)}</span>
          <span class="comparison-arrow">→</span>
          <span class="comparison-new">${formatNumber(stats.yearComparison.commits.current)}</span>
          <span class="comparison-change ${stats.yearComparison.commits.change >= 0 ? 'positive' : 'negative'}">${formatChange(stats.yearComparison.commits.change)}</span>
        </div>
        <div class="comparison-row">
          <span class="comparison-label">PRs</span>
          <span class="comparison-old">${formatNumber(stats.yearComparison.prs.previous)}</span>
          <span class="comparison-arrow">→</span>
          <span class="comparison-new">${formatNumber(stats.yearComparison.prs.current)}</span>
          <span class="comparison-change ${stats.yearComparison.prs.change >= 0 ? 'positive' : 'negative'}">${formatChange(stats.yearComparison.prs.change)}</span>
        </div>
        <div class="comparison-message">
          ${getComparisonMessage(stats.yearComparison.commits.change, stats.year)}
        </div>
      </div>
    </div>
    ` : ''}

    ${stats.funFacts.length > 0 ? `
    <div class="section">
      <div class="section-title">🎲 Fun Facts</div>
      <div class="fun-facts">
        ${stats.funFacts.map(fact => `<div class="fact">${fact.emoji} ${fact.text}</div>`).join('')}
      </div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">✨ Insights</div>
      <div class="insights">
        📅 Most productive day: <span>${stats.mostProductiveDay}</span><br>
        ⏰ Peak coding hour: <span>${formatHour(stats.mostProductiveHour)}</span><br>
        ${stats.topCollaborator ? `🤝 Top collaborator: <span>@${stats.topCollaborator}</span><br>` : ''}
        💝 Top language: <span>${stats.topLanguage}</span>
      </div>
    </div>
    
    <div class="footer">
      Generated by <a href="https://github.com/jabreeflor/git-wrapped">git-wrapped</a> 🎁
    </div>
  </div>
</body>
</html>`;
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

function getAdditionPercentage(stats: WrappedStats): number {
  const total = stats.totalAdditions + stats.totalDeletions;
  if (total === 0) return 50;
  return Math.round((stats.totalAdditions / total) * 100);
}

function generateHtmlHeatmap(stats: WrappedStats): string {
  const { heatmap } = stats;
  
  let html = '<div class="heatmap-grid">';
  
  for (let w = 0; w < Math.min(heatmap.weeks.length, 52); w++) {
    const week = heatmap.weeks[w];
    html += '<div class="heatmap-week">';
    
    for (let d = 0; d < 7; d++) {
      if (week.days[d]) {
        const day = week.days[d];
        const yearCheck = new Date(day.date).getFullYear();
        const level = yearCheck === stats.year ? day.level : 0;
        const title = `${day.date}: ${day.commits} commits`;
        html += `<div class="heatmap-day heatmap-level-${level}" title="${title}"></div>`;
      } else {
        html += '<div class="heatmap-day heatmap-level-0"></div>';
      }
    }
    
    html += '</div>';
  }
  
  html += '</div>';
  
  // Legend
  html += '<div class="heatmap-legend">';
  html += '<span>Less</span>';
  for (let i = 0; i <= 4; i++) {
    html += `<div class="box heatmap-level-${i}"></div>`;
  }
  html += '<span>More</span>';
  html += '</div>';
  
  return html;
}

function formatChange(change: number): string {
  if (change > 0) return `+${change}%`;
  if (change < 0) return `${change}%`;
  return '0%';
}

function getComparisonMessage(change: number, year: number): string {
  if (change > 20) {
    return `🚀 You coded <strong>${change}%</strong> more in ${year}! Keep crushing it!`;
  } else if (change > 0) {
    return `📈 Steady growth! <strong>${change}%</strong> more commits than last year.`;
  } else if (change < -20) {
    return `🧘 Taking it easier in ${year} — quality over quantity!`;
  } else if (change < 0) {
    return `📊 Slightly fewer commits, but every one counts!`;
  }
  return `⚖️ Perfectly balanced, as all things should be.`;
}
