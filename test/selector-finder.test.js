/* eslint-disable no-undef */
import { jest } from '@jest/globals';
import cheerio from 'cheerio';

import PageSearchResult from '../src/page-search-result.js';
import ElementSearchResult from '../src/element-search-result.js';
import SelectorFinder from '../src/selector-finder.js';

const axios = await import('axios');
jest.unstable_mockModule('axios', () => axios);
describe('SelectorFinder', () => {
  beforeEach(() => {
  });
  describe('defaultLibraries', () => {
    test('it has default libraries', () => {
      expect(SelectorFinder).toHaveProperty('defaultLibraries');
      expect(SelectorFinder.defaultLibraries).toHaveProperty('ajax');
      expect(SelectorFinder.defaultLibraries).toHaveProperty('dom');
      expect(SelectorFinder.defaultLibraries).toHaveProperty('emulator');
    });
  });
  describe('getResultFromStaticPage', () => {
    test('the result is a PageSearchResult', async () => {
      jest.mock('../src/page-search-result');
      const response = { data: '<DOCTYPE html><html><body></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', 'body');

      expect(pageSearchResult).toBeInstanceOf(PageSearchResult);
    });
    test('the pageSearchResult will have elements, url, usedSelectors', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', 'body');

      expect(pageSearchResult).toHaveProperty('elements');
      expect(pageSearchResult).toHaveProperty('url');
      expect(pageSearchResult).toHaveProperty('usedSelectors');
    });
    test('the elements in pageSearchResult will be ElementSearchResult', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body class="boo"></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', 'body');
      const { elements } = pageSearchResult;
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0]).toBeInstanceOf(ElementSearchResult);
    });
    test('elementSearchResult has tag, attributes, innertext, selector', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body class="boo">body text</body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', 'body');
      const { elements } = pageSearchResult;
      const [element] = elements;
      expect(element).toHaveProperty('tag', 'body');
      expect(element).toHaveProperty('attributes');
      expect(element).toHaveProperty('innerText', 'body text');
      expect(element).toHaveProperty('selector', 'body');
      expect(element.attributes).toHaveProperty('class', 'boo');
    });
    test('elementSearchResult has will not show attributes if they are not present', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', 'body');
      const { elements } = pageSearchResult;
      expect(elements[0].attributes).toBeUndefined();
    });
    test('a single interactive pseudo class will be null', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', ':hover');
      expect(pageSearchResult).toBeNull();
    });
  });
  describe('multipleSelectors', () => {
    test('it will get us results with a comma-separated selector', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body><h1>Foo</h1><h2>bar</h2></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', 'html,body');
      const { elements } = pageSearchResult;
      expect(elements).toHaveLength(2);
    });
    test('comma separated selector gets the elements we chose', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body><h1>Foo</h1><h2>bar</h2></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', 'html,body');
      const { elements } = pageSearchResult;
      const [first, second] = elements;
      expect(first.tag).toEqual('html');
      expect(second.tag).toEqual('body');
    });
    test('getResultFromStaticPage can accept an array as a selector', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body class="boo"></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', ['html', 'body']);
      const { elements } = pageSearchResult;
      expect(elements).toHaveLength(2);
    });
    test('getResultFromStaticPage is null if nothing at all is found', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body class="boo"></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', ['foo', 'bar']);
      expect(pageSearchResult).toBeNull();
    });
    test('getResultFromStaticPage will have unused selectors if some are found', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body class="boo"></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', ['.boo', 'bar']);

      expect(pageSearchResult).toHaveProperty('unusedSelectors');
      expect(pageSearchResult.unusedSelectors).toHaveLength(1);
    });
    // NOTE: Cheerio throw an error on :focus, not :hober or :active
    test('an interactive pseudo class will beget a selectorErrors property', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body></body></html>' };
      const selectorFinder = new SelectorFinder({}, { ajax: axios, dom: cheerio });
      axios.mockImplementation(() => Promise.resolve(response));
      const pageSearchResult = await selectorFinder.getResultFromStaticPage('http://google.com', ['body', ':hover', ':focus', ':active']);
      expect(pageSearchResult).toHaveProperty('selectorErrors');
      expect(pageSearchResult.selectorErrors).toHaveLength(1);
    });
  });
});
