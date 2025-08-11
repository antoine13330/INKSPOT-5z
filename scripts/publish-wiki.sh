#!/usr/bin/env bash
set -e

MSG=${1:-"Update wiki"}

# Resolve repo URL
git_remote_url=$(git remote get-url origin 2>/dev/null || true)
if [ -z "$git_remote_url" ]; then
  echo "No git remote 'origin' found. Initialize git and set remote first." >&2
  exit 1
fi

# Normalize to HTTPS URL for .wiki clone
if [[ "$git_remote_url" == git@* ]]; then
  # SSH → HTTPS (git@github.com:owner/repo.git)
  owner_repo=$(echo "$git_remote_url" | sed -E 's#git@github.com:(.*)\.git#\1#')
  base_url="https://github.com/$owner_repo"
elif [[ "$git_remote_url" == http* ]]; then
  base_url=$(echo "$git_remote_url" | sed -E 's#\.git$##')
else
  echo "Unrecognized remote URL: $git_remote_url" >&2
  exit 1
fi

wiki_url="${base_url}.wiki.git"

echo "Publishing wiki to: $wiki_url"

# Prepare temp dir
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

# Clone wiki
GIT_ASKPASS=echo git clone "$wiki_url" "$tmp_dir/wiki"

# Copy content
rsync -a --delete wiki/ "$tmp_dir/wiki/"

# Commit and push
pushd "$tmp_dir/wiki" >/dev/null
  git add .
  if git diff --cached --quiet; then
    echo "No wiki changes to publish."
  else
    git commit -m "$MSG"
    git push
    echo "Wiki published."
  fi
popd >/dev/null