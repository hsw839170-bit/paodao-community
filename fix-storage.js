const fs = require('fs');
const path = require('path');

const files = [
  'app/profile/page.tsx',
  'app/public-orders/page.tsx',
  'app/register/page.tsx',
  'app/order/[id]/OrderForm.tsx',
  'app/my-orders/[id]/page.tsx',
  'app/profile/orders/page.tsx',
  'app/profile/edit/page.tsx'
];

const replacements = [
  { from: /localStorage\.getItem\(/g, to: 'safeGetItem(' },
  { from: /localStorage\.setItem\(/g, to: 'safeSetItem(' },
  { from: /localStorage\.removeItem\(/g, to: 'safeRemoveItem(' }
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`跳过: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // 检查是否已导入
  if (!content.includes('from \'@/lib/storage\'')) {
    // 在 'use client'; 后添加导入
    content = content.replace(
      "'use client';",
      "'use client';\n\nimport { safeGetItem, safeSetItem, safeRemoveItem } from '@/lib/storage';"
    );
  }
  
  // 替换 localStorage 使用
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`已修复: ${file}`);
});

console.log('完成!');
