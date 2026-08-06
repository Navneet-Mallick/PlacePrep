# 🚀 START HERE - PlacementPrep

Welcome to the PlacementPrep team! This is your entry point.

---

## What is PlacementPrep?

A platform to help students prepare for placements with:
- 📄 **Resume Analysis** - AI-powered resume feedback
- 📊 **Aptitude Tests** - 565+ questions across 3 sections
- 💻 **Technical Assessment** - Smart answer evaluation
- 📈 **Dashboard** - Performance tracking

---

## 📌 Important: GitHub Setup First!

**Before anything else, set up GitHub for team collaboration:**

👉 **Read: `GITHUB_SETUP.md`**

This covers:
- Creating private repository
- Adding team members
- Git workflow for collaboration
- Best practices for teamwork

**Don't skip this!** Everyone needs access.

---

## 🎯 What to Do Now

### Step 1: GitHub Setup (15 minutes)
- [ ] Read `GITHUB_SETUP.md` completely
- [ ] Create private repository on GitHub
- [ ] Add your 3 teammates as collaborators
- [ ] Share repository link with team

### Step 2: Team Members Clone (5 minutes)
Each teammate:
```bash
git clone https://github.com/YOUR_USERNAME/placementprep-ml.git
cd placementprep-ml
```

### Step 3: Local Setup (10 minutes)
Open **`TEAM_TESTING.md`** and read:
1. Project Overview
2. Installation section

### Step 4: Run Installation (10 minutes)
Follow **Installation** section in TEAM_TESTING.md

### Step 5: Run Servers (2 minutes)
Follow **Running the Project** section (open 3 terminals)

### Step 6: Verify Setup (1 minute)
Run: `python test_platform.py`
- Should show: ✓ ALL TESTS PASSED

### Step 7: Test Features (5 minutes)
- Open http://localhost:5173
- Login with: `admin@localhost.com` / `admin123`
- Try uploading a resume

---

## 📁 Project Structure

```
├── GITHUB_SETUP.md          ← SET UP GITHUB FIRST!
├── TEAM_TESTING.md          ← COMPLETE GUIDE
├── START_HERE.md            ← You are here
├── # ML-Based...md          ← Project specifications
│
├── frontend/                ← React app (Port 5173)
├── api/                     ← Django backend (Port 8001)
├── ml/                      ← FastAPI ML server (Port 8000)
│
├── test_platform.py         ← Run this to verify setup
├── test_gemini.py           ← Test AI recommendations
└── .env                     ← Configuration (keep secret!)
```

---

## 🏃 Quick Commands

```bash
# Clone (after GitHub setup)
git clone <your-repo-url>
cd placementprep-ml

# First time setup
python -m venv venv
source venv/bin/activate  # Mac/Linux or venv\Scripts\activate (Windows)
pip install -r requirements.txt
pip install -r ml/requirements.txt
python -m spacy download en_core_web_sm
python manage.py migrate

# Run servers (open 3 terminals)
python manage.py runserver 8001        # Terminal 1
python ml/api/server.py                 # Terminal 2
cd frontend && npm run dev              # Terminal 3

# Test
python test_platform.py

# Collaborate
git checkout -b feature/your-feature
# ... make changes ...
git commit -m "Add: description"
git push origin feature/your-feature
# Create PR on GitHub
```

---

## 🧪 Features to Test

After setup, try these:

1. **Login** (2 min)
   - Use: admin@localhost.com / admin123
   - Or register new account

2. **Resume Upload** (5 min)
   - Upload a PDF/DOCX resume
   - See analysis with score and role prediction

3. **Aptitude Test** (10 min)
   - Take one section
   - Submit and see results

4. **Technical Assessment** (10 min)
   - Answer a subjective question
   - See auto-generated score

5. **Dashboard** (2 min)
   - View all your results

---

## 👥 Team Collaboration

### Basic Workflow for Everyone

1. **Pull Latest**
   ```bash
   git pull origin main
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes & Test**
   - Edit files
   - Run: `python test_platform.py`

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "Add: description"
   git push origin feature/your-feature-name
   ```

5. **Create PR on GitHub**
   - Go to GitHub.com
   - Click "Create Pull Request"
   - Teammates review

6. **Merge**
   - After approval, click "Merge"
   - Everyone syncs: `git pull origin main`

---

## ❓ Common Questions

**Q: Port 8001 already in use?**
A: Another app is using it. Kill the process or change port:
```bash
python manage.py runserver 8002  # Use different port
```

**Q: How do I collaborate with teammates?**
A: See `GITHUB_SETUP.md` for complete guide

**Q: What if we have merge conflicts?**
A: See "Handling Merge Conflicts" in `GITHUB_SETUP.md`

**Q: Can't push? Wrong branch?**
A: Run `git branch` to see current branch, should be your feature branch

**Q: spaCy model error?**
A: Run: `python -m spacy download en_core_web_sm`

**Q: Frontend not loading?**
A: Check Terminal 3 for errors, then:
```bash
cd frontend
npm cache clean --force
npm install
npm run dev
```

---

## 📖 Full Documentation

- **GITHUB_SETUP.md** - GitHub collaboration guide (READ FIRST!)
- **TEAM_TESTING.md** - Complete technical guide with all sections
- **# ML-Based Resume Analysis & Aptitu.md** - Project specifications

---

## ✅ Checklist Before Coding

- [ ] GitHub repository created (PRIVATE)
- [ ] All 3 teammates added
- [ ] Everyone cloned locally
- [ ] Installation complete
- [ ] All 3 servers running
- [ ] Can login and use features
- [ ] Tests pass: `python test_platform.py`
- [ ] Read TEAM_TESTING.md completely
- [ ] Read GITHUB_SETUP.md for collaboration

---

## 🚀 Ready to Start?

1. **Team Lead (You)**:
   - Follow GITHUB_SETUP.md
   - Create GitHub repo
   - Add teammates

2. **All Team Members**:
   - Accept GitHub invitation
   - Clone repository
   - Follow TEAM_TESTING.md for setup
   - Run test_platform.py
   - Report if setup works

3. **Discuss & Assign**:
   - Decide who works on what
   - Use GitHub Issues to track tasks
   - Follow git workflow

---

## 🆘 Stuck?

1. Check **GITHUB_SETUP.md** (for collaboration issues)
2. Check **TEAM_TESTING.md** section "Troubleshooting"
3. Ask in team chat
4. Check existing issues/solutions

---

## 🎉 Next Steps

**Once everyone is set up:**

1. Explore the codebase together
2. Understand the architecture
3. Divide work among team
4. Each person creates feature branch
5. Make changes and PRs
6. Review each other's code
7. Merge and sync
8. Repeat!

---

**Happy coding! 🚀**

**Start with:** `GITHUB_SETUP.md` → `TEAM_TESTING.md` → Start coding!

