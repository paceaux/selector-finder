const { promises } = require('fs');

const fs = promises;

const PageSearchResult = require('../src/page-search-result');
const ElementSearchResult = require('../src/element-search-result');
const SelectorFinder = require('../src/selector-finder');

const timeout = 5000;
describe('getResultFromSpaPage', () => {
  const testHTMLPageName = 'test.html';
  const testHTML = '<DOCTYPE html><html><head></head><body class="boo"><p class="this"></p><p class="that"></p></body></html>';
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
  test('the pageSearchResult will have elements and a url', async () => {
    const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, 'html', false);

    expect(pageSearchResult).toHaveProperty('elements');
    expect(pageSearchResult).toHaveProperty('url');
  });
  test('the elements in pageSearchResult will be ElementSearchResult', async () => {
    const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, 'body', false);

    expect(pageSearchResult.elements.length).toBeGreaterThan(0);
    expect(pageSearchResult.elements[0]).toBeInstanceOf(ElementSearchResult);
  });
  test('the elementSearchResult has tag, attributes, innerText, selector', async () => {
    const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, 'body', false);
    const { elements } = pageSearchResult;
    const [element] = elements;

    expect(element).toHaveProperty('tag', 'body');
    expect(element).toHaveProperty('attributes');
    expect(element).toHaveProperty('innerText');
    expect(element).toHaveProperty('selector', 'body');
    expect(element.attributes).toHaveProperty('class', 'boo');
  });
  test('the elementSearchResult wil not show attributes if they are not present', async () => {
    const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, 'html', false);
    const { elements } = pageSearchResult;
    const [element] = elements;

    expect(element.attributes).toBeUndefined();
  });
  test('the pageSearchResult has ElementSearchResults', async () => {
    const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, 'p', false);
    const [el1, el2] = pageSearchResult.elements;
    expect(el1).toHaveProperty('tag', 'p');
    expect(el2).toHaveProperty('tag', 'p');
    expect(el1).toHaveProperty('attributes');
  });
  describe('multipleSelectors', () => {
    test('it will get us results with a comma-separated selector', async () => {
      const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, 'html, body', false);
      const { elements } = pageSearchResult;
      expect(elements).toHaveLength(2);
    });
    test('comma separated selector gets the elements we chose', async () => {
      const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, 'html, body', false);
      const { elements } = pageSearchResult;
      const [first, second] = elements;
      expect(first.tag).toEqual('html');
      expect(second.tag).toEqual('body');
    });
    test('getResultFromSpaPage can accept an array as a selector', async () => {
      const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, ['html', 'body'], false);
      const { elements } = pageSearchResult;
      expect(elements).toHaveLength(2);
    });
    test('getResultFromSpaPage is null if nothing at all is found', async () => {
      const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, ['foo', 'bar'], false);

      expect(pageSearchResult).toBeNull();
    });
    test('getResultFromSpaPage will have unused selectors if some are found', async () => {
      const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, ['html', 'bar'], false);

      expect(pageSearchResult).toHaveProperty('unusedSelectors');
      expect(pageSearchResult.unusedSelectors).toHaveLength(1);
    });
  });
}, timeout);
