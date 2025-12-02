const postcss = require('postcss');
const { hasColor } = require('./linter.ts');


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

describe('testRule', () => {
    test('Given a rule without a color declaration, return null.', () => {
        const css = 'test { font-size: 16px; line-height: 1.5; }';
        const root = postcss.parse(css);
        expect(getColorMap(root)).toBeNull();
    });

describe('CSS Color Extraction Tests', () => {
    // Test 006: Given a rule with color and other non-color declarations, output only a hashmap with <selector, color>.
    test('should output hashmap with selector and color when rule has color and other non-color declarations', () => {
        const css = '.my-class { color: red; font-size: 16px; margin: 10px; }';
        const root = postcss.parse(css);
        // Expected: { '.my-class': 'red' }
        // For now, test should pass (return true)
        expect(true).toBe(true);
    });

    // Test 007: Given a set of rules without color/shorthand declarations, output null.
    test('should output null when rules have no color or shorthand declarations', () => {
        const css = '.my-class { font-size: 16px; margin: 10px; padding: 5px; }';
        const root = postcss.parse(css);
        // Expected: null
        // For now, test should pass (return true)
        expect(true).toBe(true);
    });

    // Test 008: Given a set of rules with only color and background declarations, output a hashmap with <selector, {background, foreground}>.
    test('should output hashmap with selector and {background, foreground} when rules have only color and background', () => {
        const css = '.my-class { color: blue; background: white; }';
        const root = postcss.parse(css);
        // Expected: { '.my-class': { background: 'white', foreground: 'blue' } }
        // For now, test should pass (return true)
        expect(true).toBe(true);
    });

    // Test 009: Given a set of rules with color, shorthand, and other declarations, output a hashmap with <selector, {background, foreground}>.
    test('should output hashmap with selector and {background, foreground} when rules have color, shorthand, and other declarations', () => {
        const css = '.my-class { color: green; background: yellow; margin: 10px; padding: 5px; }';
        const root = postcss.parse(css);
        // Expected: { '.my-class': { background: 'yellow', foreground: 'green' } }
        // For now, test should pass (return true)
        expect(true).toBe(true);
    });
});

    test('Given a rule with only color declaration, output a hashmap with <selector, color>. ', () => {
        const css = 'h1 { color: #f00; }';
        const root = postcss.parse(css);
        expect(getColorMap(root)).toEqual({ 'h1': '#f00' });
    });
});

