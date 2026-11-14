import fs from 'fs';
import path from 'path';

function createIco(pngBuffers, outPath) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + (dirEntrySize * count);

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // number of images

  const entries = [];
  const imageBuffers = [];

  for (const { buffer, width, height } of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset

    entries.push(entry);
    imageBuffers.push(buffer);
    offset += buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...imageBuffers]);
  fs.writeFileSync(outPath, icoBuffer);
  console.log(`✅ Created valid favicon.ico at: ${outPath} (${icoBuffer.length} bytes)`);
}

const dir = path.resolve(process.cwd(), 'public');
const png16 = fs.readFileSync(path.resolve(dir, 'favicon-16x16.png'));
const png32 = fs.readFileSync(path.resolve(dir, 'favicon-32x32.png'));
const png48 = fs.readFileSync(path.resolve(dir, 'favicon-48x48.png'));

createIco([
  { buffer: png16, width: 16, height: 16 },
  { buffer: png32, width: 32, height: 32 },
  { buffer: png48, width: 48, height: 48 }
], path.resolve(dir, 'favicon.ico'));
