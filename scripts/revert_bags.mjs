import fs from 'fs';
import path from 'path';

const initialDataPath = path.resolve('src/data/initialData.js');
let content = fs.readFileSync(initialDataPath, 'utf8');

// Replace images cleanly
content = content.replace(
  /image:\s*'\/bags\/caturra_official_bag\.jpg'/g,
  (match, offset, str) => {
    // Look backwards to find the id
    const preceding = str.slice(Math.max(0, offset - 500), offset);
    if (preceding.includes('prod-colombia')) return "image: '/caturra_colombia.jpg'";
    if (preceding.includes('prod-ethiopia')) return "image: '/caturra_ethiopia.jpg'";
    if (preceding.includes('prod-espresso')) return "image: '/caturra_espresso.jpg'";
    if (preceding.includes('prod-turkish') || preceding.includes('prod-hazelnut') || preceding.includes('prod-french')) {
      return "image: '/bags/bag_classic_blends.jpg'";
    }
    return "image: '/bags/bag_espresso_landscape.jpg'";
  }
);

fs.writeFileSync(initialDataPath, content, 'utf8');
console.log('Successfully updated src/data/initialData.js');

// Also update data/server_db.json
const dbPath = path.resolve('data/server_db.json');
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (Array.isArray(db.products)) {
    db.products = db.products.map(p => {
      let img = p.image;
      if (!img || img === '/bags/caturra_official_bag.jpg') {
        if (p.id.includes('colombia')) img = '/caturra_colombia.jpg';
        else if (p.id.includes('ethiopia')) img = '/caturra_ethiopia.jpg';
        else if (p.id.includes('espresso')) img = '/caturra_espresso.jpg';
        else if (p.id.includes('turkish') || p.id.includes('hazelnut') || p.id.includes('french')) img = '/bags/bag_classic_blends.jpg';
        else if (p.unitType === 'piece' || p.category === 'tools') img = p.image || '/tools/tool_coffee_scale.png';
        else img = '/bags/bag_espresso_landscape.jpg';
      }
      return { ...p, image: img };
    });
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('Successfully updated data/server_db.json');
  }
}

