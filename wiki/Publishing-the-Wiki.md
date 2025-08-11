# Publish the Wiki

To publish pages in `wiki/` to the GitHub Wiki:

## One-time setup
- Ensure `git remote origin` points to your GitHub repo.
- If using HTTPS, export a token for pushes: `export GITHUB_TOKEN=<gh-personal-access-token>` (repo scope).
- If using SSH, ensure your SSH keys are configured.

## Publish
```bash
./scripts/publish-wiki.sh "Update wiki"
```
The script will:
1. Detect the repo URL and derive the Wiki URL
2. Clone the wiki repository
3. Copy files from `wiki/`
4. Commit and push

## Manual alternative
```bash
git clone https://github.com/<owner>/<repo>.wiki.git
cp -r wiki/* <repo>.wiki/
cd <repo>.wiki && git add . && git commit -m "Update wiki" && git push
```