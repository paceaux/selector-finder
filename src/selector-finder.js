import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

import { LOG_FILE_NAME } from './constants.js';
import { forEachAsync } from './utils.js';
import Log from './logger.js';
import PageSearchResult from './page-search-result.js';
import SiteSearchResult from './site-search-result.js';

/** @typedef {import('./site-crawler.js').default} SiteCrawler */
/** @typedef {import('./element-search-result.js').default} ElementSearchResult */
/** @typedef {import('puppeteer').Browser} PuppeteerBrowser */
/** @typedef {import('puppeteer').ElementHandle} PuppeteerNode */

const log = new Log(LOG_FILE_NAME);

/**
 * @typedef {object} SelectorFinderConfig
 * @property {string} sitemap - URL for the sitemap or starting page
 * @property {boolean} crawl - Whether to treat the URL as an HTML page and crawl from there
 * @property {number} limit - How many pages to crawl (0 means unlimited)
 * @property {boolean} useExportedSitemap - Whether to use existing sitemap file or force refetch
 * @property {string|string[]} selector - CSS selector(s) to search for
 * @property {string} outputFileName - Name of the output file
 * @property {boolean} takeScreenshots - Whether to take screenshots of matched elements
 * @property {boolean} isSpa - Whether the target is a Single Page Application
 * @property {string} [cssFile] - Optional path to a CSS file to extract selectors from
 * @property {boolean} showElementDetails - Whether to show element details like tagname,
 * attributes, innerText
 * @property {boolean} showHtml - Whether to show HTML markup for matched elements
 * @property {SiteCrawler} [siteCrawler] - Optional SiteCrawler instance (added during processing)
 */

/**
 * @typedef {object} SelectorFinderLibraries
 * @property {object} axios - The library for fetching pages
 * @property {string} dom - The library for parsing HTML
 * @property {puppeteer} emulator - The library for emulating the browser
 */
const DEFAULT_LIBRARIES = {
  ajax: axios,
  dom: cheerio,
  emulator: puppeteer,
};

/**
 * @class SelectorFinder
 * @classdesc The engine that finds selectors
 */
export default class SelectorFinder {
  /**
   * creates a SelectorFinder instance
   * @param {SelectorFinderConfig} config - configuration for finding the selector
   * @param {SelectorFinderLibraries} libraries - Libraries to use
   */
  constructor(config, libraries) {
    this.config = config;
    this.libraries = { ...SelectorFinder.defaultLibraries, ...libraries };
  }

  /**
   * @type {SelectorFinderLibraries} - the libraries the class uses
   */
  static get defaultLibraries() {
    return DEFAULT_LIBRARIES;
  }

  /**
   * Grabs a screenshot of a puppeteer element
   * @param  {object} element puppeteer element
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
   * @param  {Array<PuppeteerNode>} nodes - nodes returned from puppeteer
   * @param  {string} url - the url from which to get a screenshot
   */
  static async grabScreensAsync(nodes, url) {
    await forEachAsync(nodes, async (element, index) => {
      const cleanUrl = url
        .replace(/http(s?)(:\/\/)/, '') // get rid of protocol
        .replace('.', 'dot') // replace . with dot
        .replace(/\.((x|r|s)?(htm(l?))|jsp|php|asp|cfm)(x?)/gi, '') // remove file extensions
        .replace(/\//g, '_'); // directories to underscores
      let fileName = `${cleanUrl}-${index}`;
      fileName = fileName
        .replace('--', '-') // dangling double-hyphens
        .replace('_-', '-'); // a final / that would convert to _

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
   * @param {number} totalMatches - the total matches on the page
   * @param {Array<SelectorResult>} innerText innerText of element
   */

  /**
   * @description Gets result from Cheerio
   * @param  {string} url - the url from which to get results
   * @param  {string|Array<string>} cssSelector - CSS selector or Selectors
   * @returns {PageResult|null} - the result from the search
   */
  async getResultFromStaticPage(url, cssSelector) {
    let pageSearchResult = null;
    const selectors = Array.isArray(cssSelector) ? cssSelector : cssSelector.split(',');
    const { data } = await this.libraries.ajax(url);
    const $ = cheerio.load(data);

    const elementResults = [];
    const unusedSelectors = [];
    const selectorErrors = [];
    selectors.forEach((selector) => {
      try {
        const nodes = $(selector);

        if (nodes.length > 0) {
          const nodesWithSelector = [...nodes].map((node) => ({
            ...node,
            innerText: $(node).text(),
            selector,
          }));
          elementResults.push(...nodesWithSelector);
        } else {
          unusedSelectors.push(selector);
        }
      } catch (querySelectorError) {
        selectorErrors.push(querySelectorError);
      }
    });

    if (elementResults.length > 0) {
      pageSearchResult = new PageSearchResult(url, cssSelector);
      pageSearchResult.addElementSearchResults(elementResults);
      pageSearchResult.addUnusedSelectors(unusedSelectors);
      pageSearchResult.addSelectorErrors(selectorErrors);
    }

    if (elementResults.length === 0 && unusedSelectors.length > 0) {
      await log.infoToFileAsync(`The page ${url} had no matches, all of these selectors were unused:
        ${unusedSelectors.toString()}
      `);
    }
    if (elementResults.length === 0 && selectorErrors.length > 0) {
      await log.infoToFileAsync(`The page ${url} had no matches, and only the errors:
        ${selectorErrors.toString()}
      `);
    }

    return pageSearchResult;
  }

  /**
   * @description Gets a single result from a SPA page
   * @async
   * @param {object} page - Puppeteer Page Object
   * @param {string} selector - The selector to get the result from
   * @returns {Array<ElementSearchResult>} - The result from the page
   */
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
            html: el.outerHTML,
          };
        });
      },
      selector, // arguments passed here can be used in the callback above
    );

    return elementSearchResults;
  }

  /**
   * @param  {object} page Puppeteer Page Object - the puppeteer page object
   * @param  {string|Array<string>} cssSelector - a CSS selector or selectors
   * @param  {boolean} takeScreenshots - whether to take screenshots
   * @returns {PageResult|null} - a page result if successful
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
   * @property {SelectorSearchResult[]} elements a cheerio object with the results
   */
  /**
   * @description searches a single url for a selector
   * @param  {string} url - a url of a page on which to search
   * @param  {string} selector a valid css selector
   * @param  {object} browser puppeteer browser object
   * @param  {boolean} takeScreenshots whether to take screenshots of the page
   * @returns {null|SearchPageResult} the result from searching a single page
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
   * @param  {object} sitemapJson JSON object generated from sitemap
   * @param  {string|Array} selector CSS Selector
   * @param {PuppeteerBrowser} browser a browser object instantiated with puppeteer
   * @param  {boolean} takeScreenshots grab a screenshot of element
   * @returns {SiteSearchResult} the result of searching many pages
   */
  async searchPagesAsync(sitemapJson, selector, browser, takeScreenshots) {
    const results = new SiteSearchResult();

    try {
      await forEachAsync(sitemapJson, async (sitemapObj) => {
        const result = await this
          .searchPageAsync(
            sitemapObj.loc,
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
   * @property {string} url - the url of a page searched
   * @property {number} totalmatches - the total matches on the apge
   * @param {Array<SelectorResult>} elements - elements which match the search
   */
  /**
   * @description Searches all pages provided from JSON object
   * @param  {object} sitemapJson JSON object generated from sitemap
   * @param  {string|Array} selector CSS Selector
   * @param  {boolean} takeScreenshots grab a screenshot of element
   * @param {boolean} isSpa - whether to treat the entire experience as a single page app
   * @returns {Array<SearchPageResult>} the result of searching many pages
   */
  async searchSiteAsync(sitemapJson, selector, takeScreenshots, isSpa) {
    const usePuppeteer = takeScreenshots || isSpa;
    let results = null;
    let browser = null;

    try {
      if (usePuppeteer) {
        browser = await this.libraries.emulator.launch({
          headless: true,
          ignoreDefaultArgs: ['--disable-extensions'],
          args: ['--use-gl=egl'],
        });
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
   * @property {number} totalPagesSearched - the total pages from the site that were searched
   * @property {Map<string, object>} pagesWithSelector - the results of the search
   */

  /**
   * Finds a CSS selector on a site using a sitemap
   * @param  {SelectorFinderConfig} config - sitemapJson - A json object that represents the sitemap
   * @returns {SelectorSearchResult} - the result of the search
   */
  async getSearchResultsAsync({
    limit,
    siteCrawler,
    selector,
    takeScreenshots,
    isSpa,
  } = {}) {
    let result = null;

    try {
      const sitemapUrls = siteCrawler.urlset;
      const urls = sitemapUrls.slice(0, limit || sitemapUrls.length - 1);
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
   * @param  {SelectorFinderConfig} config - the configuration for the search
   * @returns {SelectorSearchResult} the result of searching the entire site
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
