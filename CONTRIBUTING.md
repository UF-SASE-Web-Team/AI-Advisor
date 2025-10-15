# Git Guide

This is just a small guide on Git and how we will ideally use it for our semester project

---

## Branching Model

* `main`: always deployable. Protected. Merge via PR only.
* `feature/<area>-<short-desc>`: contributor feature branches.
* `bug/<issue>`: issues for bugs that pops up.

**Examples**

```
feature/auth-oauth-google
feature/db-supabase-migrations
bug/google-auth-invalid
```

---

## Environment Files and Secrets

* Copy `.env.example` to a local env file (`.env`) and fill values
* Never commit secrets. `.env*` is ignored by `.gitignore`
* Typically we will store sensitive info like API keys and passwords in here
---

## Developer Workflow

### Starting a task
```bash
# 1) Start from fresh main
git switch main
git pull --ff-only

# 2) Branch for your work
git switch -c feature/auth-google

# 3) Do work, commit as you go
git add .
git commit -m "feat(auth): add Google OAuth callback"

# ... more work ...
git add .
git commit -m "feat(auth): finalize user session flow"

# 4) Sync with latest remote main
git fetch origin
git rebase origin/main

# If this branch was already pushed before you rebased:
# git push --force-with-lease

# 5) Push your branch (first push sets upstream)
git push -u origin feature/auth-google

# 6) Open a PR targeting main
```
### After PR is merged
```bash
# Update local main to your merged work
git switch main
git pull --ff-only

# cleanup
git branch -d feature/auth-google
git push origin --delete feature/auth-google
```
---

## Conventional Commits (Commit Message Format)

```
feat(auth): add Google OAuth callback
fix(db): correct RLS for profiles table
docs(readme): add onboarding steps
```

---

## Common Issues and How to Resolve Them

### 1) Cannot push to main

```bash
git push -u origin feature/<area>-<desc>
```

### 2) Merge conflict

```bash
git fetch origin
git rebase origin/main
# Fix conflicts manually
git add <file>
git rebase --continue
# If this branch was already pushed before you rebased:
# git push --force-with-lease
```

### 3) Wrong branch commit
Option A (last commit only):
```bash
# Get the commit SHA you want to move
git log -1 --oneline

# Move it onto the correct branch
git switch correct-branch
git cherry-pick <commit-sha>
```

Option B (you commited on main by mistake):
```bash
# Create a feature branch at your current commit
git switch -c correct-branch

# Restore local main to match the remote
git switch main
git fetch origin
git reset --hard origin/main

# Go back to your feature branch and publish it
git switch correct-branch
git push -u origin docs/contribution
```

### 4) Accidental secret committed

* Delete the file, rotate the secret, and remove from history:

```bash
git filter-repo --path .env --invert-paths
git push --force-with-lease
```

### 5) Undo last commit
```bash
git reset --soft HEAD~1
# or 
git reset -hard HEAD~1
```

---
## Tips
### 1) Commit often!
### 2) I want latest changes but I don't want work committed yet
Option A) just keep coding without sync (ok if you won't push yet)
Option B) stash -> sync -> reapply
```bash
git stash -u
git switch main
git pull --ff-only
git switch feature/<area>
git fetch origin
git rebase origin/main
git stash pop
```

### 3) ALWAYS do this before opening or updating a PR
```bash
git fetch origin
git rebase origin/main
```
then if you had pushed before
```bash
git push --force-with-lease
```

### 4) I am working on two machines
Before you stop work on machine A
```bash
git push -u origin feature/<area>
```

On machine B:
```bash
git fetch origin
git switch -t origin/feature/<area>
```

## Other resources
* [Dangit, Git!](https://dangitgit.com/)
* [How To Write Unmaintainable Code](https://cs.fit.edu/~kgallagher/Schtick/How%20To%20Write%20Unmaintainable%20Code.html)
