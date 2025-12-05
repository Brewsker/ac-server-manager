const fs = require('fs');
const path = require('path');

const carPath = '/opt/acserver/content/cars/abarth500';
const uiCarPath = path.join(carPath, 'ui', 'ui_car.json');

console.log('Reading:', uiCarPath);

try {
  const data = fs.readFileSync(uiCarPath, 'utf8');
  console.log('Raw length:', data.length);
  console.log('First 50 chars:', JSON.stringify(data.slice(0, 50)));

  const json = JSON.parse(data);
  console.log('Parsed name:', json.name);
  console.log('Parsed brand:', json.brand);
} catch (e) {
  console.log('Error:', e.message);
}
