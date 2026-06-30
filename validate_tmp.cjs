const { parse } = require('@babel/parser');
const fs = require('fs');
const files = [
  'resources/js/Pages/WhatIsIncluded.jsx',
  'resources/js/Pages/TermsOfService.jsx',
  'resources/js/Pages/PrivacyPolicy.jsx',
  'resources/js/Pages/Marketing/Shared/MarketingLayout.jsx',
  'resources/js/Pages/LandingPage.jsx',
  'resources/js/Pages/Marketing/Features.jsx',
  'resources/js/Pages/Marketing/Pricing.jsx',
  'resources/js/Pages/Marketing/About.jsx',
  'resources/js/Pages/Marketing/DigitalProducts.jsx',
  'tailwind.config.js',
];
let fail = 0;
for (const f of files) {
  try {
    const code = fs.readFileSync(f, 'utf8');
    parse(code, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'dynamicImport'] });
    console.log('OK   ' + f);
  } catch (e) {
    fail++;
    console.log('FAIL ' + f + '  ->  ' + e.message);
  }
}
process.exit(fail ? 1 : 0);
