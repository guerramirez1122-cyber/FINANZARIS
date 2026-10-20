import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePNG(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw Scanlines: each scanline has 1 filter byte (0) + 4 bytes per pixel (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = isMaskable ? 0 : width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Distance from center for rounded corners or squircle
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const innerW = width / 2 - cornerRadius;
      const innerH = height / 2 - cornerRadius;

      let inBounds = true;
      if (!isMaskable) {
        if (dx > innerW && dy > innerH) {
          const cornerDist = Math.hypot(dx - innerW, dy - innerH);
          if (cornerDist > cornerRadius) {
            inBounds = false;
          }
        }
      }

      if (!inBounds) {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Indigo brand gradient: #4f46e5 (79, 70, 229) to #3730a3 (55, 48, 163)
      const gradFactor = (x + y) / (width + height);
      let r = Math.round(79 - gradFactor * 24);
      let g = Math.round(70 - gradFactor * 22);
      let b = Math.round(229 - gradFactor * 66);
      let a = 255;

      // Receipt shape inside (proportional)
      const rw = width * 0.44;
      const rh = height * 0.58;
      const rx = (width - rw) / 2;
      const ry = (height - rh) / 2;

      if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
        // Inside receipt: White with soft tint
        r = 255;
        g = 255;
        b = 255;

        // Header bar in receipt
        if (y >= ry + rh * 0.12 && y <= ry + rh * 0.20 && x >= rx + rw * 0.15 && x <= rx + rw * 0.55) {
          r = 79;
          g = 70;
          b = 229;
        }

        // Green dot
        const gDotX = rx + rw * 0.75;
        const gDotY = ry + rh * 0.16;
        if (Math.hypot(x - gDotX, y - gDotY) < width * 0.02) {
          r = 16;
          g = 185;
          b = 129;
        }

        // Divider line
        if (Math.abs(y - (ry + rh * 0.28)) < 2 && x >= rx + rw * 0.15 && x <= rx + rw * 0.85) {
          r = 203;
          g = 213;
          b = 225;
        }

        // Receipt body lines
        const lines = [0.38, 0.48, 0.58];
        for (const linePct of lines) {
          if (Math.abs(y - (ry + rh * linePct)) < 3 && x >= rx + rw * 0.15 && x <= rx + rw * 0.65) {
            r = 148;
            g = 163;
            b = 184;
          }
          if (Math.abs(y - (ry + rh * linePct)) < 3 && x >= rx + rw * 0.72 && x <= rx + rw * 0.85) {
            r = 100;
            g = 116;
            b = 139;
          }
        }

        // Total block
        if (y >= ry + rh * 0.72 && y <= ry + rh * 0.82 && x >= rx + rw * 0.55 && x <= rx + rw * 0.85) {
          r = 79;
          g = 70;
          b = 229;
        }
      }

      // Camera badge circle in bottom-right
      const badgeX = cx + width * 0.22;
      const badgeY = cy + height * 0.22;
      const badgeRadius = width * 0.12;
      const distToBadge = Math.hypot(x - badgeX, y - badgeY);

      if (distToBadge <= badgeRadius) {
        if (distToBadge >= badgeRadius - 3) {
          r = 255;
          g = 255;
          b = 255;
        } else {
          r = 79;
          g = 70;
          b = 229;
          // Inner camera lens dot
          if (distToBadge < width * 0.035) {
            r = 255;
            g = 255;
            b = 255;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // IDAT (Deflated)
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
console.log('Generated pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
console.log('Generated pwa-512x512.png');

// 3. pwa-maskable-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
console.log('Generated pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180, false));
console.log('Generated apple-touch-icon.png');

// 5. favicon.ico (fallback to 48x48 PNG renamed or basic PNG)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePNG(64, 64, false));
console.log('Generated favicon.ico');
