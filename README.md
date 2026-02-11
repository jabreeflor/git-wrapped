# 🎁 git-wrapped

**Your Spotify Wrapped, but for GitHub commits.**

Generate a beautiful "year in review" summary of your GitHub activity — see your commits, streaks, top languages, and discover your developer personality!

![git-wrapped terminal output](screenshots/terminal.png)

## ✨ Features

- 📊 **Complete stats** — Commits, PRs, issues, reviews, and more
- 🔥 **Streak tracking** — Longest streak and current streak
- ⏰ **Time analysis** — When you code (day of week, hour of day)
- 💻 **Language breakdown** — Your most used languages
- 📁 **Top repositories** — Where you spend your time
- 🎭 **Developer personality** — Night Owl? Weekend Warrior? Feature Factory?
- 📆 **Contribution heatmap** — GitHub-style ASCII art calendar showing daily activity
- 📈 **Year-over-year comparison** — "You coded 40% more in 2025!"
- 🎲 **Fun facts** — Quirky insights like "Your most productive hour is 2 AM"

## 📦 Installation

```bash
npm install -g git-wrapped
```

Or run directly with npx:

```bash
npx git-wrapped
```

## 🚀 Usage

```bash
# Your stats for the current year (requires GITHUB_TOKEN)
git-wrapped

# Specific user (public data only)
git-wrapped --user octocat

# Specific year
git-wrapped --year 2024

# Single repo deep-dive
git-wrapped --repo facebook/react

# Different output formats
git-wrapped --format markdown    # Markdown report
git-wrapped --format json        # Raw JSON data
git-wrapped --format html        # Shareable HTML card

# Save to file
git-wrapped --output wrapped.md
git-wrapped --format html --output wrapped.html
```

## 🔑 GitHub Token

For the best experience, set up a GitHub personal access token:

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Create a new token with `repo` and `read:user` scopes
3. Set the environment variable:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Or pass it directly:

```bash
git-wrapped --token ghp_your_token_here
```

## 📸 Sample Output

### Terminal

```
   ██████╗ ██╗████████╗    ██╗    ██╗██████╗  █████╗ ██████╗ ██████╗ ███████╗██████╗ 
  ██╔════╝ ██║╚══██╔══╝    ██║    ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
  ██║  ███╗██║   ██║       ██║ █╗ ██║██████╔╝███████║██████╔╝██████╔╝█████╗  ██║  ██║
  ██║   ██║██║   ██║       ██║███╗██║██╔══██╗██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ██║  ██║
  ╚██████╔╝██║   ██║       ╚███╔███╔╝██║  ██║██║  ██║██║     ██║     ███████╗██████╔╝
   ╚═════╝ ╚═╝   ╚═╝        ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═════╝ 
                           🎁 Your 2025 Year in Review 🎁

╭──────────────────────────────────────────────────────────────╮
│                         📊 Stats                             │
├──────────────────────────────────────────────────────────────┤
│  ● 847 commits                                               │
│  ● 42 pull requests                                          │
│  ● 15 issues                                                 │
│  ● 28 reviews                                                │
│  ● 12 repositories                                           │
│                                                              │
│  🔥 Longest streak: 23 days                                  │
│     Current streak: 5 days                                   │
╰──────────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────╮
│                      📝 Code Changes                         │
├──────────────────────────────────────────────────────────────┤
│  + 125,432 lines added                                       │
│  - 43,218 lines deleted                                      │
│                                                              │
│  ████████████████████████████░░░░░░░░░░                      │
│  74% additions                      26% deletions            │
╰──────────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────╮
│                  🎭 Your Developer Personality               │
╠══════════════════════════════════════════════════════════════╣
│                                                              │
│                    🦉 Night Owl                              │
│                                                              │
│         Your best code comes after midnight                  │
│                                                              │
╰──────────────────────────────────────────────────────────────╯
```

### Contribution Heatmap

See your coding activity throughout the year with a GitHub-style contribution graph:

```
     Jan    Feb    Mar     Apr    May    Jun     Jul    Aug     Sep    Oct    Nov     Dec
Sun   ░▒░░░░▓░░░░░░░░░░░░▒░░░░░░░░░░█░░░░░░░░░░░░░░░░░░░░░
Mon   ░▓░░░░░░░░░░░░░▒░░░░░░░░░░░░░░░░░░░░░░░░░▒░░░░░░░░░░
Tue   ░░░░▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Wed   ░░░░░░░░░░░░░░░░▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Thu   ░░░░░░░░░░▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Fri   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█░░░░░░░░░░░░░░░░░░
Sat   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Less ░▒▓██ More
```

### Year-over-Year Comparison

Compare your progress between years:

```
╭──────────── 📊 2024 vs 2025 ─────────────╮
│                                          │
│  Commits                                 │
│    2024: 523 → 2025: 847  +62%           │
│    ████████████░░░░░░░░                  │
│                                          │
│  Pull Requests                           │
│    2024: 28 → 2025: 42  +50%             │
│                                          │
│  🚀 You coded 62% more in 2025!          │
│     Keep crushing it!                    │
│                                          │
╰──────────────────────────────────────────╯
```

### Fun Facts

Get quirky insights about your coding habits:

```
╭────────────── 🎲 Fun Facts ───────────────╮
│                                           │
│  🦉 Your most productive hour is 2 AM     │
│     — the night is young!                 │
│                                           │
│  📅 You commit 3x more on Fridays         │
│     than Mondays                          │
│                                           │
│  ✨ With ~15 lines per commit, you're     │
│     a master of atomic commits            │
│                                           │
│  ⚔️ 30% of your commits are on weekends   │
│     — work-life balance who?              │
│                                           │
│  🔧 25% of commits are fixes —            │
│     debugging champion!                   │
│                                           │
╰───────────────────────────────────────────╯
```

### HTML Card

The HTML output generates a beautiful, shareable card perfect for Twitter/social media:

![git-wrapped HTML card](screenshots/html-card.png)

## 🎭 Developer Personalities

Based on your coding patterns, you'll be assigned one of these personalities:

| Emoji | Type | Description |
|-------|------|-------------|
| 🦉 | Night Owl | Your best code comes after midnight |
| 🌅 | Early Bird | You catch the worm (and fix the bugs) at dawn |
| ⚔️ | Weekend Warrior | Saturdays are for coding, not sleeping in |
| 💼 | Nine-to-Fiver | Peak productivity during business hours |
| 🔥 | Streak Master | Consistency is your superpower |
| 🐛 | Bug Squasher | You delete more than you add |
| 🏭 | Feature Factory | Shipping features like there's no tomorrow |
| 👀 | Code Guardian | No PR goes unreviewed on your watch |
| 🌍 | Polyglot | You speak many languages... programming languages |
| 🎯 | Laser Focused | One repo, one mission, total dedication |

## 🛠 Development

```bash
# Clone the repo
git clone https://github.com/jabreeflor/git-wrapped.git
cd git-wrapped

# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build
```

## 📄 License

MIT © [jabreeflor](https://github.com/jabreeflor)

---

Made with ❤️ and way too many late-night commits 🦉
