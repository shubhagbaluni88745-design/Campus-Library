// test-frontend.js -- Automated Frontend E2E Test and Verification
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { start } = require('./server');
const pool = require('./db');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const STATIC_PORT = 5500;
const PUBLIC_DIR = path.join(__dirname, 'public');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Simple static HTTP server emulating VS Code Live Server
function createStaticServer() {
  return http.createServer((req, res) => {
    if (req.url === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
    };
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      }
    });
  });
}

async function runE2E() {
  console.log('=== STARTING FRONTEND E2E TEST & VERIFICATION ===\n');

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // 1. Reset database to initial state
  console.log('1. Resetting database to initial sample records...');
  await pool.query('DELETE FROM books WHERE id > 3');
  await pool.query('ALTER TABLE books AUTO_INCREMENT = 4');

  // 2. Start Apollo GraphQL Server on port 4000
  console.log('2. Starting Apollo GraphQL Server on port 4000...');
  const { server: apolloServer } = await start();

  // 3. Start static server on port 5500 (VS Code Live Server default)
  console.log('3. Starting static web server on port 5500...');
  const staticServer = createStaticServer();
  await new Promise(resolve => staticServer.listen(STATIC_PORT, resolve));
  console.log(`Static server running at http://localhost:${STATIC_PORT}/`);

  // 4. Launch Headless Chrome
  console.log('4. Launching headless Chrome browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1200, height: 900 },
  });

  const consoleErrors = [];
  try {
    const page = await browser.newPage();

    // Listen to console errors and uncaught exceptions
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('Browser Console Error:', msg.text());
      } else {
        console.log(`[Browser Console ${msg.type()}]:`, msg.text());
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.message);
      console.error('Page Error:', err.message);
    });

    // 5. Navigate to frontend
    console.log(`\n5. Navigating to http://localhost:${STATIC_PORT}/index.html ...`);
    await page.goto(`http://localhost:${STATIC_PORT}/index.html`, { waitUntil: 'networkidle0' });

    // 6. Verify page title and header
    const title = await page.title();
    console.log('Page Title:', title);
    if (title !== 'Campus Library') throw new Error(`Unexpected page title: ${title}`);

    const heading = await page.$eval('h1', el => el.textContent.trim());
    console.log('Header text:', heading);
    if (heading !== 'Campus Library') throw new Error(`Unexpected header: ${heading}`);

    // 7. Wait for author cards to load
    await page.waitForSelector('.author-card', { timeout: 10000 });
    const authorCards = await page.$$eval('.author-card h2', els => els.map(e => e.textContent.trim()));
    console.log('Authors loaded:', authorCards);
    if (!authorCards.includes('Asha Patel') || !authorCards.includes('Ravi Kumar')) {
      throw new Error('Author cards do not contain expected authors');
    }

    // 8. Verify dynamic dropdown population
    const dropdownOptions = await page.$$eval('#authorId option', opts =>
      opts.map(o => ({ value: o.value, text: o.textContent.trim(), disabled: o.disabled }))
    );
    console.log('Dynamic Author Dropdown Options:', dropdownOptions);
    const ashaOpt = dropdownOptions.find(o => o.text.includes('Asha Patel'));
    const raviOpt = dropdownOptions.find(o => o.text.includes('Ravi Kumar'));
    if (!ashaOpt || !raviOpt) {
      throw new Error('Author dropdown is not dynamically populated with GraphQL authors');
    }

    // 9. Verify initial books for Ravi Kumar
    const initialBooks = await page.$$eval('.author-card', cards => {
      return cards.map(c => {
        const name = c.querySelector('h2').textContent.trim();
        const books = Array.from(c.querySelectorAll('.book .book-title')).map(b => b.textContent.trim());
        return { name, books };
      });
    });
    console.log('Initial Authors and Books:', JSON.stringify(initialBooks, null, 2));

    // Capture before screenshot
    const beforeShot = path.join(SCREENSHOTS_DIR, 'before-mutation.png');
    await page.screenshot({ path: beforeShot, fullPage: true });
    console.log(`Saved screenshot: ${beforeShot}`);

    // 10. Fill the Add a Book form
    console.log('\n10. Submitting Add Book form with "GraphQL for Beginners", 2025, Ravi Kumar (ID: 2)...');
    await page.type('#title', 'GraphQL for Beginners');
    await page.type('#year', '2025');
    await page.select('#authorId', '2');

    // Submit form
    await page.click('#submitBtn');

    // 11. Wait for success notification
    await page.waitForSelector('.alert.alert-success', { timeout: 10000 });
    const successMsg = await page.$eval('.alert.alert-success span', el => el.textContent.trim());
    console.log('Success Alert Message:', successMsg);

    // 12. Verify form was reset
    const titleVal = await page.$eval('#title', el => el.value);
    const yearVal = await page.$eval('#year', el => el.value);
    console.log(`Form reset check: title="${titleVal}", year="${yearVal}"`);
    if (titleVal !== '' || yearVal !== '') {
      throw new Error('Form was not reset after submission');
    }

    // 13. Wait and verify that Ravi Kumar now has 2 books including "GraphQL for Beginners"
    await page.waitForFunction(() => {
      const books = Array.from(document.querySelectorAll('.book-title')).map(el => el.textContent.trim());
      return books.includes('GraphQL for Beginners');
    }, { timeout: 10000 });

    const updatedAuthors = await page.$$eval('.author-card', cards => {
      return cards.map(c => {
        const name = c.querySelector('h2').textContent.trim();
        const books = Array.from(c.querySelectorAll('.book')).map(b => b.textContent.trim());
        return { name, books };
      });
    });
    console.log('Updated Authors and Books:', JSON.stringify(updatedAuthors, null, 2));

    const raviData = updatedAuthors.find(a => a.name === 'Ravi Kumar');
    if (!raviData.books.some(b => b.includes('GraphQL for Beginners') && b.includes('(2025)'))) {
      throw new Error('New book did not appear under Ravi Kumar');
    }
    console.log('PASSED: New book appeared under Ravi Kumar.');

    // Capture after screenshot
    const afterShot = path.join(SCREENSHOTS_DIR, 'after-mutation.png');
    await page.screenshot({ path: afterShot, fullPage: true });
    console.log(`Saved screenshot: ${afterShot}`);

    // 14. Verify in MySQL directly
    console.log('\n14. Verifying record directly in MySQL...');
    const [dbRows] = await pool.query('SELECT title, year FROM books WHERE author_id = 2');
    console.log('SELECT title, year FROM books WHERE author_id = 2:');
    console.table(dbRows);
    const foundInDb = dbRows.some(r => r.title === 'GraphQL for Beginners' && r.year === 2025);
    if (!foundInDb) {
      throw new Error('New book not found in MySQL for author_id = 2');
    }
    console.log('PASSED: Record confirmed in MySQL database.');

    // 15. Check console errors
    console.log('\n15. Checking browser console errors...');
    if (consoleErrors.length > 0) {
      throw new Error(`Browser console errors detected: ${consoleErrors.join(', ')}`);
    }
    console.log('PASSED: Zero browser console errors.');

    console.log('\n=== ALL FRONTEND E2E TESTS COMPLETED AND VERIFIED SUCCESSFULLY! ===\n');

  } finally {
    await browser.close();
    staticServer.close();
    await apolloServer.stop();
    await pool.end();
  }
}

runE2E().then(() => {
  console.log('Frontend test execution completed successfully.');
}).catch(async err => {
  console.error('\n❌ Frontend test failed:', err);
  try { await pool.end(); } catch (_) {}
  process.exit(1);
});
