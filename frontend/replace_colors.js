import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

const replacements = {
  '1B2A4A': '000000',      // Deep Blue -> Pure Black
  'E8446A': '10b981',      // Pink -> Sea Green (Emerald 500)
  'd4375b': '059669',      // Dark Pink Hover -> Sea Green Hover (Emerald 600)
  '6C3CE1': '10b981',      // Purple in POS -> Sea Green
  '5b32bf': '059669',      // Darker Purple in POS -> Darker Sea Green
  '232,68,106': '16,185,129', // rgb(232,68,106) for shadows -> rgb(16,185,129)
};

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const [search, replace] of Object.entries(replacements)) {
        // Case-insensitive replace for hex, case-sensitive for RGB just in case
        const regex = new RegExp(search, 'gi');
        content = content.replace(regex, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Theme replacement complete.');
