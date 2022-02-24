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
  test('it can set a sitemap', async () => {
    const siteCrawler = new SiteCrawler({ startPage: 'http://frankmtaylor.com/sitemap.xml' });

    await siteCrawler.setSitemap();
    expect(siteCrawler.urlset.length).toBeGreaterThan(12);
    console.log(siteCrawler.urlset);
  });
  test.skip('it can produce siteLinks:false, which is a sitemap', async () => {
    const siteCrawler = new SiteCrawler({ startPage: 'http://frankmtaylor.com/sitemap.xml' });

    await siteCrawler.produceSiteLinks(false);
    expect(siteCrawler.urlset.length).toBeGreaterThan(12);
    console.log(siteCrawler.urlset);
  });
  test('it can produce siteLinks:true, which is a crawl', async () => {
    const siteCrawler = new SiteCrawler({ startPage: 'http://frankmtaylor.com/sitemap.xml' });

    await siteCrawler.produceSiteLinks(false);
    expect(siteCrawler.urlset.length).toBeGreaterThan(12);
    console.log(siteCrawler.urlset);
  });
});
