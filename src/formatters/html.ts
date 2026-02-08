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
