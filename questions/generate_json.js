const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/LXB/WeChatProjects/miniprogram-6/questions';
const nums = ['一','二','三','四','五','六','七'];

for (let i = 1; i <= 7; i++) {
  const txt = fs.readFileSync(path.join(dir, `parsed_第${nums[i-1]}大类问卷.txt`), 'utf8');

  // Normalize: replace all whitespace runs with single space
  const norm = txt.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into segments by category headers
  // Category headers: "中类X" or "NN TypeName（...）" at start or after a period
  const segments = [];
  // Regex: find all category headers and their content
  // Pattern 1: "中类\d[，,\d]*[:：]?\s*Name（Desc）" followed by items
  // Pattern 2: "NN Name（Desc）" where NN is 01-14

  const regex = /(?:中类[\d,，]+\s*[:：]?\s*)?(\d{1,2})\s+([^\d]+?)(?:（([^）]*)）)?\s*((?:\d+\.\s*[^\n]+\n?)+)/g;

  let match;
  const categories = [];
  let order = 1;

  while ((match = regex.exec(norm)) !== null) {
    const num = match[1];
    const name = match[2].trim();
    const desc = match[3] ? match[3].trim() : '';
    const itemsBlock = match[4];

    const catName = desc ? `${name}（${desc}）` : name;

    const items = [];
    const itemRegex = /\d+\.\s*([^\n]+)/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(itemsBlock)) !== null) {
      items.push(itemMatch[1].trim().replace(/\s+/g, ' '));
    }

    if (items.length > 0) {
      categories.push({ order: order++, category: catName, items });
    }
  }

  const jsonPath = path.join(dir, `MEDIUM_CATEGORY_QUESTIONS_${i}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(categories, null, 2), 'utf8');
  console.log(`\nGenerated MEDIUM_CATEGORY_QUESTIONS_${i}.json with ${categories.length} categories`);
  categories.forEach(c => console.log(`  ${c.order}. ${c.category}: ${c.items.length} items`));
}
