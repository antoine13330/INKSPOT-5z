#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Patterns to find and replace - revert to Promise-based approach for Next.js 15
const patterns = [
  {
    find: /{ params }: { params: { id: string } }/g,
    replace: '{ params }: { params: Promise<{ id: string }> }'
  },
  {
    find: /{ params }: { params: { proId: string } }/g,
    replace: '{ params }: { params: Promise<{ proId: string }> }'
  },
  {
    find: /context: { params: { id: string } }/g,
    replace: 'context: { params: Promise<{ id: string }> }'
  },
  {
    find: /context: { params: { proId: string } }/g,
    replace: 'context: { params: Promise<{ proId: string }> }'
  }
];

// Add await back to params destructuring
const awaitPatterns = [
  {
    find: /const \{ id: (\w+) \} = params/g,
    replace: 'const { id: $1 } = await params'
  },
  {
    find: /const \{ proId: (\w+) \} = params/g,
    replace: 'const { proId: $1 } = await params'
  },
  {
    find: /const \{ (\w+) \} = params/g,
    replace: 'const { $1 } = await params'
  }
];

function findApiFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findApiFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply all patterns
    patterns.forEach(pattern => {
      if (pattern.find.test(content)) {
        content = content.replace(pattern.find, pattern.replace);
        modified = true;
      }
    });

    // Apply await patterns
    awaitPatterns.forEach(pattern => {
      if (pattern.find.test(content)) {
        content = content.replace(pattern.find, pattern.replace);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
  return false;
}

function main() {
  console.log('🔧 Reverting to Next.js 15 Promise-based params compatibility...\n');

  // Find all TypeScript files in the app/api directory
  const apiDir = path.join(process.cwd(), 'app', 'api');
  
  console.log('Looking in directory:', apiDir);
  
  if (!fs.existsSync(apiDir)) {
    console.error('❌ app/api directory not found');
    return;
  }
  
  const apiFiles = findApiFiles(apiDir);
  console.log(`Found ${apiFiles.length} API files to check`);
  
  let fixedCount = 0;
  
  apiFiles.forEach(file => {
    console.log(`Checking: ${file}`);
    if (fixFile(file)) {
      fixedCount++;
    }
  });

  console.log(`\n🎉 Fixed ${fixedCount} files for Next.js 15 compatibility!`);
  
  if (fixedCount > 0) {
    console.log('\n📝 Next steps:');
    console.log('1. Review the changes to ensure they look correct');
    console.log('2. Run your tests to verify functionality');
    console.log('3. Commit the changes and redeploy');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, patterns, awaitPatterns };
