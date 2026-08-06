# GitHub Setup - Private Team Collaboration

Complete guide to set up GitHub for your team of 4 people (you + 3 teammates).

---

## Step 1: Create Private Repository on GitHub

### 1.1 Go to GitHub
- Visit https://github.com/new
- Login to your account

### 1.2 Create Repository
Fill in these fields:

| Field | Value |
|-------|-------|
| **Repository name** | `placementprep-ml` (or any name) |
| **Description** | ML-Based Resume Analysis & Aptitude Platform |
| **Visibility** | 🔒 **PRIVATE** (Important!) |
| **Initialize** | Add `.gitignore` (Python) |
| **License** | (Optional) |

### 1.3 Create
Click "Create repository" button

---

## Step 2: Add Your Team Members

### 2.1 Go to Repository Settings
- Open your new repository
- Click **"Settings"** tab (top right)
- Click **"Collaborators"** (left sidebar)

### 2.2 Add Each Team Member

**For each of your 3 teammates:**

1. Click **"Add people"** button
2. Enter their GitHub username
3. Select role: **"Maintain"** (they can push/merge)
   - **Admin**: Full control (don't give to everyone)
   - **Maintain**: Can push and merge (use this)
   - **Write**: Can push but not merge
   - **Triage**: Can manage issues
   - **Read**: Read-only (for outsiders)

4. Click "Add [username] to this repository"

### 2.3 Team Members Accept Invitation

Each teammate will:
1. Check their GitHub email inbox
2. Click the invitation link
3. Accept to join the repository

---

## Step 3: Initialize Repository Locally

### On Your Computer

```bash
# Create a new directory or use existing
cd "Minor Project"

# Initialize git
git init

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/placementprep-ml.git

# Configure your identity
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: PlacementPrep project setup"

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 4: Team Members Clone Repository

### Each Teammate Runs

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/placementprep-ml.git
cd placementprep-ml

# Set up environment
python -m venv venv
source venv/bin/activate  # Mac/Linux or venv\Scripts\activate (Windows)
pip install -r requirements.txt
pip install -r ml/requirements.txt

# Test setup
python test_platform.py
```

---

## Step 5: Collaboration Workflow

### Each Team Member: Feature Development

**1. Update Your Local Repository**
```bash
git pull origin main
```

**2. Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

Branch naming examples:
- `feature/add-resume-scoring`
- `feature/improve-aptitude-questions`
- `feature/fix-ml-api`
- `feature/dashboard-redesign`

**3. Make Changes**
- Edit files
- Test your changes
- Run: `python test_platform.py`

**4. Stage Changes**
```bash
# Stage all changes
git add .

# Or stage specific files
git add frontend/src/pages/Dashboard.jsx
git add api/views.py
```

**5. Commit**
```bash
# Good commit messages
git commit -m "Add: Resume score calculation algorithm"
git commit -m "Fix: Aptitude test results not displaying"
git commit -m "Update: Improve NER accuracy"
```

**6. Push to GitHub**
```bash
git push origin feature/your-feature-name
```

**7. Create Pull Request (PR)**
- Go to repository on GitHub
- Click "Compare & pull request"
- Add description of changes
- Click "Create pull request"

**8. Wait for Review**
- Teammates review your code
- They comment or approve
- Address any feedback
- Once approved, merge

**9. Merge & Clean Up**
```bash
# After PR is merged on GitHub
git checkout main
git pull origin main
git branch -d feature/your-feature-name  # Delete local branch
```

---

## Step 6: Branch Protection (Optional but Recommended)

### Require PR Reviews Before Merging

**1. Go to Settings**
- Repository → Settings → Branches

**2. Add Branch Protection Rule**
- Click "Add rule"
- Branch name pattern: `main`
- Check: "Require a pull request before merging"
- Check: "Require approvals" (set to 1)
- Check: "Require code reviews from code owners"

This prevents anyone from pushing directly to `main`.

---

## Git Workflow Diagram

```
Local (Your Computer)          GitHub Repository
═══════════════════════        ═════════════════

main branch (protected)
    ↓
feature/your-feature (local)
    ↓ git push
    ├─→ feature/your-feature (remote) 
    │   ↓ Create PR
    │   ├─→ Pull Request Created
    │   ├─→ Teammates Review
    │   ├─→ Approve
    │   ├─→ Merge to main ✓
    │
git pull ←───← main (updated)
```

---

## Common Git Commands for Team

### Pulling Latest Changes
```bash
# Always do this before starting work
git pull origin main
```

### Checking Status
```bash
# See what you changed
git status

# See commit history
git log

# See your branches
git branch -a
```

### Undoing Mistakes
```bash
# Undo uncommitted changes
git checkout -- filename.txt

# Undo last commit (keep changes)
git reset --soft HEAD~1

# See what changed
git diff
```

### Syncing with Team
```bash
# Your teammate merged something to main
git fetch origin
git pull origin main

# Now you have latest code
```

---

## Example Collaboration Scenario

### Scenario: 4 Team Members Working Simultaneously

**Member 1 - Navneet (You)**
```bash
git checkout -b feature/resume-analysis
# ... code changes ...
git push origin feature/resume-analysis
# Create PR, wait for review
```

**Member 2 - Teammate A**
```bash
git checkout -b feature/aptitude-questions
# ... code changes ...
git push origin feature/aptitude-questions
# Create PR
```

**Member 3 - Teammate B**
```bash
git checkout -b feature/dashboard
# ... code changes ...
git push origin feature/dashboard
# Create PR
```

**Member 4 - Teammate C**
```bash
git checkout -b feature/technical-assessment
# ... code changes ...
git push origin feature/technical-assessment
# Create PR
```

**Review Process**
- Member 1 reviews Member 2's PR → Approves & Merges
- Member 2 reviews Member 3's PR → Approves & Merges
- Member 3 reviews Member 4's PR → Approves & Merges
- Member 4 reviews Member 1's PR → Approves & Merges

**Sync After Merges**
```bash
# Everyone pulls latest main
git checkout main
git pull origin main

# Everyone continues work
git checkout -b feature/next-feature
```

---

## Handling Merge Conflicts

### If Two People Edit Same File

**Conflict markers appear:**
```python
<<<<<<< HEAD (your changes)
def analyze_resume(file):
    return score * 2
=======
def analyze_resume(file):
    return score + 10
>>>>>>> feature/teammate-branch
```

**Resolve by:**
1. Edit file and pick correct version
2. Remove `<<<<`, `====`, `>>>>`
3. Stage & commit
```bash
git add filename.py
git commit -m "Resolve merge conflict in filename.py"
git push origin feature/your-feature
```

---

## GitHub Features for Collaboration

### 1. Issues (Track Tasks)
- Click "Issues" tab
- Create issue for bugs/features
- Assign to teammates
- Use labels: `bug`, `feature`, `help-wanted`

### 2. Pull Requests (Code Review)
- See all team PRs
- Review code
- Comment on specific lines
- Request changes
- Approve & merge

### 3. Projects (Kanban Board)
- Click "Projects" tab
- Create board with columns: To Do, In Progress, Done
- Drag cards (issues) between columns
- Track team progress

### 4. Discussions (Team Chat)
- Click "Discussions" tab
- Ask questions
- Share ideas
- Announce updates

---

## Best Practices for Team

### ✅ Do This

```bash
# Pull before starting work
git pull origin main

# Create descriptive branch names
git checkout -b feature/add-login-system
git checkout -b fix/duplicate-scores-bug

# Write clear commit messages
git commit -m "Add: User authentication with JWT"
git commit -m "Fix: Resume scoring calculation"
git commit -m "Update: Improve error handling"

# Keep commits small and focused
# Don't do everything in one commit

# Push frequently (at least daily)
git push origin feature/your-feature

# Review teammates' code thoroughly
# Ask questions if unclear
```

### ❌ Don't Do This

```bash
# Don't push directly to main
git push origin main  # WRONG!

# Don't commit large unrelated changes
git commit -m "Update everything"  # WRONG!

# Don't use vague messages
git commit -m "stuff"  # WRONG!

# Don't let local changes pile up
# Commit and push regularly

# Don't ignore merge conflicts
# Fix them properly
```

---

## Preventing Accidents

### 1. Ignore Files That Shouldn't Be Pushed

Add to `.gitignore`:
```
venv/
node_modules/
.env
*.pyc
__pycache__/
.DS_Store
db.sqlite3
```

### 2. Use `.gitignore` Template

Already included in your repo, but verify:
```bash
cat .gitignore
```

### 3. Never Commit Secrets

**Never push:**
- `.env` files with API keys
- Database passwords
- Private tokens

**Do push:**
- `.env.example` (template without secrets)
- Code files
- Configuration structures

---

## Quick Reference

### Initial Setup (Only Once)
```bash
git init
git remote add origin <github-url>
git config user.name "Your Name"
git config user.email "your@email.com"
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Daily Workflow
```bash
# Start day
git pull origin main

# Work on feature
git checkout -b feature/name

# Multiple commits while working
git add .
git commit -m "message"
git push origin feature/name

# When done
git push origin feature/name
# Create PR on GitHub
# Wait for approval
# Merge (via GitHub UI)
```

### End of Day
```bash
# Make sure everything is pushed
git status  # Should be "nothing to commit"
git push origin feature/your-feature
```

---

## Team Communication via GitHub

### 1. Use PR Comments for Code Review
```
@teammate "This function could be optimized by using..."
```

### 2. Use Issues for Task Assignment
```
@teammate Can you work on the dashboard redesign?
```

### 3. Use Discussions for Decisions
```
We should consider using Redis for caching.
What do you all think?
```

### 4. Use Project Board for Progress
- Drag issues as team works on them
- Everyone sees status at a glance

---

## Troubleshooting Git Issues

### Can't Push? Wrong Branch
```bash
git branch  # See current branch
# Make sure you're on feature branch, not main
```

### Need to Sync with Main
```bash
# While on your feature branch
git fetch origin
git rebase origin/main
# Resolve any conflicts
git push origin feature/name --force-with-lease
```

### Accidentally Pushed to Main?
```bash
# Revert the last commit
git revert HEAD
git push origin main
```

### Deleted Local Branch Accidentally?
```bash
# Branch still exists on GitHub
git checkout -b feature/name origin/feature/name
```

---

## Security: Keeping .env Safe

### 1. Create `.env.example`
```env
# .env.example (without real keys)
GEMINI_API_KEY=your_gemini_api_key_here
DEBUG=True
SECRET_KEY=your-secret-key
DB_ENGINE=sqlite
```

### 2. Add to `.gitignore`
```
.env
```

### 3. Each Teammate Gets Real `.env`
- Never push real `.env` to GitHub
- Each person creates their own `.env` locally
- Share API keys securely (not via GitHub)

### 4. If Accidentally Pushed
```bash
# Remove from git history
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "Remove .env from tracking"
git push origin main

# Rotate API keys immediately!
```

---

## Monitoring Team Work

### View All Branches
```bash
git branch -a
# Shows all local and remote branches
```

### View Recent Commits
```bash
git log --oneline -10
# Shows last 10 commits
```

### See Who Changed What
```bash
# On GitHub: Click "Blame" on any file
# Shows who made each change
```

---

## GitHub Desktop (Alternative to Command Line)

If your team prefers GUI instead of CLI:

1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with GitHub account
3. Clone repository
4. Make changes in editor
5. Commit in GitHub Desktop UI
6. Push button in GitHub Desktop

---

## Useful GitHub Links

- **Your Repository**: https://github.com/YOUR_USERNAME/placementprep-ml
- **Settings**: /settings
- **Collaborators**: /settings/access
- **Pull Requests**: /pulls
- **Issues**: /issues
- **Projects**: /projects
- **Discussions**: /discussions

---

## Final Checklist

- [ ] Repository created on GitHub (PRIVATE)
- [ ] All 3 teammates added as collaborators
- [ ] Branch protection rule set for main
- [ ] `.gitignore` configured
- [ ] `.env.example` created (without secrets)
- [ ] All teammates cloned repository locally
- [ ] All can run `python test_platform.py`
- [ ] First team member created PR successfully
- [ ] Team reviewed and merged first PR

---

## Quick Help for Teammates

Share this with your 3 teammates:

```markdown
# To Join the Project

1. Accept GitHub invitation email
2. Clone: git clone https://github.com/YOUR_USERNAME/placementprep-ml.git
3. Setup: Follow TEAM_TESTING.md
4. Create branch: git checkout -b feature/your-name
5. Make changes
6. Push: git push origin feature/your-name
7. Create PR on GitHub
8. Wait for approval
9. Merge!

Questions? Check GITHUB_SETUP.md
```

---

## Support

**Git not working?** → Check Git documentation: https://git-scm.com/doc
**GitHub help?** → GitHub docs: https://docs.github.com/
**Team questions?** → Discuss in your group chat

---

**Happy collaborating! 🚀**
