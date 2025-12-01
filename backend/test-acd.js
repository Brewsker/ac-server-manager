import { extractTyresIni } from './src/utils/acdDecryptor.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const acContentPath = process.env.AC_CONTENT_PATH;
const carPath = path.join(acContentPath, 'cars', 'abarth500');

console.log('Testing ACD decryption for abarth500...');
console.log('Car path:', carPath);

try {
  const tyresIni = await extractTyresIni(carPath);

  if (tyresIni) {
    console.log('\n✓ Successfully extracted tyres.ini!');
    console.log('\nFirst 500 characters:');
    console.log(tyresIni.substring(0, 500));
  } else {
    console.log('\n✗ Failed to extract tyres.ini');
  }
} catch (error) {
  console.error('\n✗ Error:', error.message);
  console.error(error.stack);
}
