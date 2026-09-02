import fs from 'fs';
import path from 'path';

const posDir = path.join(process.cwd(), 'src/components/pos');
const posPage = path.join(process.cwd(), 'src/pages/POS.jsx');

const classMap = {
  'bg-slate-50': 'bg-transparent', // Since the parent is #064e3b
  'bg-white': 'bg-[#000000]',
  'border-slate-200': 'border-[#111111]',
  'border-slate-300': 'border-[#222222]',
  'text-slate-800': 'text-white',
  'text-slate-700': 'text-gray-200',
  'text-slate-600': 'text-gray-300',
  'text-slate-500': 'text-gray-400',
  'text-slate-400': 'text-gray-500',
  'bg-slate-100': 'bg-[#09090b]',
  'bg-slate-200': 'bg-[#111111]',
  'hover:bg-slate-50': 'hover:bg-[#111111]',
  'hover:bg-slate-100': 'hover:bg-[#1a1a1a]',
  'hover:bg-slate-200': 'hover:bg-[#222222]',
  'hover:text-slate-700': 'hover:text-white',
  'bg-blue-50': 'bg-[#10b981]/10',
  'border-blue-100': 'border-[#10b981]/20',
  'border-blue-200': 'border-[#10b981]/30',
  'bg-red-50': 'bg-red-500/10',
  'border-red-200': 'border-red-500/20',
  'hover:bg-red-50': 'hover:bg-red-500/20',
  'shadow-\\[0_1px_3px_rgba\\(0\\,0\\,0\\,0\\.06\\)\\]': 'shadow-2xl',
};

function processFile(fullPath) {
  if (!fullPath.endsWith('.jsx')) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  
  for (const [search, replace] of Object.entries(classMap)) {
    // Replace whole word matches to avoid partial replacements (like text-slate-800 shouldn't match text-slate-80)
    // Using simple string replacement is safe because these are exact class names.
    const regex = new RegExp(`\\b${search}\\b`, 'g');
    content = content.replace(regex, replace);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${fullPath}`);
  }
}

function processDirectory(directory) {
  if (!fs.existsSync(directory)) return;
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

processDirectory(posDir);
if (fs.existsSync(posPage)) {
  processFile(posPage);
}
console.log('POS Dark Mode Update complete.');
