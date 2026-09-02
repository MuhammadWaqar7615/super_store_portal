import fs from 'fs';
import path from 'path';

const basePath = path.join(process.cwd(), 'src');

function replaceInFile(filePath, searchReplaceList) {
  const fullPath = path.join(basePath, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  
  for (const { search, replace } of searchReplaceList) {
    content = content.replace(search, replace);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  }
}

// 1. Unify POS.jsx
replaceInFile('pages/POS.jsx', [
  {
    search: '<div className="flex flex-1 overflow-hidden p-6 gap-6 pb-28">',
    replace: `<div className="flex flex-1 overflow-hidden p-6 pb-28">
        <div className="flex flex-1 w-full bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden divide-x divide-white/10">`
  },
  {
    search: '<div className="w-[65%] flex flex-col gap-6 h-full">',
    replace: '<div className="w-[65%] flex flex-col h-full divide-y divide-white/10">'
  },
  {
    search: '<div className="w-[35%] h-full flex flex-col gap-4">',
    replace: '<div className="w-[35%] h-full flex flex-col bg-black/20 p-6">'
  },
  {
    search: '{/* 3.3 Bottom Action Bar */}',
    replace: `</div>\n      {/* 3.3 Bottom Action Bar */}`
  },
  {
    search: '<div className="flex bg-white/5 p-1 rounded-lg w-fit">',
    replace: '<div className="flex bg-black/40 p-1 rounded-lg w-fit mb-4">'
  },
  {
    search: 'mt-4 flex-1 bg-white/10 backdrop-blur-md rounded-[8px] border border-white/20',
    replace: 'mt-4 flex-1 bg-white/5 rounded-2xl border border-white/5'
  }
]);

// 2. Remove borders and backgrounds from child components
const stripOuterClasses = [
  {
    search: 'bg-white/10 backdrop-blur-md rounded-[8px] border border-white/20 shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
    replace: 'bg-transparent'
  },
  {
    search: 'bg-white/10 backdrop-blur-md rounded-[8px] border border-white/20 shadow-xl shadow-black/30',
    replace: 'bg-transparent'
  }
];

replaceInFile('components/pos/POSSearch.jsx', stripOuterClasses);
replaceInFile('components/pos/POSCart.jsx', stripOuterClasses);
replaceInFile('components/pos/POSCustomerSelect.jsx', stripOuterClasses);
replaceInFile('components/pos/POSPendingCarts.jsx', stripOuterClasses);

console.log('Unification complete.');
