const axios = require('axios');
const cheerio = require('cheerio');
const { Parser } = require('xml2js');
const puppeteer = require('puppeteer');

const { LOG_FILE_NAME } = require('./constants');
const { forEachAsync } = require('./utils');
const Log = require('./logger');
const { SiteSearchResult, PageSearchResult, ElementSearchResult } = require('./site-results');

const log = new Log(LOG_FILE_NAME);

const DEFAULT_LIBRARIES = {
  ajax: axios,
  dom: cheerio,
  Parser,
  emulator: puppeteer,
};
class SelectorFinder {
  constructor(config, libraries) {
    this.config = config;
    this.libraries = { ...SelectorFinder.defaultLibraries, ...libraries };
  }

  static get defaultLibraries() {
    return DEFAULT_LIBRARIES;
  }

  /**
   * @description makes an ajax request for a url
   * @param  {string} url
   *
   * @returns {object} Result of the request
   */
  async getFileAsync(url) {
    let result = null;
    try {
      const { data } = await this.libraries.ajax(url);
      result = data;
    } catch (getFileError) {
      await log.errorToFileAsync(getFileError);
    }
    return result;
  }

  /**
     * @description Gets an XML Sitemap
     * @param  {string} sitemapUrl fully qualified url
     *
     * @returns {object} parsed xml
     *
     */
  async getSitemapAsync(sitemapUrl) {
    let parsedXml = null;
    try {
      const data = await this.getFileAsync(sitemapUrl);
      const parser = new this.libraries.Parser();

      parsedXml = await parser.parseStringPromise(data);
    } catch (getSitemapError) {
      await log.errorToFileAsync(getSitemapError);
    }
    return parsedXml;
  }

  static async grabScreenAsync(element, fileName) {
    try {
      // logo is the element you want to capture
      await element.screenshot({
        path: `${fileName}.png`,
      }); // Close the browser
    } catch (screenGrabError) {
      await log.errorToFileAsync(screenGrabError);
    }
  }

  /**
     * @typedef SelectorResult
     * @param {string} tag tag name of element
     * @param {object} attributes all attributes on element
     * @param {string} innerText innerText of element
     */
  /**
     * @typedef PageResult
     * @param {string} url url of the page
     * @param {number} totalMatches
     * @param {Array<SelectorResult>} innerText innerText of element
     */

  /**
     * @description Gets result from Cheeri
     * @param  {string} url
     * @param  {} selector
     *
     * @returns {PageResult|null}
     */
  async getResultFromStaticPage(url, selector) {
    let pageSearchResult = null;
    const { data } = await this.libraries.ajax(url);
    const $ = cheerio.load(data);
    const nodes = $(selector);

    if (nodes.length > 0) {
      pageSearchResult = new PageSearchResult(url);
      pageSearchResult.addElementSearchResults(nodes);
    }

    return pageSearchResult;
  }

  /**
     * @param  {Object} page Puppeteer Page Object
     * @param  {string} selector
     * @param  {boolean} takeScreenshots
     *
     * @returns {PageResult|null}
     */
  static async getResultFromSpaPage(page, selector, takeScreenshots) {
    const elements = await page.$$(selector);
    const url = page.url();
    let result = null;

    try {
      if (elements.length > 0) {
        const puppeteerNodes = await page.$$eval(selector, (pupEls) => [...pupEls].map((pupEl) => {
          const attributes = {};

          for (let idx = 0; idx < pupEl.attributes.length; idx += 1) {
            const { name, value } = pupEl.attributes.item(idx);
            attributes[name] = value;
          }
          return {
            tag: pupEl.localName,
            attributes,
            innerText: pupEl.innerText,
          };
        }));

        result = {
          url,
          totalMatches: elements.length,
          elements: puppeteerNodes,
        };

        if (takeScreenshots) {
          await forEachAsync(elements, async (element, index) => {
            let fileName = `${url}-${index}`;
            fileName = fileName.replace('https://', '').replace('/', '-').replace('.', 'dot');
            await SelectorFinder.grabScreenAsync(element, fileName);
          });
        }
      }
    } catch (puppeteerError) {
      await log.errorToFileAsync(puppeteerError);
    }
    return result;
  }

  /**
     * @typedef SearchPageResult
     * @property {string} url Url of the page with a result
     * @property {number} totalMatches total number of matches
     * @property {<SelectorSearchResult>} elements a cheerio object with the results
     */

  /**
     * @description searches a single url for a selector
     * @param  {string} url
     * @param  {string} selector a valid css selector
     * @param  {Object} browser puppeteer browser object
     *
     * @returns {null|SearchPageResult}
     */
  async searchPageAsync(url, selector, browser, takeScreenshots) {
    let pageSearchResult = null;

    if (!url || !selector) {
      await log.errorToFileAsync(new Error('Tried to search on a page with invalid url or selector'));
      return pageSearchResult;
    }

    try {
      if (!browser) {
        pageSearchResult = await this.getResultFromStaticPage(url, selector);
      } else {
        const page = await browser.newPage(); // Open new page
        await page.goto(url);

        pageSearchResult = await SelectorFinder
          .getResultFromSpaPage(page, selector, takeScreenshots);
        await page.close(); // Close the website
      }
    } catch (searchPageError) {
      await log.errorToFileAsync(searchPageError);
    }

    return pageSearchResult;
  }

  async searchPagesAsync(sitemapJson, selector, browser, takeScreenshots) {
    const results = new SiteSearchResult();

    try {
      await forEachAsync(sitemapJson, async (sitemapObj) => {
        const result = await this
          .searchPageAsync(
            sitemapObj.loc[0],
            selector,
            browser,
            takeScreenshots,
          );
        if (result) {
          const { url, totalMatches, elements } = result;
          results.push({ url, totalMatches, elements });
        }
      });
    } catch (iteratePagesError) {
      await log.errorToFileAsync(iteratePagesError);
    }
    return results;
  }
  /**
     * @typedef SearchPageResult
     * @property {string} url
     * @property {number} totalmatches
     * @param {Array<SelectorResult>} elements
     */

  /**
     * @description Searches all pages provided from JSON object
     * @param  {Object} sitemapJson JSON object generated from sitemap
     * @param  {string} selector CSS Selector
     * @param  {boolean} takeScreenshots grab a screenshot of element
     *
     * @returns {Array<SearchPageResult>}
     */
  async searchSiteAsync(sitemapJson, selector, takeScreenshots, isSpa) {
    const usePuppeteer = takeScreenshots || isSpa;
    let results = null;
    let browser = null;

    try {
      if (usePuppeteer) {
        browser = await this.libraries.emulator.launch();
      }

      results = await this.searchPagesAsync(sitemapJson, selector, takeScreenshots, isSpa);

      if (usePuppeteer) {
        await browser.close();
      }
    } catch (searchPagesError) {
      await log.errorToFileAsync(searchPagesError);
    }

    return results;
  }

  /**
     * @typedef SelectorSearchResult
     * @property {number} totalPagesSearched
     * @property {Map<String, Object>} pagesWithSelector
     */

  /**
     * @typedef FindSelectorConfig
     * @property  {string} sitemap
     * @property  {number} limit total pages to search
     * @property  {string} selector CSS selector
     * @property  {boolean} takeScreenshots take screenshot of element
     * @property  {boolean} isSpa indicates the site may be a single-page app
     *
  /**
     * Finds a CSS selector on a site using a sitemap
     * @param  {FindSelectorConfig} config

     * @returns {SelectorSearchResult}
     */
  async getSearchResultsAsync({
    sitemap,
    limit,
    selector,
    takeScreenshots,
    isSpa,
  } = {}) {
    let result = null;

    try {
      const sitemapJson = await this.getSitemapAsync(sitemap);
      const urls = sitemapJson.urlset.url.slice(0, limit || sitemapJson.urlset.url.length - 1);
      const pagesWithSelector = await this
        .searchSiteAsync(
          urls,
          selector,
          takeScreenshots,
          isSpa,
        );

      result = {
        cssSelector: selector,
        totalPagesSearched: urls.length,
        totalMatches: pagesWithSelector.totalMatches,
        pagesWithSelector,
      };
    } catch (findSelectorError) {
      await log.errorToFileAsync(JSON.stringify(findSelectorError));
    }

    return result;
  }

  /**
     * Finds a CSS selector on a site using a sitemap
     * @param  {FindSelectorConfig} config

     * @returns {SelectorSearchResult}
     */
  async findSelectorAsync(config = this.config) {
    let results = null;
    if (!config) {
      throw new Error('No config on SelectorFinder object or passed as argument');
    }
    try {
      results = await this.getSearchResultsAsync(this.config);
    } catch (findSelectorAsyncError) {
      await log.errorToFileAsync(findSelectorAsyncError);
    }
    return results;
  }
}

module.exports = SelectorFinder;
