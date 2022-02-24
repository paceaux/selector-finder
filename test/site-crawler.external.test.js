const axios = require('axios');

const SiteCrawler = require('../src/site-crawler');

describe('SiteCrawler External', () => {
  test('it crawls a site and collects all of the links', async () => {
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
    const siteCrawler = new SiteCrawler({ startPage: 'http://frankmtaylor.com/sitemap.xml' });

    const sitemapJson = await siteCrawler.getSitemapAsync();
    expect(sitemapJson).toHaveProperty('urlset');
  });
});
