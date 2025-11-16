const postcss = require('postcss');
const { hasColor } = require('./AST.js');


describe('hasColorDeclaration', () => {
    test('should return false when CSS has only font-size', () => {
        const css = 'font-size: 10px;';
        const root = postcss.parse(css);
        expect(hasColor(root)).toBe(false);
    });

    test('should return true when CSS has color property', () => {
        const css = 'color: red;';
        const root = postcss.parse(css);
        expect(hasColor(root)).toBe(true);
    });

    test('should return true when CSS has background property with color', () => {
        const css = 'background: #000;';
        const root = postcss.parse(css);
        expect(hasColor(root)).toBe(true);
    });
});


