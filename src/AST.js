import postcss from 'postcss';
import fs from 'fs';

const css = fs.readFileSync('styles.css', 'utf8');

const root = postcss.parse(css);

console.log(JSON.stringify(root, null, 2));

const output = root.toResults().css;
fs.writeFileSync('output.css', output);