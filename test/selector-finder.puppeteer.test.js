/**
 * @jest-environment ./test/config/puppeteer_environment.js
 */
import { promises } from 'fs';
import { fileURLToPath } from 'url';

import PageSearchResult from '../src/page-search-result.js';
import ElementSearchResult from '../src/element-search-result.js';
import SelectorFinder from '../src/selector-finder.js';

const fs = promises;
// eslint-disable-next-line no-underscore-dangle
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const timeout = 5000;
describe('getResultFromSpaPage', () => {
  const testHTMLPageName = 'test.html';
  const testHTML = '<DOCTYPE html><html><head></head><body class="boo"><p class="this"></p><p class="that"></p></body></html>';
  let page;

  beforeAll(async () => {
    await fs.writeFile(testHTMLPageName, testHTML);
    // eslint-disable-next-line no-underscore-dangle
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
  test('a single interactive pseudo class will be null', async () => {
    const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, ':hover', false);

    expect(pageSearchResult).toBeNull();
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
    test('an interactive pseudo class will NOT beget a selectorErrors property', async () => {
      const pageSearchResult = await SelectorFinder.getResultFromSpaPage(page, ['body', ':hover', ':focus', ':active'], false);

      expect(pageSearchResult).not.toHaveProperty('selectorErrors');
    });
  });
}, timeout);
