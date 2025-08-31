const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy public directory to .next/static
const publicDir = path.join(__dirname, 'public');
const staticDir = path.join(__dirname, '.next', 'static');

if (fs.existsSync(publicDir)) {
  console.log('Copying public assets to .next/static...');
  
  // Copy images directory
  if (fs.existsSync(path.join(publicDir, 'images'))) {
    copyDir(path.join(publicDir, 'images'), path.join(staticDir, 'images'));
    console.log('✓ Copied images directory');
  }
  
  // Copy logo directory
  if (fs.existsSync(path.join(publicDir, 'logo'))) {
    copyDir(path.join(publicDir, 'logo'), path.join(staticDir, 'logo'));
    console.log('✓ Copied logo directory');
  }
  
  // Copy root files (SVG, etc.)
  const rootFiles = fs.readdirSync(publicDir).filter(file => {
    const filePath = path.join(publicDir, file);
    return fs.statSync(filePath).isFile();
  });
  
  for (const file of rootFiles) {
    fs.copyFileSync(path.join(publicDir, file), path.join(staticDir, file));
  }
  console.log(`✓ Copied ${rootFiles.length} root files`);
  
  console.log('Asset copying completed!');
} else {
  console.log('Public directory not found');
}
