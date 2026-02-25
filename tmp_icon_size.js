const fs=require('fs');const b=fs.readFileSync('public/logo.png');console.log(b.readUInt32BE(16)+'x'+b.readUInt32BE(20)); 
