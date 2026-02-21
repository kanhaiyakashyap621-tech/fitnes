const fs = require('fs')
const zlib = require('zlib')

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[n] = c >>> 0
  }
  return table
})()

const crc32 = (buf) => {
  let crc = 0 ^ -1
  for (let i = 0; i < buf.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type)
  const crc = Buffer.alloc(4)
  const crcVal = crc32(Buffer.concat([typeBuf, data]))
  crc.writeUInt32BE(crcVal, 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

const makePng = (size, outPath) => {
  const width = size
  const height = size
  const rowSize = width * 4 + 1
  const raw = Buffer.alloc(rowSize * height)
  const bg = { r: 13, g: 27, b: 42, a: 255 }
  const fg = { r: 0, g: 212, b: 255, a: 255 }
  const cx = width / 2
  const cy = height / 2
  const radius = width * 0.36
  const r2 = radius * radius

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowSize
    raw[rowStart] = 0
    for (let x = 0; x < width; x += 1) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const use = dx * dx + dy * dy <= r2 ? fg : bg
      const offset = rowStart + 1 + x * 4
      raw[offset] = use.r
      raw[offset + 1] = use.g
      raw[offset + 2] = use.b
      raw[offset + 3] = use.a
    }
  }

  const compressed = zlib.deflateSync(raw)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])

  fs.writeFileSync(outPath, png)
}

makePng(192, 'public/icons/icon-192.png')
makePng(512, 'public/icons/icon-512.png')
