const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  try {
    await page.goto('http://localhost:3001/dashboard/validate/6a104ad1-9922-42b3-aa96-20ae41f16f82', { waitUntil: 'networkidle0' });
  } catch (err) {
    console.log('GOTO ERROR:', err.message);
  }
  await browser.close();
})();
