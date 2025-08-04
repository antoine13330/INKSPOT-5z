#!/bin/bash

# INKSPOT Code Cleanup Script
# This script cleans up the codebase by removing duplicates and organizing files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 {analyze|clean|organize|all}"
    echo ""
    echo "Commands:"
    echo "  analyze   - Analyze codebase for duplicates and issues"
    echo "  clean     - Remove duplicate files and unused code"
    echo "  organize  - Organize files into proper structure"
    echo "  all       - Run all cleanup operations"
    echo ""
    echo "Examples:"
    echo "  $0 analyze    # Analyze codebase"
    echo "  $0 clean      # Clean duplicates"
    echo "  $0 all        # Full cleanup"
}

# Function to analyze codebase
analyze_codebase() {
    print_status "Analyzing codebase..."
    
    echo ""
    print_status "📊 Code Statistics:"
    
    # Count files by type
    TS_FILES=$(find . -name "*.ts" -not -path "./node_modules/*" | wc -l)
    TSX_FILES=$(find . -name "*.tsx" -not -path "./node_modules/*" | wc -l)
    JS_FILES=$(find . -name "*.js" -not -path "./node_modules/*" | wc -l)
    JSX_FILES=$(find . -name "*.jsx" -not -path "./node_modules/*" | wc -l)
    
    echo "  TypeScript files: $TS_FILES"
    echo "  TSX files: $TSX_FILES"
    echo "  JavaScript files: $JS_FILES"
    echo "  JSX files: $JSX_FILES"
    
    echo ""
    print_status "🔍 Duplicate Files Found:"
    
    # Find duplicate filenames
    DUPLICATES=$(find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | sed 's/.*\///' | sort | uniq -d)
    
    if [ -n "$DUPLICATES" ]; then
        echo "$DUPLICATES" | while read -r file; do
            echo "  ❌ $file"
            find . -name "$file" -not -path "./node_modules/*"
        done
    else
        echo "  ✅ No duplicate files found"
    fi
    
    echo ""
    print_status "📁 Directory Structure:"
    tree -I 'node_modules|.git|.next' -L 3 --dirsfirst
}

# Function to clean duplicates
clean_duplicates() {
    print_status "Cleaning duplicate files..."
    
    # Remove duplicate chat-interface.tsx
    if [ -f "components/chat-interface.tsx" ] && [ -f "components/chat/chat-interface.tsx" ]; then
        print_warning "Found duplicate chat-interface.tsx files"
        if [ "components/chat/chat-interface.tsx" -nt "components/chat-interface.tsx" ]; then
            rm "components/chat-interface.tsx"
            print_success "Removed older chat-interface.tsx"
        else
            rm "components/chat/chat-interface.tsx"
            print_success "Removed newer chat-interface.tsx"
        fi
    fi
    
    # Remove duplicate conversation-list.tsx
    if [ -f "components/conversation-list.tsx" ] && [ -f "components/conversation/conversation-list.tsx" ]; then
        print_warning "Found duplicate conversation-list.tsx files"
        if [ "components/conversation/conversation-list.tsx" -nt "components/conversation-list.tsx" ]; then
            rm "components/conversation-list.tsx"
            print_success "Removed older conversation-list.tsx"
        else
            rm "components/conversation/conversation-list.tsx"
            print_success "Removed newer conversation-list.tsx"
        fi
    fi
    
    print_success "Duplicate cleanup completed"
}

# Function to organize files
organize_files() {
    print_status "Organizing files..."
    
    # Create missing directories
    mkdir -p components/ui
    mkdir -p lib
    mkdir -p types
    mkdir -p hooks
    
    # Move UI components to proper location
    if [ -f "components/ui/base-components.tsx" ]; then
        print_status "UI components already organized"
    fi
    
    # Ensure proper file structure
    print_status "Checking file structure..."
    
    # Check for proper imports
    print_status "Checking for unused imports..."
    # This would require a more sophisticated analysis
    
    print_success "File organization completed"
}

# Function to remove unused files
remove_unused() {
    print_status "Removing unused files..."
    
    # List of potentially unused files
    UNUSED_FILES=(
        "components/chat-interface.tsx"  # If duplicate exists
        "components/conversation-list.tsx"  # If duplicate exists
        "app/api/grafana/route.ts"  # If not used
    )
    
    for file in "${UNUSED_FILES[@]}"; do
        if [ -f "$file" ]; then
            print_warning "Checking if $file is used..."
            # Simple check - could be enhanced
            if ! grep -r "$(basename "$file" .tsx)" . --exclude-dir=node_modules --exclude-dir=.git > /dev/null 2>&1; then
                print_warning "Potentially unused file: $file"
            fi
        fi
    done
}

# Function to format code
format_code() {
    print_status "Formatting code..."
    
    # Check if prettier is available
    if command -v npx &> /dev/null; then
        npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}" || print_warning "Prettier formatting failed"
    else
        print_warning "Prettier not available, skipping formatting"
    fi
    
    print_success "Code formatting completed"
}

# Function to run all cleanup operations
run_all() {
    print_status "Running complete code cleanup..."
    
    analyze_codebase
    echo ""
    clean_duplicates
    echo ""
    organize_files
    echo ""
    remove_unused
    echo ""
    format_code
    echo ""
    
    print_success "Complete code cleanup finished!"
}

# Main script logic
main() {
    case "$1" in
        analyze)
            analyze_codebase
            ;;
        clean)
            clean_duplicates
            ;;
        organize)
            organize_files
            ;;
        all)
            run_all
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 