const postcss = require('postcss');
const fs = require('fs');

// const css = fs.readFileSync('styles.css', 'utf8');

// const root = postcss.parse(css);

// console.log(JSON.stringify(root, null, 2));

// const output = root.toResults().css;
// fs.writeFileSync('output.css', output);

function hasColor(root) {
    let foundColor = false;

    root.walkDecls(decl => {
        if (decl.prop === 'color' || decl.prop === 'background') {
            foundColor = true;
        }
    });

    return foundColor;
}

// console.log('Contains color declarations:', hasColor(root));
module.exports = { hasColor };