import { Octokit } from '@octokit/rest';
import type { WrappedStats, RepoStats, DayStats, Collaborator, PersonalityType, YearComparison, HeatmapData, HeatmapWeek, FunFact } from '../types.js';

export class GitHubService {
  private octokit: Octokit;
  private username: string;
  private year: number;
  private targetRepo?: string;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN
    });
    this.username = '';
    this.year = new Date().getFullYear();
  }

  async getStats(username?: string, year?: number, repo?: string): Promise<WrappedStats> {
    // Get authenticated user if no username provided
    if (!username) {
      const { data: user } = await this.octokit.users.getAuthenticated();
      this.username = user.login;
    } else {
      this.username = username;
    }

    this.year = year || new Date().getFullYear();
    this.targetRepo = repo;

    const { data: userInfo } = await this.octokit.users.getByUsername({ username: this.username });

    // Fetch all data in parallel where possible
    const [commits, prs, issues, reviews] = await Promise.all([
      this.getCommits(),
      this.getPRs(),
      this.getIssues(),
      this.getReviews()
    ]);

    // Process commits into various stats
    const repoStats = this.processRepoStats(commits);
    const { byDay, byHour } = this.processTimeStats(commits);
    const { longestStreak, currentStreak, streakStart, streakEnd } = this.calculateStreaks(commits);
    const dailyCommits = this.processDailyCommits(commits);
    const collaborators = await this.getCollaborators();
    const languages = await this.getLanguages(repoStats);

    // Find biggest day and biggest deletion
    const biggestDay = this.findBiggestDay(commits);
    const biggestDeletion = this.findBiggestDeletion(commits);

    // Calculate totals
    const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
    const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);

    // Generate heatmap
    const heatmap = this.generateHeatmap(dailyCommits);

    // Generate fun facts
    const funFacts = this.generateFunFacts({
      commits,
      byHour,
      byDay,
      totalCommits: commits.length,
      totalAdditions,
      totalDeletions,
      longestStreak,
      repos: repoStats,
      languages
    });

    // Try to get year comparison (optional)
    let yearComparison: YearComparison | undefined;
    try {
      yearComparison = await this.getYearComparison();
      if (yearComparison) {
        // Fill in current year stats
        yearComparison.commits.current = commits.length;
        yearComparison.commits.change = this.calculateChange(commits.length, yearComparison.commits.previous);
        yearComparison.prs.current = prs.length;
        yearComparison.prs.change = this.calculateChange(prs.length, yearComparison.prs.previous);
        yearComparison.additions.current = totalAdditions;
        yearComparison.additions.change = this.calculateChange(totalAdditions, yearComparison.additions.previous);
        yearComparison.deletions.current = totalDeletions;
        yearComparison.deletions.change = this.calculateChange(totalDeletions, yearComparison.deletions.previous);
        yearComparison.repos.current = repoStats.length;
        yearComparison.repos.change = this.calculateChange(repoStats.length, yearComparison.repos.previous);
        yearComparison.streak.current = longestStreak;
        yearComparison.streak.change = this.calculateChange(longestStreak, yearComparison.streak.previous);
      }
    } catch {
      yearComparison = undefined;
    }

    // Determine personality
    const personality = this.determinePersonality({
      byHour,
      byDay,
      longestStreak,
      totalAdditions,
      totalDeletions,
      reviewCount: reviews.length,
      languageCount: Object.keys(languages).length,
      repoCount: repoStats.length
    });

    // Find most productive times
    const mostProductiveDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Monday';
    const mostProductiveHour = byHour.indexOf(Math.max(...byHour));

    // Find top language
    const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Find most active repo
    const mostActiveRepo = repoStats.sort((a, b) => b.commits - a.commits)[0]?.name || '';

    return {
      username: this.username,
      avatarUrl: userInfo.avatar_url,
      year: this.year,
      
      totalCommits: commits.length,
      totalPRs: prs.length,
      totalIssues: issues.length,
      totalReviews: reviews.length,
      totalAdditions,
      totalDeletions,
      
      repos: repoStats,
      mostActiveRepo,
      repoCount: repoStats.length,
      
      commitsByDay: byDay,
      commitsByHour: byHour,
      mostProductiveDay,
      mostProductiveHour,
      
      longestStreak,
      currentStreak,
      streakStart,
      streakEnd,
      
      languages,
      topLanguage,
      
      collaborators,
      topCollaborator: collaborators[0]?.username,
      
      personality,
      biggestDay,
      biggestDeletion,
      dailyCommits,
      
      // New features
      heatmap,
      funFacts,
      yearComparison
    };
  }

  private async getCommits(): Promise<Array<{
    sha: string;
    message: string;
    date: Date;
    repo: string;
    additions: number;
    deletions: number;
  }>> {
    const startDate = new Date(this.year, 0, 1);
    const endDate = new Date(this.year, 11, 31, 23, 59, 59);
    
    const commits: Array<{
      sha: string;
      message: string;
      date: Date;
      repo: string;
      additions: number;
      deletions: number;
    }> = [];

    // If targeting a specific repo
    if (this.targetRepo) {
      const [owner, repo] = this.targetRepo.split('/');
      const repoCommits = await this.getRepoCommits(owner, repo, startDate, endDate);
      commits.push(...repoCommits);
    } else {
      // Get user's repos
      const repos = await this.octokit.paginate(this.octokit.repos.listForUser, {
        username: this.username,
        per_page: 100,
        type: 'all'
      });

      // Fetch commits from each repo (limit to avoid rate limits)
      const repoPromises = repos.slice(0, 50).map(async (repo) => {
        try {
          return await this.getRepoCommits(repo.owner.login, repo.name, startDate, endDate);
        } catch {
          return [];
        }
      });

      const repoResults = await Promise.all(repoPromises);
      for (const result of repoResults) {
        commits.push(...result);
      }
    }

    return commits;
  }

  private async getRepoCommits(owner: string, repo: string, since: Date, until: Date): Promise<Array<{
    sha: string;
    message: string;
    date: Date;
    repo: string;
    additions: number;
    deletions: number;
  }>> {
    try {
      const commits = await this.octokit.paginate(this.octokit.repos.listCommits, {
        owner,
        repo,
        author: this.username,
        since: since.toISOString(),
        until: until.toISOString(),
        per_page: 100
      });

      // Get detailed stats for each commit (sampling to avoid rate limits)
      const sampleSize = Math.min(commits.length, 100);
      const sampledCommits = commits.slice(0, sampleSize);
      
      const detailed = await Promise.all(
        sampledCommits.map(async (commit) => {
          try {
            const { data } = await this.octokit.repos.getCommit({
              owner,
              repo,
              ref: commit.sha
            });
            return {
              sha: commit.sha,
              message: commit.commit.message,
              date: new Date(commit.commit.author?.date || ''),
              repo: `${owner}/${repo}`,
              additions: data.stats?.additions || 0,
              deletions: data.stats?.deletions || 0
            };
          } catch {
            return {
              sha: commit.sha,
              message: commit.commit.message,
              date: new Date(commit.commit.author?.date || ''),
              repo: `${owner}/${repo}`,
              additions: 0,
              deletions: 0
            };
          }
        })
      );

      // If we sampled, estimate totals for remaining commits
      if (commits.length > sampleSize) {
        const avgAdditions = detailed.reduce((s, c) => s + c.additions, 0) / sampleSize;
        const avgDeletions = detailed.reduce((s, c) => s + c.deletions, 0) / sampleSize;
        
        for (let i = sampleSize; i < commits.length; i++) {
          const commit = commits[i];
          detailed.push({
            sha: commit.sha,
            message: commit.commit.message,
            date: new Date(commit.commit.author?.date || ''),
            repo: `${owner}/${repo}`,
            additions: Math.round(avgAdditions),
            deletions: Math.round(avgDeletions)
          });
        }
      }

      return detailed;
    } catch {
      return [];
    }
  }

  private async getPRs(): Promise<Array<{ number: number; title: string }>> {
    try {
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `author:${this.username} type:pr created:${this.year}-01-01..${this.year}-12-31`,
        per_page: 100
      });
      return data.items.map(item => ({ number: item.number, title: item.title }));
    } catch {
      return [];
    }
  }

  private async getIssues(): Promise<Array<{ number: number; title: string }>> {
    try {
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `author:${this.username} type:issue created:${this.year}-01-01..${this.year}-12-31`,
        per_page: 100
      });
      return data.items.map(item => ({ number: item.number, title: item.title }));
    } catch {
      return [];
    }
  }

  private async getReviews(): Promise<Array<{ id: number }>> {
    // This is an approximation - GitHub's API doesn't have a direct way to get all reviews
    try {
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `reviewed-by:${this.username} type:pr created:${this.year}-01-01..${this.year}-12-31`,
        per_page: 100
      });
      return data.items.map(item => ({ id: item.id }));
    } catch {
      return [];
    }
  }

  private async getCollaborators(): Promise<Collaborator[]> {
    try {
      // Search for PRs where user interacted
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `involves:${this.username} type:pr created:${this.year}-01-01..${this.year}-12-31`,
        per_page: 100
      });

      const collaboratorMap = new Map<string, number>();
      
      for (const item of data.items) {
        const author = item.user?.login;
        if (author && author !== this.username) {
          collaboratorMap.set(author, (collaboratorMap.get(author) || 0) + 1);
        }
      }

      return Array.from(collaboratorMap.entries())
        .map(([username, interactions]) => ({ username, interactions }))
        .sort((a, b) => b.interactions - a.interactions)
        .slice(0, 10);
    } catch {
      return [];
    }
  }

  private async getLanguages(repos: RepoStats[]): Promise<Record<string, number>> {
    const languages: Record<string, number> = {};
    
    // Sample repos to get language data
    const repoNames = [...new Set(repos.map(r => r.name))].slice(0, 20);
    
    await Promise.all(repoNames.map(async (repoName) => {
      try {
        const [owner, repo] = repoName.split('/');
        const { data } = await this.octokit.repos.listLanguages({ owner, repo });
        for (const [lang, bytes] of Object.entries(data)) {
          languages[lang] = (languages[lang] || 0) + bytes;
        }
      } catch {
        // Ignore errors
      }
    }));

    return languages;
  }

  private processRepoStats(commits: Array<{ repo: string; additions: number; deletions: number }>): RepoStats[] {
    const repoMap = new Map<string, RepoStats>();

    for (const commit of commits) {
      const existing = repoMap.get(commit.repo);
      if (existing) {
        existing.commits++;
        existing.additions += commit.additions;
        existing.deletions += commit.deletions;
      } else {
        repoMap.set(commit.repo, {
          name: commit.repo,
          commits: 1,
          additions: commit.additions,
          deletions: commit.deletions,
          languages: {}
        });
      }
    }

    return Array.from(repoMap.values());
  }

  private processTimeStats(commits: Array<{ date: Date }>): {
    byDay: Record<string, number>;
    byHour: number[];
  } {
    const byDay: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0
    };
    const byHour: number[] = new Array(24).fill(0);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const commit of commits) {
      const day = days[commit.date.getDay()];
      byDay[day]++;
      byHour[commit.date.getHours()]++;
    }

    return { byDay, byHour };
  }

  private calculateStreaks(commits: Array<{ date: Date }>): {
    longestStreak: number;
    currentStreak: number;
    streakStart?: string;
    streakEnd?: string;
  } {
    if (commits.length === 0) {
      return { longestStreak: 0, currentStreak: 0 };
    }

    // Get unique days with commits
    const commitDays = new Set<string>();
    for (const commit of commits) {
      commitDays.add(commit.date.toISOString().split('T')[0]);
    }

    const sortedDays = Array.from(commitDays).sort();
    
    let longestStreak = 1;
    let currentStreak = 1;
    let streakStart = sortedDays[0];
    let longestStart = sortedDays[0];
    let longestEnd = sortedDays[0];

    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          longestStart = streakStart;
          longestEnd = sortedDays[i];
        }
      } else {
        currentStreak = 1;
        streakStart = sortedDays[i];
      }
    }

    // Calculate current streak from today
    const today = new Date().toISOString().split('T')[0];
    let activeStreak = 0;
    let checkDate = new Date(today);
    
    while (commitDays.has(checkDate.toISOString().split('T')[0])) {
      activeStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      longestStreak,
      currentStreak: activeStreak,
      streakStart: longestStart,
      streakEnd: longestEnd
    };
  }

  private processDailyCommits(commits: Array<{ date: Date; additions: number; deletions: number }>): DayStats[] {
    const dayMap = new Map<string, DayStats>();

    for (const commit of commits) {
      const date = commit.date.toISOString().split('T')[0];
      const existing = dayMap.get(date);
      if (existing) {
        existing.commits++;
        existing.additions += commit.additions;
        existing.deletions += commit.deletions;
      } else {
        dayMap.set(date, {
          date,
          commits: 1,
          additions: commit.additions,
          deletions: commit.deletions
        });
      }
    }

    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private findBiggestDay(commits: Array<{ date: Date }>): { date: string; commits: number } {
    const dayMap = new Map<string, number>();
    
    for (const commit of commits) {
      const date = commit.date.toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    }

    let biggest = { date: '', commits: 0 };
    for (const [date, count] of dayMap) {
      if (count > biggest.commits) {
        biggest = { date, commits: count };
      }
    }

    return biggest;
  }

  private findBiggestDeletion(commits: Array<{ date: Date; deletions: number }>): { date: string; lines: number } | null {
    const dayMap = new Map<string, number>();
    
    for (const commit of commits) {
      const date = commit.date.toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + commit.deletions);
    }

    let biggest: { date: string; lines: number } | null = null;
    for (const [date, lines] of dayMap) {
      if (lines >= 1000 && (!biggest || lines > biggest.lines)) {
        biggest = { date, lines };
      }
    }

    return biggest;
  }

  private determinePersonality(data: {
    byHour: number[];
    byDay: Record<string, number>;
    longestStreak: number;
    totalAdditions: number;
    totalDeletions: number;
    reviewCount: number;
    languageCount: number;
    repoCount: number;
  }): PersonalityType {
    const { byHour, byDay, longestStreak, totalAdditions, totalDeletions, reviewCount, languageCount, repoCount } = data;
    
    // Night owl: Most commits between 10 PM and 4 AM
    const nightCommits = byHour.slice(22).reduce((a, b) => a + b, 0) + byHour.slice(0, 4).reduce((a, b) => a + b, 0);
    const totalCommits = byHour.reduce((a, b) => a + b, 0);
    
    if (nightCommits > totalCommits * 0.3) return 'night-owl';
    
    // Early bird: Most commits between 5 AM and 9 AM
    const morningCommits = byHour.slice(5, 9).reduce((a, b) => a + b, 0);
    if (morningCommits > totalCommits * 0.3) return 'early-bird';
    
    // Weekend warrior
    const weekendCommits = byDay['Saturday'] + byDay['Sunday'];
    const weekdayCommits = Object.entries(byDay)
      .filter(([day]) => !['Saturday', 'Sunday'].includes(day))
      .reduce((sum, [, count]) => sum + count, 0);
    if (weekendCommits > weekdayCommits * 0.4) return 'weekend-warrior';
    
    // Streak master
    if (longestStreak >= 30) return 'streak-master';
    
    // Bug squasher
    if (totalDeletions > totalAdditions * 0.8) return 'bug-squasher';
    
    // Feature factory
    if (totalAdditions > totalDeletions * 3) return 'feature-factory';
    
    // Reviewer
    if (reviewCount > totalCommits * 0.3) return 'reviewer';
    
    // Polyglot
    if (languageCount >= 5) return 'polyglot';
    
    // Focused
    if (repoCount === 1) return 'focused';
    
    // Nine to fiver (default)
    const workHours = byHour.slice(9, 17).reduce((a, b) => a + b, 0);
    if (workHours > totalCommits * 0.5) return 'nine-to-fiver';
    
    return 'nine-to-fiver';
  }

  private generateHeatmap(dailyCommits: DayStats[]): HeatmapData {
    // Create a map of date -> commits
    const commitMap = new Map<string, number>();
    for (const day of dailyCommits) {
      commitMap.set(day.date, day.commits);
    }

    // Generate all weeks of the year
    const startDate = new Date(this.year, 0, 1);
    const endDate = new Date(this.year, 11, 31);
    
    // Find the first Sunday of or before the year start
    const firstDay = new Date(startDate);
    while (firstDay.getDay() !== 0) {
      firstDay.setDate(firstDay.getDate() - 1);
    }

    const weeks: HeatmapWeek[] = [];
    let currentDate = new Date(firstDay);
    let maxCommits = 0;

    while (currentDate <= endDate || weeks.length < 53) {
      const week: HeatmapWeek = { days: [] };
      
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isInYear = currentDate.getFullYear() === this.year;
        const commits = isInYear ? (commitMap.get(dateStr) || 0) : 0;
        
        if (commits > maxCommits) maxCommits = commits;
        
        week.days.push({
          date: dateStr,
          commits,
          level: 0 // Will be calculated after we know maxCommits
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(week);
      
      if (currentDate > endDate && weeks.length >= 52) break;
    }

    // Calculate levels based on maxCommits
    for (const week of weeks) {
      for (const day of week.days) {
        if (day.commits === 0) {
          day.level = 0;
        } else if (maxCommits > 0) {
          const ratio = day.commits / maxCommits;
          if (ratio <= 0.25) day.level = 1;
          else if (ratio <= 0.5) day.level = 2;
          else if (ratio <= 0.75) day.level = 3;
          else day.level = 4;
        }
      }
    }

    return { weeks, maxCommits };
  }

  private generateFunFacts(data: {
    commits: Array<{ date: Date; message: string; additions: number; deletions: number; repo: string }>;
    byHour: number[];
    byDay: Record<string, number>;
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    longestStreak: number;
    repos: RepoStats[];
    languages: Record<string, number>;
  }): FunFact[] {
    const facts: FunFact[] = [];
    const { commits, byHour, byDay, totalCommits, totalAdditions, totalDeletions, longestStreak, repos, languages } = data;

    // Most productive hour fact
    const peakHour = byHour.indexOf(Math.max(...byHour));
    const peakHourCommits = byHour[peakHour];
    const peakHourPct = totalCommits > 0 ? Math.round((peakHourCommits / totalCommits) * 100) : 0;
    
    if (peakHour >= 0 && peakHour <= 4) {
      facts.push({
        emoji: '🦉',
        text: `Your most productive hour is ${this.formatHour(peakHour)} — the night is young!`,
        category: 'time'
      });
    } else if (peakHour >= 5 && peakHour <= 7) {
      facts.push({
        emoji: '🌅',
        text: `You're an early bird! ${peakHourPct}% of your commits happen at ${this.formatHour(peakHour)}`,
        category: 'time'
      });
    } else if (peakHour >= 22) {
      facts.push({
        emoji: '🌙',
        text: `Late night coder alert! You peak at ${this.formatHour(peakHour)}`,
        category: 'time'
      });
    }

    // Day of week comparison
    const days = Object.entries(byDay).sort((a, b) => b[1] - a[1]);
    const topDay = days[0];
    const bottomDay = days[days.length - 1];
    if (topDay && bottomDay && topDay[1] > 0 && bottomDay[1] > 0) {
      const ratio = topDay[1] / bottomDay[1];
      if (ratio >= 2) {
        facts.push({
          emoji: '📅',
          text: `You commit ${ratio.toFixed(1)}x more on ${topDay[0]}s than ${bottomDay[0]}s`,
          category: 'time'
        });
      }
    }

    // Friday commits
    const fridayCommits = byDay['Friday'] || 0;
    const mondayCommits = byDay['Monday'] || 0;
    if (fridayCommits > mondayCommits * 1.5 && fridayCommits > 5) {
      facts.push({
        emoji: '🎉',
        text: `TGIF! You're ${Math.round((fridayCommits / mondayCommits - 1) * 100)}% more productive on Fridays`,
        category: 'quirky'
      });
    }

    // Weekend warrior check
    const weekendCommits = (byDay['Saturday'] || 0) + (byDay['Sunday'] || 0);
    const weekdayCommits = totalCommits - weekendCommits;
    if (weekendCommits > totalCommits * 0.25) {
      facts.push({
        emoji: '⚔️',
        text: `${Math.round((weekendCommits / totalCommits) * 100)}% of your commits are on weekends — work-life balance who?`,
        category: 'time'
      });
    }

    // Lines per commit
    if (totalCommits > 0) {
      const avgLinesPerCommit = Math.round((totalAdditions + totalDeletions) / totalCommits);
      if (avgLinesPerCommit > 200) {
        facts.push({
          emoji: '📦',
          text: `You average ${avgLinesPerCommit} lines per commit — big commits energy!`,
          category: 'code'
        });
      } else if (avgLinesPerCommit < 20 && totalCommits > 50) {
        facts.push({
          emoji: '✨',
          text: `With ~${avgLinesPerCommit} lines per commit, you're a master of atomic commits`,
          category: 'code'
        });
      }
    }

    // Deletion facts
    if (totalDeletions > totalAdditions) {
      const ratio = totalDeletions / totalAdditions;
      facts.push({
        emoji: '🧹',
        text: `You deleted ${ratio.toFixed(1)}x more code than you added — cleanup crew!`,
        category: 'code'
      });
    }

    // Streak facts
    if (longestStreak >= 30) {
      facts.push({
        emoji: '🔥',
        text: `Your ${longestStreak}-day streak is legendary — that's ${Math.round(longestStreak / 7)} weeks straight!`,
        category: 'quirky'
      });
    } else if (longestStreak >= 14) {
      facts.push({
        emoji: '💪',
        text: `${longestStreak} days of commits in a row — consistency is key!`,
        category: 'quirky'
      });
    }

    // Repo facts
    if (repos.length === 1) {
      facts.push({
        emoji: '🎯',
        text: `100% focus — all commits went to ${repos[0].name.split('/')[1]}`,
        category: 'code'
      });
    } else if (repos.length >= 10) {
      facts.push({
        emoji: '🦑',
        text: `You contributed to ${repos.length} repos — true open source octopus!`,
        category: 'social'
      });
    }

    // Language facts
    const langList = Object.entries(languages).sort((a, b) => b[1] - a[1]);
    if (langList.length >= 5) {
      facts.push({
        emoji: '🌍',
        text: `You coded in ${langList.length} languages — polyglot programmer!`,
        category: 'code'
      });
    }
    
    // Top language dominance
    if (langList.length > 1) {
      const totalLangBytes = langList.reduce((sum, [, bytes]) => sum + bytes, 0);
      const topLangPct = Math.round((langList[0][1] / totalLangBytes) * 100);
      if (topLangPct >= 80) {
        facts.push({
          emoji: '💝',
          text: `${topLangPct}% of your code is ${langList[0][0]} — you've found "the one"`,
          category: 'code'
        });
      }
    }

    // Commit message quirks (sample first 100 commits)
    const sampleCommits = commits.slice(0, 100);
    const wipCount = sampleCommits.filter(c => 
      c.message.toLowerCase().includes('wip') || 
      c.message.toLowerCase().includes('work in progress')
    ).length;
    if (wipCount >= 5) {
      facts.push({
        emoji: '🚧',
        text: `${wipCount} "WIP" commits — shipping in progress!`,
        category: 'quirky'
      });
    }

    const fixCount = sampleCommits.filter(c => 
      c.message.toLowerCase().startsWith('fix')
    ).length;
    if (fixCount >= 10) {
      facts.push({
        emoji: '🔧',
        text: `${Math.round((fixCount / sampleCommits.length) * 100)}% of commits are fixes — debugging champion!`,
        category: 'quirky'
      });
    }

    // Midnight commits
    const midnightCommits = byHour[0] + byHour[23];
    if (midnightCommits >= 5) {
      facts.push({
        emoji: '🕛',
        text: `${midnightCommits} commits around midnight — when inspiration strikes!`,
        category: 'quirky'
      });
    }

    // Average commits per day (active days)
    const activeDays = commits.reduce((set, c) => {
      set.add(c.date.toISOString().split('T')[0]);
      return set;
    }, new Set<string>()).size;
    
    if (activeDays > 0) {
      const avgPerActiveDay = totalCommits / activeDays;
      if (avgPerActiveDay >= 5) {
        facts.push({
          emoji: '⚡',
          text: `You average ${avgPerActiveDay.toFixed(1)} commits per active day — machine mode!`,
          category: 'code'
        });
      }
    }

    // Return top 5-6 most interesting facts
    return facts.slice(0, 6);
  }

  async getYearComparison(): Promise<YearComparison | undefined> {
    const previousYear = this.year - 1;
    
    try {
      // Get previous year stats
      const prevStartDate = new Date(previousYear, 0, 1);
      const prevEndDate = new Date(previousYear, 11, 31, 23, 59, 59);
      
      // Get commits from previous year (simplified - just count)
      let prevCommits = 0;
      let prevAdditions = 0;
      let prevDeletions = 0;
      const prevRepos = new Set<string>();

      if (this.targetRepo) {
        const [owner, repo] = this.targetRepo.split('/');
        try {
          const commits = await this.octokit.paginate(this.octokit.repos.listCommits, {
            owner,
            repo,
            author: this.username,
            since: prevStartDate.toISOString(),
            until: prevEndDate.toISOString(),
            per_page: 100
          });
          prevCommits = commits.length;
          prevRepos.add(this.targetRepo);
        } catch {
          // Repo might not exist in previous year
        }
      } else {
        // Sample a few repos for comparison
        const repos = await this.octokit.paginate(this.octokit.repos.listForUser, {
          username: this.username,
          per_page: 100,
          type: 'all'
        });

        const repoSample = repos.slice(0, 20);
        for (const repo of repoSample) {
          try {
            const commits = await this.octokit.paginate(this.octokit.repos.listCommits, {
              owner: repo.owner.login,
              repo: repo.name,
              author: this.username,
              since: prevStartDate.toISOString(),
              until: prevEndDate.toISOString(),
              per_page: 100
            });
            if (commits.length > 0) {
              prevCommits += commits.length;
              prevRepos.add(`${repo.owner.login}/${repo.name}`);
            }
          } catch {
            // Continue with next repo
          }
        }
      }

      // Get previous year PRs
      let prevPRs = 0;
      try {
        const { data } = await this.octokit.search.issuesAndPullRequests({
          q: `author:${this.username} type:pr created:${previousYear}-01-01..${previousYear}-12-31`,
          per_page: 1
        });
        prevPRs = data.total_count;
      } catch {
        prevPRs = 0;
      }

      // Calculate streak for previous year (simplified)
      let prevStreak = 0;

      return {
        previousYear,
        commits: { 
          current: 0, // Will be filled in later
          previous: prevCommits, 
          change: 0 
        },
        prs: { 
          current: 0, 
          previous: prevPRs, 
          change: 0 
        },
        additions: { 
          current: 0, 
          previous: prevAdditions, 
          change: 0 
        },
        deletions: { 
          current: 0, 
          previous: prevDeletions, 
          change: 0 
        },
        repos: { 
          current: 0, 
          previous: prevRepos.size, 
          change: 0 
        },
        streak: { 
          current: 0, 
          previous: prevStreak, 
          change: 0 
        }
      };
    } catch {
      return undefined;
    }
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }
}
