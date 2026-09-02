import fs from 'fs';
import path from 'path';

const posDir = path.join(process.cwd(), 'src/components/pos');
const posPage = path.join(process.cwd(), 'src/pages/POS.jsx');

const classMap = {
  'bg-slate-50': 'bg-transparent', // Inherit Dark Seagreen from AdminLayout
  'bg-white': 'bg-white/10 backdrop-blur-md', // Premium glassmorphism
  'bg-slate-100': 'bg-white/5',
  'bg-slate-200': 'bg-white/10',
  'border-slate-200': 'border-white/20',
  'border-slate-300': 'border-white/30',
  'text-slate-800': 'text-white',
  'text-slate-700': 'text-gray-100',
  'text-slate-600': 'text-gray-200',
  'text-slate-500': 'text-gray-300',
  'text-slate-400': 'text-gray-400',
  'hover:bg-slate-50': 'hover:bg-white/10',
  'hover:bg-slate-100': 'hover:bg-white/15',
  'hover:bg-slate-200': 'hover:bg-white/20',
  'hover:text-slate-700': 'hover:text-white',
  'bg-blue-50': 'bg-[#10b981]/20', // Soft sea green accent background
  'border-blue-100': 'border-[#10b981]/30',
  'border-blue-200': 'border-[#10b981]/40',
  'bg-red-50': 'bg-red-500/10',
  'border-red-200': 'border-red-500/20',
  'hover:bg-red-50': 'hover:bg-red-500/20',
  'shadow-\\[0_1px_3px_rgba\\(0\\,0\\,0\\,0\\.06\\)\\]': 'shadow-xl shadow-black/30',
};

function processFile(fullPath) {
  if (!fullPath.endsWith('.jsx')) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  
  for (const [search, replace] of Object.entries(classMap)) {
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
console.log('POS Premium Glassmorphism Update complete.');
