const fs=require('fs');
let s=fs.readFileSync('shell.html','utf8');
s=s.replace('/*__CSS__*/',()=>fs.readFileSync('styles.css','utf8'))
   .replace('/*__DATA__*/',()=>fs.readFileSync('../data/crsv-paragraphs-v2026.09.json','utf8'))
   .replace('/*__JS__*/',()=>fs.readFileSync('app.js','utf8'));
fs.writeFileSync('../index.html',s);
console.log('built index.html', (s.length/1024).toFixed(0)+' KB');
