const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const os = require('os');

const OUTPUT_DIR = path.join(__dirname, 'output');
const DESKTOP = path.join(os.homedir(), 'Desktop');
const FILENAME = 'Tabiken_Phrasebook_CafeCounterService_001.pdf';

const SLIDES = [
  'cover.html',     'howto.html',
  'phrase-01.html', 'roleplay-01.html',
  'phrase-02.html', 'roleplay-02.html',
  'phrase-03.html', 'roleplay-03.html',
  'phrase-04.html', 'roleplay-04.html',
  'phrase-05.html', 'roleplay-05.html',
  'phrase-06.html', 'roleplay-06.html',
  'phrase-07.html', 'roleplay-07.html',
  'phrase-08.html', 'roleplay-08.html',
  'phrase-09.html', 'roleplay-09.html',
  'phrase-10.html', 'roleplay-10.html',
  'cta.html',
];

(async () => {
  console.log('ENGLEAD PDF Generator');
  console.log('=====================\n');
  console.log('Launching browser...');

  const browser = await puppeteer.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  const pdfBuffers = [];

  for (var i = 0; i < SLIDES.length; i++) {
    var file = SLIDES[i];
    var url = 'file://' + path.join(OUTPUT_DIR, file);

    process.stdout.write('[' + (i + 1) + '/' + SLIDES.length + '] ' + file + ' ... ');

    await page.goto(url, { waitUntil: 'load' });

    await page.addStyleTag({
      content: 'body { background: #fff !important; padding: 0 !important; margin: 0 !important; } .page { box-shadow: none !important; margin: 0 !important; }'
    });

    var pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    pdfBuffers.push(pdf);
    console.log('OK');
  }

  await browser.close();

  console.log('\nMerging ' + SLIDES.length + ' pages...');
  var mergedPdf = await PDFDocument.create();

  for (var j = 0; j < pdfBuffers.length; j++) {
    var doc = await PDFDocument.load(pdfBuffers[j]);
    var pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    pages.forEach(function(p) { mergedPdf.addPage(p); });
  }

  var outPath = path.join(DESKTOP, FILENAME);
  fs.writeFileSync(outPath, await mergedPdf.save());

  console.log('\n✓  ' + FILENAME + ' をデスクトップに保存しました。');
})();
