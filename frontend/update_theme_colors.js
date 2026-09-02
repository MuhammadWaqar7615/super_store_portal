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
      
      // Replace the black background (previously #1B2A4A -> #000000) with Dark Seagreen
      content = content.replace(/bg-\[#000000\]/g, 'bg-[#064e3b]');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Dashboard color update complete.');
