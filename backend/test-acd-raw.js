import fs from 'fs';

const acdPath =
  'G:\\SteamLibrary\\steamapps\\common\\assettocorsa\\content\\cars\\abarth500\\data.acd';
const buf = fs.readFileSync(acdPath);

console.log('First 512 bytes (hex dump):');
for (let i = 0; i < 512; i += 16) {
  const hex = buf
    .slice(i, i + 16)
    .toString('hex')
    .match(/.{1,2}/g)
    .join(' ');
  const ascii = [...buf.slice(i, i + 16)]
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('');
  console.log(`${i.toString().padStart(4, '0')}: ${hex.padEnd(48, ' ')} ${ascii}`);
}

console.log('\n\nAnalyzing structure:');
console.log('Bytes 0-3 (filename length):', buf.readUInt32LE(0));
console.log('Filename:', buf.toString('ascii', 4, 12));
console.log('Bytes 12-15 (data size):', buf.readUInt32LE(12));

console.log('\n\nAnalyzing encryption pattern:');
const dataStart = 16;
const expected = '[FRONT]\nNAME=ST\nSHORT_NAME=ST\nLENGTH_ADJUST=0\n';

console.log('=== Deriving XOR key stream ===');
const keyStream = [];
for (let i = 0; i < Math.min(50, expected.length); i++) {
  const rawValue = buf.readUInt32LE(dataStart + i * 4);
  const encryptedByte = rawValue & 0xff;
  const expectedByte = expected.charCodeAt(i);
  const xorKey = encryptedByte ^ expectedByte;

  keyStream.push(xorKey);
  if (i < 30) {
    console.log(
      `${i.toString().padStart(2)}: '${
        expected[i] === '\n' ? '\\n' : expected[i]
      }' -> xor=0x${xorKey.toString(16).padStart(2, '0')}`
    );
  }
}

// Look for repeating pattern
console.log('\n=== Looking for pattern ===');
for (let keyLen = 2; keyLen <= 20; keyLen++) {
  let matches = true;
  for (let i = keyLen; i < Math.min(keyStream.length, 40); i++) {
    if (keyStream[i] !== keyStream[i % keyLen]) {
      matches = false;
      break;
    }
  }
  if (matches) {
    console.log(`Found repeating key of length ${keyLen}:`);
    const key = keyStream.slice(0, keyLen);
    console.log('  Hex:', key.map((k) => '0x' + k.toString(16).padStart(2, '0')).join(' '));
    console.log('  Dec:', key.join(' '));
    console.log(
      '  Chars:',
      key.map((k) => (k >= 32 && k <= 126 ? `'${String.fromCharCode(k)}'` : '?')).join(' ')
    );
    break;
  }
}
