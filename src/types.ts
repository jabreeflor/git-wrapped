export interface GitWrappedOptions {
  user?: string;
  year?: number;
  repo?: string;
  format?: 'terminal' | 'markdown' | 'json' | 'html';
  output?: string;
  token?: string;
}

export interface CommitData {
  sha: string;
  message: string;
  date: Date;
  repo: string;
  additions: number;
  deletions: number;
  author: string;
}

export interface RepoStats {
  name: string;
  commits: number;
  additions: number;
  deletions: number;
  languages: Record<string, number>;
}

export interface DayStats {
  date: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface TimeStats {
  hour: number;
  commits: number;
}

export interface Collaborator {
  username: string;
  interactions: number;
}

export interface YearComparison {
  previousYear: number;
  commits: { current: number; previous: number; change: number };
  prs: { current: number; previous: number; change: number };
  additions: { current: number; previous: number; change: number };
  deletions: { current: number; previous: number; change: number };
  repos: { current: number; previous: number; change: number };
  streak: { current: number; previous: number; change: number };
}

export interface FunFact {
  emoji: string;
  text: string;
  category: 'time' | 'code' | 'social' | 'quirky';
}

export interface HeatmapData {
  weeks: HeatmapWeek[];
  maxCommits: number;
}

export interface HeatmapWeek {
  days: HeatmapDay[];
}

export interface HeatmapDay {
  date: string;
  commits: number;
  level: 0 | 1 | 2 | 3 | 4; // GitHub-style intensity levels
}

export interface WrappedStats {
  // User info
  username: string;
  avatarUrl: string;
  year: number;
  
  // Core stats
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
  totalAdditions: number;
  totalDeletions: number;
  
  // Repo breakdown
  repos: RepoStats[];
  mostActiveRepo: string;
  repoCount: number;
  
  // Time analysis
  commitsByDay: Record<string, number>; // Mon, Tue, etc.
  commitsByHour: number[]; // 0-23
  mostProductiveDay: string;
  mostProductiveHour: number;
  
  // Streaks
  longestStreak: number;
  currentStreak: number;
  streakStart?: string;
  streakEnd?: string;
  
  // Languages
  languages: Record<string, number>;
  topLanguage: string;
  
  // Collaborators
  collaborators: Collaborator[];
  topCollaborator?: string;
  
  // Fun insights
  personality: PersonalityType;
  biggestDay: { date: string; commits: number };
  biggestDeletion: { date: string; lines: number } | null;
  
  // Daily breakdown for calendar
  dailyCommits: DayStats[];
  
  // New features
  yearComparison?: YearComparison;
  heatmap: HeatmapData;
  funFacts: FunFact[];
}

export type PersonalityType = 
  | 'night-owl'      // Most commits late night
  | 'early-bird'     // Most commits early morning
  | 'weekend-warrior' // Lots of weekend commits
  | 'nine-to-fiver'  // Mostly work hours
  | 'streak-master'  // Impressive streaks
  | 'bug-squasher'   // Lots of deletions/fixes
  | 'feature-factory' // Lots of additions
  | 'reviewer'       // Lots of reviews
  | 'polyglot'       // Many languages
  | 'focused';       // One repo mostly

export interface PersonalityInfo {
  type: PersonalityType;
  emoji: string;
  title: string;
  description: string;
}

export const PERSONALITIES: Record<PersonalityType, PersonalityInfo> = {
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
