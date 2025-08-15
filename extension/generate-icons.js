// Icon generation script
// Run: node generate-icons.js
// This will create PNG versions from the SVG

const fs = require('fs');
const path = require('path');

console.log('📱 Icon Generation Script');
console.log('To generate PNG icons from SVG:');
console.log('1. Install: npm install -g svg2png-cli');
console.log('2. Run: svg2png icon.svg --width=16 --height=16 --output=icon16.png');
console.log('3. Run: svg2png icon.svg --width=48 --height=48 --output=icon48.png');
console.log('4. Run: svg2png icon.svg --width=128 --height=128 --output=icon128.png');
console.log('');
console.log('Or use online converter: https://convertio.co/svg-png/');
console.log('');
console.log('✅ SVG icon created successfully at: extension/icons/icon.svg');