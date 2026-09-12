const fs = require('fs');
for (const spec of process.argv.slice(2)) {
  const [file, from = '1', to = '100000'] = spec.split('@');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  console.log(`FILE ${file} (${lines.length} lines)`);
  console.log(lines.slice(Number(from)-1, Number(to)).map((l,i)=>`${Number(from)+i}: ${l}`).join('\n'));
}
