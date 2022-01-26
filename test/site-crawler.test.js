/* eslint-disable no-undef */
const axios = require('axios');
const cheerio = require('cheerio');

const SiteCrawler = require('../src/site-crawler');

jest.mock('axios');

const MOCK_DATA = {
  default: '<DOCTYPE html><html><head></head><body></body></html>',
  portfolio: `<DOCTYPE html><html><head></head><body>
        <ul class="g-nav__list">
        <li class="g-nav__listItem">
            <a href="/portfolio" class="g-nav__listItemLink">Portfolio</a>
        </li>
        <li class="g-nav__listItem">
            <a href="/work-history" class="g-nav__listItemLink">Work History</a>
        </li>
        <li class="g-nav__listItem">
            <a href="/technologies" class="g-nav__listItemLink">Technologies</a>
        </li>
        <li class="g-nav__listItem">
            <a href="/foreign-languages.html" class="g-nav__listItemLink">Foreign Languages</a>
        </li>
        <li class="g-nav__listItem">
            <a href="/education.html" class="g-nav__listItemLink">Education</a>
        </li>
        </ul>
        <a class="portfolio__sectionLink" href="/portfolio/css.html"> 
        <a class="list__itemLink icon" href="http://stackoverflow.com/story/paceaux">Stack Overflow</a>
              </body></html>`,
  fullyQualified: `<DOCTYPE html><html><head></head><body>
        <ul class="g-nav__list">
        <li class="g-nav__listItem">
            <a href="https://frankmtaylor.com/portfolio" class="g-nav__listItemLink">Portfolio</a>
        </li>
        <li class="g-nav__listItem">
            <a href="https://frankmtaylor.com/work-history" class="g-nav__listItemLink">Work History</a>
        </li>
        <li class="g-nav__listItem">
            <a href="https://frankmtaylor.com/technologies" class="g-nav__listItemLink">Technologies</a>
        </li>
        <li class="g-nav__listItem">
            <a href="https://frankmtaylor.com/foreign-languages.html" class="g-nav__listItemLink">Foreign Languages</a>
        </li>
        <li class="g-nav__listItem">
            <a href="https://frankmtaylor.com/education.html" class="g-nav__listItemLink">Education</a>
        </li>
        </ul>
        <a class="portfolio__sectionLink" href="/portfolio/css.html"> 
        <a class="list__itemLink icon" href="http://stackoverflow.com/story/paceaux">Stack Overflow</a>
              </body></html>`,
};

axios.mockImplementation((url) => {
  switch (url) {
    case 'https://frankmtaylor.com/portfolio/':
      return Promise.resolve({
        data: MOCK_DATA.portfolio,
      });
    case 'https://frankmtaylor.com/qualified/':
      return Promise.resolve({
        data: MOCK_DATA.fullyQualified,
      });
    default:
      return Promise.resolve({ data: MOCK_DATA.default });
  }
});

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
      const page = await SiteCrawler.getPageAsync('https://default.com', axios);

      expect(page).toBeTruthy();
      expect(page).toEqual(MOCK_DATA.default);
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
    test('it removes unique links', () => {
      const pageLinks = ['https://google.com', '/foo', '/foo', '/foo', '/foo/bar', '#baz', '/foo#beep'];
      const filteredLinks = SiteCrawler.filterPageLinks(pageLinks, 'https://foo.com');
      expect(filteredLinks).toEqual(
        expect.arrayContaining(['/foo', '/foo/bar', '/foo#beep']),
      );
    });
  });
  describe('getLinksFromPageAsync', () => {
    const siteCrawler = new SiteCrawler({ startPage: 'https://frankmtaylor.com' }, { ajax: axios });
    test('it gets relative links and ignores external links', async () => {
      const pageLinks = await siteCrawler.getLinksFromPageAsync('https://frankmtaylor.com/portfolio/');
      expect(pageLinks).toBeTruthy();
      expect(pageLinks).toEqual(
        expect.arrayContaining([
          '/portfolio',
          '/work-history',
          '/technologies',
          '/foreign-languages.html',
          '/education.html',
          '/portfolio/css.html',
        ]),
      );
    });
    test('it fully qualified links and ignores external links', async () => {
      const pageLinks = await siteCrawler.getLinksFromPageAsync('https://frankmtaylor.com/qualified/');
      expect(pageLinks).toBeTruthy();
      expect(pageLinks).toEqual(
        expect.arrayContaining([
          'https://frankmtaylor.com/portfolio',
          'https://frankmtaylor.com/work-history',
          'https://frankmtaylor.com/technologies',
          'https://frankmtaylor.com/foreign-languages.html',
          'https://frankmtaylor.com/education.html',
          '/portfolio/css.html',
        ]),
      );
    });
  });
});
