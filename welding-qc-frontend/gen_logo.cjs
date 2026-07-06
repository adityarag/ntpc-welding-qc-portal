const fs = require('fs');
const b64 = fs.readFileSync('./src/assets/ntpc_logo_b64.txt', 'utf8').trim();
const js = "const ntpcLogoB64 = '" + b64 + "';\nexport default ntpcLogoB64;\n";
fs.writeFileSync('./src/assets/ntpcLogoB64.js', js);
console.log('JS asset written, chars:', js.length);
