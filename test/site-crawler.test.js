/* eslint-disable no-undef */
const axios = require('axios');
const cheerio = require('cheerio');

const SiteCrawler = require('../src/site-crawler');

jest.mock('axios');

describe('SiteCrawler', () => {
  describe('defaultLibraries', () => {
    test('it has default libraries', () => {
      expect(SiteCrawler).toHaveProperty('defaultLibraries');
      expect(SiteCrawler.defaultLibraries).toHaveProperty('ajax');
      expect(SiteCrawler.defaultLibraries).toHaveProperty('dom');
    });
  });
  describe('defaultConfig', () => {
    test('it has default config info', () => {
      expect(SiteCrawler).toHaveProperty('defaultConfig');
      expect(SiteCrawler.defaultConfig).toHaveProperty('startPage', 'https://frankmtaylor.com');
      expect(SiteCrawler.defaultConfig).toHaveProperty('linkSelector', 'a[href]');
    });
  });
  describe('static getPageAsync', () => {
    test('it can get a popular url', async () => {
      const response = { data: '<DOCTYPE html><html><head></head><body></body></html>' };
      axios.mockImplementation(() => Promise.resolve(response));
      const page = await SiteCrawler.getPageAsync('https://frankmtaylor.com', axios);

      expect(page).toBeTruthy();
      expect(page).toEqual(response.data);
    });
    test('it throws an error without a url', async () => {
      await expect(async () => SiteCrawler.getPageAsync(''))
        .rejects
        .toThrowError('A url was not provided');
    });
  });
  describe('static getLinksFromMarkup', () => {
    test('it will get 3 urls from page markup', () => {
      const pageMarkup = `<DOCTYPE html><html><head></head><body>
      <a href="https://foo.bar.com">foobar</a>
      <a href="/foo/bar/baz">foobarbaz</a>
      <a href="#beep">beep</a>
      </body></html>`;
      const expectedLinks = ['https://foo.bar.com', '/foo/bar/baz', '#beep'];
      const links = SiteCrawler.getLinksFromMarkup(pageMarkup);
      expect(links).toEqual(
        expect.arrayContaining(expectedLinks),
      );
    });
    test('it will get an empty array urls from empty markup', () => {
      const pageMarkup = '<DOCTYPE html><html><head></head><body></body></html>';
      const expectedLinks = [];
      const links = SiteCrawler.getLinksFromMarkup(pageMarkup);
      expect(links).toEqual(
        expect.arrayContaining(expectedLinks),
      );
    });
    test('it will throw an error without page markup', () => {
      expect(() => SiteCrawler.getLinksFromMarkup(''))
        .toThrowError('Markup was not provided');
    });
  });
  describe('static filterPageLinks', () => {
    test('it throws without an array', () => {
      expect(() => SiteCrawler.filterPageLinks('', 'https://google.com'))
        .toThrowError('pageLinks is not an array');
    });
    test('it throws without a baseUrl', () => {
      const pageLinks = ['https://google.com', '/foo', '/foo/bar/'];
      expect(() => SiteCrawler.filterPageLinks(pageLinks))
        .toThrowError('No site origin is provided');
    });
    test('it filters out external links', () => {
      const pageLinks = ['https://google.com', '/foo', '/foo/bar'];
      const filteredLinks = SiteCrawler.filterPageLinks(pageLinks, 'https://foo.com');
      expect(filteredLinks).toEqual(
        expect.arrayContaining(['/foo', '/foo/bar']),
      );
    });
    test('it filters anchors and external links', () => {
      const pageLinks = ['https://google.com', '/foo', '/foo/bar', '#baz', '/foo#beep'];
      const filteredLinks = SiteCrawler.filterPageLinks(pageLinks, 'https://foo.com');
      expect(filteredLinks).toEqual(
        expect.arrayContaining(['/foo', '/foo/bar', '/foo#beep']),
      );
    });
  });
});
