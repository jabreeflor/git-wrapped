import { Octokit } from '@octokit/rest';
import type { WrappedStats, RepoStats, DayStats, Collaborator, PersonalityType } from '../types.js';

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
      dailyCommits
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
}
