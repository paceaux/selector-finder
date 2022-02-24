const axios = require('axios');

const SiteCrawler = require('../src/site-crawler');

describe('SiteCrawler External', () => {
  test.skip('it crawls a site and collects all of the links', async () => {
    const siteCrawler = new SiteCrawler({ startPage: 'https://frankmtaylor.com' });
    await siteCrawler.crawlSiteAsync();
    expect(siteCrawler.urlset.length).toBeGreaterThan(12);
    expect(siteCrawler.urlset).toContainEqual(
      {
        loc: 'https://frankmtaylor.com/technologies/content-management.html',
      },
    );
  });
  test('it can get a sitemap', async () => {
    const siteCrawler = new SiteCrawler();

    const sitemapJson = await siteCrawler.getSitemapAsync('https://frankmtaylor.com/sitemap.xml');
    expect(sitemapJson).toBeTruthy();
    expect(sitemapJson).toHaveProperty('urlset');
    expect(sitemapJson.urlset).toHaveProperty('url');
    console.log(sitemapJson);
  });
  test('it can get links from a sitemap', async () => {
    const siteCrawler = new SiteCrawler();

    const siteMapJson = await siteCrawler.getSitemapAsync('https://frankmtaylor.com/sitemap.xml');
    const sitemapLinks = SiteCrawler.getLinksFromSitemap(siteMapJson);
    expect(sitemapLinks).toBeInstanceOf(Array);
    expect(sitemapLinks.length).toBeGreaterThan(0);
    console.log(sitemapLinks);
  });
  test.skip('it crawls a site and collects all of the links', async () => {
    const siteCrawler = new SiteCrawler({ startPage: 'https://blog.frankmtaylor.com' });
    await siteCrawler.crawlSiteAsync();
    expect(siteCrawler.urlset.length).toBeGreaterThan(12);
  });
  test.skip('it crawls a site and collects all of the links', async () => {
    const siteCrawler = new SiteCrawler({ startPage: 'https://blog.frankmtaylor.com' });
    await siteCrawler.crawl();
    expect(siteCrawler.urlset.length).toBeGreaterThan(12);
  });
});
