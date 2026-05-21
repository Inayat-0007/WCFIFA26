/**
 * Generate PWA icons as minimal valid PNG files.
 * Uses raw binary PNG encoding — no external dependencies.
 * 
 * Run: node generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height) {
  // Create RGBA pixel data
  const pixels = Buffer.alloc(width * height * 4);
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= radius) {
        // Gradient from crimson center to dark edges
        const t = dist / radius;
        
        if (dist < radius * 0.65) {
          // Inner: Crimson (#DC143C) to darker crimson
          const innerT = dist / (radius * 0.65);
          pixels[idx] = Math.round(220 - innerT * 60);     // R
          pixels[idx + 1] = Math.round(20 - innerT * 10);  // G
          pixels[idx + 2] = Math.round(60 - innerT * 20);  // B
          pixels[idx + 3] = 255;                             // A
        } else {
          // Outer ring: Dark with gold accent
          const outerT = (dist - radius * 0.65) / (radius * 0.35);
          pixels[idx] = Math.round(160 - outerT * 100);     // R
          pixels[idx + 1] = Math.round(10 + outerT * 20);   // G  
          pixels[idx + 2] = Math.round(40 - outerT * 30);   // B
          pixels[idx + 3] = 255;                              // A
        }
        
        // Gold ring at 60% radius
        const ringDist = Math.abs(dist - radius * 0.6);
        if (ringDist < radius * 0.03) {
          pixels[idx] = 255;     // R - Gold
          pixels[idx + 1] = 215; // G
          pixels[idx + 2] = 0;   // B
          pixels[idx + 3] = 255; // A
        }
        
        // Draw a simple soccer ball pattern (white pentagon shapes)
        const angle = Math.atan2(dy, dx);
        const normalDist = dist / radius;
        
        // Central white hexagon
        if (normalDist < 0.15) {
          pixels[idx] = 255;
          pixels[idx + 1] = 255;
          pixels[idx + 2] = 255;
          pixels[idx + 3] = 255;
        }
        
        // 5 white pentagons around center
        for (let i = 0; i < 5; i++) {
          const pentAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const pentX = Math.cos(pentAngle) * 0.35;
          const pentY = Math.sin(pentAngle) * 0.35;
          const pdx = (dx / radius) - pentX;
          const pdy = (dy / radius) - pentY;
          const pentDist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pentDist < 0.1) {
            pixels[idx] = 255;
            pixels[idx + 1] = 255;
            pixels[idx + 2] = 255;
            pixels[idx + 3] = 255;
          }
        }
      } else {
        // Outside circle: transparent
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  
  // Build PNG file
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);
  
  // IDAT chunk - filter each row with filter type 0 (None)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter type: None
    pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
const iconsDir = path.join(__dirname, 'frontend', 'public', 'icons');

console.log('Generating 192x192 icon...');
const icon192 = createPNG(192, 192);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
console.log(`  → icon-192.png (${icon192.length} bytes)`);

console.log('Generating 512x512 icon...');
const icon512 = createPNG(512, 512);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);
console.log(`  → icon-512.png (${icon512.length} bytes)`);

// Also create favicon.ico (copy 192px as a simple approach)
fs.writeFileSync(path.join(__dirname, 'frontend', 'public', 'favicon.ico'), icon192);
console.log(`  → favicon.ico (${icon192.length} bytes)`);

console.log('\n✅ All PWA icons generated successfully!');
