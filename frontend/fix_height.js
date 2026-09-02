import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Replace min-h-[calc(100vh-64px)] with min-h-screen (100vh) to fix the gap
      content = content.replace(/min-h-\[calc\(100vh-64px\)\]/g, 'min-h-[100vh]');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Height fix complete.');
