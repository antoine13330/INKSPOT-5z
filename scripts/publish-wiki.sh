#!/usr/bin/env bash
set -e

MSG=${1:-"Update wiki"}

# Resolve repo URL
git_remote_url=$(git remote get-url origin 2>/dev/null || true)
if [ -z "$git_remote_url" ]; then
  echo "No git remote 'origin' found. Initialize git and set remote first." >&2
  exit 1
fi

# Extract owner/repo robustly (works for SSH and HTTPS with or without token)
owner_repo=$(echo "$git_remote_url" | sed -E 's#.*github.com/([^/]+/[^/]+)(\.git)?$#\1#' | sed 's/\.git$//')
if [ -z "$owner_repo" ]; then
  echo "Failed to parse owner/repo from origin URL: $git_remote_url" >&2
  exit 1
fi

# Base wiki URL without credentials
wiki_url="https://github.com/${owner_repo}.wiki.git"

# Determine token to use
embedded_token=$(echo "$git_remote_url" | sed -nE 's#https://x-access-token:([^@]+)@github.com/.*#\1#p')
use_token=""
if [ -n "$GITHUB_TOKEN" ]; then
  use_token="$GITHUB_TOKEN"
elif [ -n "$embedded_token" ]; then
  use_token="$embedded_token"
fi

# Construct clone/push URL
if [ -n "$use_token" ]; then
  clone_url="https://x-access-token:${use_token}@github.com/${owner_repo}.wiki.git"
else
  clone_url="$wiki_url"
fi

echo "Publishing wiki to: $wiki_url"

# Prepare temp dir
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

# Clone wiki (use token URL if available)
git clone "$clone_url" "$tmp_dir/wiki"

# Copy content (rsync if available, else cp) - but preserve .git directory
if command -v rsync >/dev/null 2>&1; then
  # Use rsync but exclude .git directory to preserve it
  rsync -a --delete --exclude='.git' wiki/ "$tmp_dir/wiki/"
else
  # Copy everything except .git directory
  find wiki -type f -not -path 'wiki/.git/*' -exec cp --parents {} "$tmp_dir/wiki/" \;
fi

# Commit and push
pushd "$tmp_dir/wiki" >/dev/null
  # Ensure push URL uses token if provided
  if [ -n "$use_token" ]; then
    git remote set-url origin "$clone_url"
  fi
  # Set author identity if missing
  git config user.name >/dev/null 2>&1 || git config user.name "Wiki Publisher"
  git config user.email >/dev/null 2>&1 || git config user.email "wiki@local"
  git add .
  if git diff --cached --quiet; then
    echo "No wiki changes to publish."
  else
    git commit -m "$MSG"
    git push
    echo "Wiki published."
  fi
popd >/dev/null