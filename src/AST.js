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
        if (decl.prop === 'color' ||
            decl.prop === 'background'||
            decl.prop === 'background-color') {
            foundColor = true;
        }
    });

    return foundColor;
}

// console.log('Contains color declarations:', hasColor(root));
module.exports = { hasColor };


function pruneColorNodes(root) {
    // Create a new empty root
    const prunedRoot = postcss.root();

    // Walk through all rules in the original root
    root.walkRules(rule => {
        // Create a new rule to hold filtered declarations
        const newRule = postcss.rule({ selector: rule.selector });

        // Filter declarations
        rule.walkDecls(decl => {
            if (
                decl.prop === 'color' ||
                decl.prop === 'background' ||
                decl.prop === 'background-color'
            ) {
                newRule.append(decl.clone());
            }
        });

        // Append rule only if it has color-related declarations
        if (newRule.nodes.length > 0) {
            prunedRoot.append(newRule);
        }
    });

    return prunedRoot;
}



function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}



function luminance([r, g, b]) {
    const [R, G, B] = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}


function contrastRatio(color1, color2) {
    const L1 = luminance(color1);
    const L2 = luminance(color2);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    (lighter + 0.05) / (darker + 0.05);
}




function checkContrast(prunedRoot) {
    let isAccessible = true;

    prunedRoot.walkRules(rule => {
        let textColor = null;
        let bgColor = null;

        // Collect color and background values
        rule.walkDecls(decl => {
            if (decl.prop === 'color') {
                textColor = decl.value.trim();
            }
            if (decl.prop === 'background' || decl.prop === 'background-color') {
                bgColor = decl.value.trim();
            }
        });

        // If both colors exist, check contrast
        if (textColor && bgColor) {
            try {
                const rgbText = hexToRgb(textColor);
                const rgbBg = hexToRgb(bgColor);
                const ratio = contrastRatio(rgbText, rgbBg);

                if (ratio < 4.5) {
                    isAccessible = false;
                }
            } catch (err) {
                console.warn(`Skipping invalid color in ${rule.selector}:`, err.message);
            }
        }
    });

    return isAccessible;
}

