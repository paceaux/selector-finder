const axios = require('axios');
const cheerio = require('cheerio');
const { Parser } = require('xml2js');
const puppeteer = require('puppeteer');

const { LOG_FILE_NAME } = require('./constants');
const { forEachAsync } = require('./utils');
const Log = require('./logger');
const PageSearchResult = require('./page-search-result');
const SiteSearchResult = require('./site-search-result');

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

  /**
   * Grabs a screenshot of a puppeteer element
   * @param  {Object} element puppeteer element
   * @param  {string} fileName name of the image element saved to the filesystem
   */
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
   * @param  {Array<puppeternodes>} nodes
   * @param  {string} url
   */
  static async grabScreensAsync(nodes, url) {
    await forEachAsync(nodes, async (element, index) => {
      let fileName = `${url}-${index}`;
      fileName = fileName
        .replace('https://', '')
        .replace('/', '-')
        .replace('.', 'dot');

      await SelectorFinder.grabScreenAsync(element, fileName);
    });
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
     * @param  {string|Array<string>} cssSelector
     *
     * @returns {PageResult|null}
     */
  async getResultFromStaticPage(url, cssSelector) {
    let pageSearchResult = null;
    const selectors = Array.isArray(cssSelector) ? cssSelector : cssSelector.split(',');
    const { data } = await this.libraries.ajax(url);
    const $ = cheerio.load(data);

    const elementResults = [];
    const unusedSelectors = [];
    selectors.forEach((selector) => {
      const nodes = $(selector);

      if (nodes.length > 0) {
        const nodesWithSelector = [...nodes].map((node) => ({
          ...node,
          selector,
        }));
        elementResults.push(...nodesWithSelector);
      } else {
        unusedSelectors.push(selector);
      }
    });

    if (elementResults.length > 0) {
      pageSearchResult = new PageSearchResult(url, cssSelector);
      pageSearchResult.addElementSearchResults(elementResults);
      pageSearchResult.addUnusedSelectors(unusedSelectors);
    }

    return pageSearchResult;
  }

  static async getOneResultFromSpaPage(page, selector) {
    const elementSearchResults = await page.evaluate(
      (cssSelector) => {
        // eslint-disable-next-line no-undef
        const els = document.querySelectorAll(cssSelector);
        return [...els].map((el) => {
          const {
            localName,
            innerText,
          } = el;

          const attributes = el.attributes.length > 0 ? {} : null;

          [...el.attributes].forEach((attribute) => {
            const { name, value } = attribute;
            attributes[name] = value;
          });
          // TODO: Figure out how to use ElementSearchResult
          return {
            localName,
            innerText,
            selector: cssSelector,
            attributes,
          };
        });
      },
      selector, // arguments passed here can be used in the callback above
    );

    return elementSearchResults;
  }

  /**
     * @param  {Object} page Puppeteer Page Object
     * @param  {string|Array<string>} cssSelector
     * @param  {boolean} takeScreenshots
     *
     * @returns {PageResult|null}
     */
  static async getResultFromSpaPage(page, cssSelector, takeScreenshots) {
    let pageSearchResult = null;
    const selectors = Array.isArray(cssSelector) ? cssSelector : cssSelector.split(',');
    const url = page.url();

    const elementResults = [];
    const unusedSelectors = [];

    await forEachAsync(selectors, async (selector) => {
      const nodes = await page.$$(selector);
      try {
        if (nodes.length > 0) {
          const nodesWithSelector = await SelectorFinder
            .getOneResultFromSpaPage(page, selector);

          elementResults.push(...nodesWithSelector);

          if (takeScreenshots) {
            await SelectorFinder.grabScreensAsync(nodes, url);
          }
        } else {
          unusedSelectors.push(selector);
        }
      } catch (puppeteerError) {
        await log.errorToFileAsync(puppeteerError);
      }
    });
    if (elementResults.length > 0) {
      pageSearchResult = new PageSearchResult(url, cssSelector);
      pageSearchResult.addElementSearchResults(elementResults);
      pageSearchResult.addUnusedSelectors(unusedSelectors);
    }
    return pageSearchResult;
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

  /**
     * @param  {Object} sitemapJson JSON object generated from sitemap
     * @param  {string|Array} selector CSS Selector
     * @param {PuppeteerBrowser} browser a browser object instantiated with puppeteer
     * @param  {boolean} takeScreenshots grab a screenshot of element
   */
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
          results.push(result);
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
     * @param  {string|Array} selector CSS Selector
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

      results = await this.searchPagesAsync(sitemapJson, selector, browser, takeScreenshots);

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
     * @property  {string|array} selector CSS selector
     * @property  {boolean} takeScreenshots take screenshot of element
     * @property  {boolean} isSpa indicates the site may be a single-page app
     * @property {string} cssFile path to a CSS file where there are css rules
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
      results = await this.getSearchResultsAsync(config);
    } catch (findSelectorAsyncError) {
      await log.errorToFileAsync(findSelectorAsyncError);
    }
    return results;
  }
}

module.exports = SelectorFinder;
