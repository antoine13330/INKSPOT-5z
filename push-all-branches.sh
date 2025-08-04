#!/bin/bash

# Script pour pousser toutes les branches créées
echo "🚀 Pushing all feature and fix branches to GitHub..."

# Liste des branches à pousser
branches=(
    "feature/authentication-enhancement"
    "feature/real-time-messaging"
    "feature/payment-system-enhancement"
    "feature/user-management-enhancement"
    "feature/search-recommendations"
    "feature/admin-dashboard"
    "feature/performance-optimization"
    "fix/test-configuration"
)

# Pousser chaque branche
for branch in "${branches[@]}"; do
    echo "📤 Pushing branch: $branch"
    git checkout "$branch" 2>/dev/null || {
        echo "❌ Branch $branch not found, creating it..."
        git checkout -b "$branch"
    }
    git push -u origin "$branch"
    echo "✅ Pushed $branch"
    echo "---"
done

# Retourner à dev
git checkout dev
echo "✅ All branches pushed successfully!"
echo ""
echo "📋 Summary of branches:"
for branch in "${branches[@]}"; do
    echo "  - $branch"
done
echo ""
echo "🎫 Next step: Run the GitHub issues creation script"
echo "   node create-github-issues.js" 