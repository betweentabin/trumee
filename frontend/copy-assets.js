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

console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);
console.log('Looking for public directory at:', publicDir);
console.log('Target static directory:', staticDir);

if (fs.existsSync(publicDir)) {
  console.log('✓ Found public directory');
  console.log('Copying public assets to .next/static...');
  
  // Ensure static directory exists
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
    console.log('✓ Created static directory');
  }
  
  // Copy images directory
  if (fs.existsSync(path.join(publicDir, 'images'))) {
    copyDir(path.join(publicDir, 'images'), path.join(staticDir, 'images'));
    console.log('✓ Copied images directory');
  } else {
    console.log('⚠ Images directory not found');
  }
  
  // Copy logo directory
  if (fs.existsSync(path.join(publicDir, 'logo'))) {
    copyDir(path.join(publicDir, 'logo'), path.join(staticDir, 'logo'));
    console.log('✓ Copied logo directory');
  } else {
    console.log('⚠ Logo directory not found');
  }
  
  // Copy root files (SVG, etc.)
  try {
    const rootFiles = fs.readdirSync(publicDir).filter(file => {
      const filePath = path.join(publicDir, file);
      return fs.statSync(filePath).isFile();
    });
    
    for (const file of rootFiles) {
      fs.copyFileSync(path.join(publicDir, file), path.join(staticDir, file));
    }
    console.log(`✓ Copied ${rootFiles.length} root files`);
  } catch (error) {
    console.log('⚠ Error copying root files:', error.message);
  }
  
  console.log('Asset copying completed!');
} else {
  console.log('❌ Public directory not found at:', publicDir);
  
  // Try to find public directory in different locations
  const possiblePaths = [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'frontend', 'public'),
    path.join(__dirname, '..', 'public'),
  ];
  
  console.log('Searching for public directory in:');
  for (const possiblePath of possiblePaths) {
    console.log(`  ${possiblePath}: ${fs.existsSync(possiblePath) ? '✓ Found' : '✗ Not found'}`);
    if (fs.existsSync(possiblePath)) {
      console.log('Found public directory at:', possiblePath);
      // Use the found directory
      const foundPublicDir = possiblePath;
      const foundStaticDir = path.join(__dirname, '.next', 'static');
      
      if (!fs.existsSync(foundStaticDir)) {
        fs.mkdirSync(foundStaticDir, { recursive: true });
      }
      
      if (fs.existsSync(path.join(foundPublicDir, 'images'))) {
        copyDir(path.join(foundPublicDir, 'images'), path.join(foundStaticDir, 'images'));
        console.log('✓ Copied images from found directory');
      }
      
      if (fs.existsSync(path.join(foundPublicDir, 'logo'))) {
        copyDir(path.join(foundPublicDir, 'logo'), path.join(foundStaticDir, 'logo'));
        console.log('✓ Copied logo from found directory');
      }
      
      break;
    }
  }
}
