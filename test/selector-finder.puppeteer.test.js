const { promises } = require('fs');

const fs = promises;

const PageSearchResult = require('../src/page-search-result');
const ElementSearchResult = require('../src/element-search-result');
const SelectorFinder = require('../src/selector-finder');

const timeout = 5000;
describe('getResultFromSpaPage', () => {
  const testHTMLPageName = 'test.html';
  const testHTML = '<DOCTYPE html><html><head></head><body class=".foo">foo</body></html>';
  let page;

  beforeAll(async () => {
    await fs.writeFile(testHTMLPageName, testHTML);
    page = await global.__BROWSER__.newPage();
    await page.goto(`file:///${__dirname}/../${testHTMLPageName}`);
  }, timeout);

  afterAll(async () => {
    await fs.unlink(testHTMLPageName);
  });

  test('the result is a PageSearchResult', async () => {
    const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, 'html', false);

    expect(pageSearchResult).toBeInstanceOf(PageSearchResult);
  });
  test('the pageSearchResult has stuff in it', async () => {
    const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, 'body', false);

    expect(pageSearchResult.elements.length).toBeGreaterThan(0);
    console.log(pageSearchResult.elements);
  });
}, timeout);
