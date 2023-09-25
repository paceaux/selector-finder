/* eslint-disable no-undef */

import fs from 'fs/promises';

import axios from './__mock__/axios.js';
import SiteCrawler from '../src/site-crawler.js';

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
  workHistory: `<DOCTYPE html><html><head></head><body>
    <a href="/work-history/exlrt.html">EXLRT</a>
    <a href="/work-history/tahzoo.html">EXLRT</a>
    </body></html>`,
  sitemap: `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
    <loc>http://frankmtaylor.com/401.html</loc>
    <lastmod>2022-01-06T16:36:33.516Z</lastmod>
    <changefreq>monthly</changefreq>
    </url>
    <url>
    <loc>http://frankmtaylor.com/403.html</loc>
    <lastmod>2022-01-06T16:36:33.618Z</lastmod>
    <changefreq>monthly</changefreq>
    </url>
    <url>
    <loc>http://frankmtaylor.com/500.html</loc>
    <lastmod>2022-01-06T16:36:33.664Z</lastmod>
    <changefreq>monthly</changefreq>
    </url>
    <url>
    <loc>http://frankmtaylor.com/colophon.html</loc>
    <lastmod>2022-01-06T16:36:33.721Z</lastmod>
    <changefreq>monthly</changefreq>
    </url>
    <url>
    <loc>http://frankmtaylor.com/education.html</loc>
    <lastmod>2022-01-06T16:36:33.726Z</lastmod>
    <changefreq>monthly</changefreq>
    </url>
    <url>
    <loc>http://frankmtaylor.com/foreign-languages.html</loc>
    <lastmod>2022-01-06T16:36:33.729Z</lastmod>
    <changefreq>monthly</changefreq>
    </url>
    <url>
    <loc>http://frankmtaylor.com/</loc>
    <lastmod>2022-01-06T16:36:33.735Z</lastmod>
    <changefreq>monthly</changefreq>
    </url>
    </urlset>
    `,
};

axios.mockImplementation((url) => {
  switch (url) {
    case 'https://frankmtaylor.com/sitemap.xml':
      return Promise.resolve({
        data: MOCK_DATA.sitemap,
      });
    case 'https://frankmtaylor.com/portfolio/':
      return Promise.resolve({
        data: MOCK_DATA.portfolio,
      });
    case 'https://frankmtaylor.com/work-history/':
      return Promise.resolve({
        data: MOCK_DATA.workHistory,
      });
    case 'https://frankmtaylor.com/work-history/exlrt.html':
      return Promise.resolve({
        data: MOCK_DATA.portfolio,
      });
    case 'https://frankmtaylor.com/work-history/tahzoo.html':
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

afterAll(async () => {
  await fs.promises.unlink('frankmtaylor.com.sitemap.json');
});

describe('getting file', () => {
  const siteCrawler = new SiteCrawler();
  siteCrawler.libraries.ajax = axios;


  test('getFileAsync', async () => {
    const result = await siteCrawler.getFileAsync('https://frankmtaylor.com/qualified/');

    expect(result).toEqual(MOCK_DATA.fullyQualified);
  });
});
describe('SiteCrawler:Crawling', () => {
  describe('defaultLibraries', () => {
    test('it has default libraries', () => {
      expect(SiteCrawler).toHaveProperty('defaultLibraries');
      expect(SiteCrawler.defaultLibraries).toHaveProperty('ajax');
      expect(SiteCrawler.defaultLibraries).toHaveProperty('dom');
      expect(SiteCrawler.defaultLibraries).toHaveProperty('Parser');
    });
  });
  describe('defaultConfig', () => {
    test('it has default config info', () => {
      expect(SiteCrawler).toHaveProperty('defaultConfig');
      expect(SiteCrawler.defaultConfig).toHaveProperty('startPage', 'https://frankmtaylor.com');
      expect(SiteCrawler.defaultConfig).toHaveProperty('linkSelector', 'a[href]');
      expect(SiteCrawler.defaultConfig).toHaveProperty('shouldCrawl', false);
      expect(SiteCrawler.defaultConfig).toHaveProperty('useExportedSitemap', true);
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
  describe('getters', () => {
    const siteCrawler = new SiteCrawler();
    siteCrawler.libraries.ajax = axios;
    test('it has an origin', () => {
      expect(siteCrawler.origin).toEqual('https://frankmtaylor.com');
    });
    test('it has an host', () => {
      expect(siteCrawler.host).toEqual('frankmtaylor.com');
    });
    test('exportFileName', () => {
      expect(siteCrawler.exportFileName).toEqual('frankmtaylor.com');
    });
    test('pathToExportedFile', () => {
      expect(siteCrawler.pathToExportedFile).toEqual(`${process.cwd()}/frankmtaylor.com.sitemap.json`);
    });
    test('hasExportedLinks', () => {
      expect(siteCrawler.hasExportedLinks).toEqual(false);
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
  describe('links and urls', () => {
    test('it has a linkSet when instantiated', () => {
      const siteCrawler = new SiteCrawler();
      expect(siteCrawler).toHaveProperty('linkSet');
      expect(siteCrawler.linkSet).toHaveProperty('size', 0);
    });
    test('it has a urlset', () => {
      const siteCrawler = new SiteCrawler();
      expect(siteCrawler).toHaveProperty('urlset');
      expect(siteCrawler.urlset).toHaveProperty('length', 0);
    });
    test('a urlset is an array of objects mapped from linkset vals', () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://foo.com' });
      siteCrawler.linkSet.add('/bar');
      expect(siteCrawler.urlset).toHaveProperty('length', 1);
    });
    test('the urlset\'s objects have fully qualified urls when linkset has relative ones', () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://foo.com' });
      siteCrawler.linkSet.add('/bar');
      expect(siteCrawler.urlset).toHaveProperty('length', 1);
      expect(siteCrawler.urlset[0]).toHaveProperty('loc', 'https://foo.com/bar');
    });
    test('the urlset\'s objects don\'t change when given fully qualified urls', () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://foo.com' });
      siteCrawler.linkSet.add('https://foo.com/bar');
      expect(siteCrawler.urlset).toHaveProperty('length', 1);
      expect(siteCrawler.urlset[0]).toHaveProperty('loc', 'https://foo.com/bar');
    });
    test('multiple links can be added at once', () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://foo.com' });
      siteCrawler.linkSet.add('/bar');
      siteCrawler.addLinks(['/baz', '/boop']);
      expect(siteCrawler.linkSet.size).toEqual(3);
    });
  });
  describe('crawlPage', () => {
    test('it crawls a page and adds links from that page', async () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://frankmtaylor.com' }, { ajax: axios });
      await siteCrawler.crawlPageAsync('https://frankmtaylor.com/portfolio/');
      expect(siteCrawler.urlset.length).toEqual(6);
      expect(siteCrawler.urlset).toEqual(
        expect.arrayContaining([
          {
            loc: 'https://frankmtaylor.com/portfolio',
          },
          {
            loc: 'https://frankmtaylor.com/work-history',
          },
          {
            loc: 'https://frankmtaylor.com/technologies',
          },
          {
            loc: 'https://frankmtaylor.com/foreign-languages.html',
          },
          {
            loc: 'https://frankmtaylor.com/education.html',
          },
          {
            loc: 'https://frankmtaylor.com/portfolio/css.html',
          },
        ]),
      );
    });
  });
  describe('crawlSiteAsync', () => {
    test('it crawls a mock site and collects all of the links', async () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://frankmtaylor.com' });
      siteCrawler.libraries.ajax = axios;

      await siteCrawler.crawlSiteAsync('https://frankmtaylor.com/work-history/');
      expect(siteCrawler.urlset.length).toEqual(8);
    });
  });
  describe('crawl', () => {
    test('it crawls a mock site and collects all of the links', async () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://frankmtaylor.com' });
      siteCrawler.libraries.ajax = axios;

      await siteCrawler.crawlSiteAsync('https://frankmtaylor.com/work-history/');
      expect(siteCrawler.urlset.length).toEqual(8);
    });
    test.skip('it crawls the site, collects links, produces a file', async () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://frankmtaylor.com' });
      await siteCrawler.crawlSiteAsync('https://frankmtaylor.com/work-history/');
      expect();
    });
  });
});
describe('SiteCrawler: Fetching Sitemap', () => {
  describe('getSitemap', () => {
    test('getSitemapAsync', async () => {
      const siteCrawler = new SiteCrawler();

      const sitemapJson = await siteCrawler.getSitemapAsync('https://frankmtaylor.com/sitemap.xml');
      expect(sitemapJson).toBeTruthy();
      expect(sitemapJson).toHaveProperty('urlset');
      expect(sitemapJson.urlset).toHaveProperty('url');
    });
  });
  describe('static getLinks', () => {
    test('it will create an array from a json object', async () => {
      const siteCrawler = new SiteCrawler();
      siteCrawler.libraries.ajax = axios;
      const siteMapJson = await siteCrawler.getSitemapAsync('https://frankmtaylor.com/sitemap.xml');
      const sitemapLinks = SiteCrawler.getLinksFromSitemap(siteMapJson);
      expect(sitemapLinks).toBeInstanceOf(Array);
      expect(sitemapLinks.length).toEqual(7);
    });
  });
  describe('setSitemap', () => {
    test('The linkSet will have the same links from sitemap', async () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://frankmtaylor.com/sitemap.xml' });
      siteCrawler.libraries.ajax = axios;

      await siteCrawler.setSitemap();
      expect(siteCrawler.linkSet.size).toEqual(7);
    });
    test('the urlSet will have the same links from sitemap', async () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://frankmtaylor.com/sitemap.xml' });
      siteCrawler.libraries.ajax = axios;

      await siteCrawler.setSitemap();
      expect(siteCrawler.urlset.length).toEqual(7);
    });
  });
  describe('produceSiteLinks', () => {
    test('when produceSiteLinks is run, a file is created and it knows it, and still has data', async () => {
      const siteCrawler = new SiteCrawler({ startPage: 'https://frankmtaylor.com/sitemap.xml' });
      await siteCrawler.produceSiteLinks();
      expect(siteCrawler.hasExportedLinks).toEqual(true);
      expect(siteCrawler.linkSet.size).toBeGreaterThan(0);
      expect(siteCrawler.linkSet.has('http://frankmtaylor.com'));
    });
  });
});
