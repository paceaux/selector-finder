/* eslint-disable max-len */
const axios = require('axios');
const fs = require('fs');
const Path = require('path');
const cheerio = require('cheerio');
const { Parser } = require('xml2js');

const { LOG_FILE_NAME } = require('./constants');
const Log = require('./logger');
const Outputter = require('./outputter');

const { forEachAsync } = require('./utils');

const log = new Log(LOG_FILE_NAME);

const DEFAULT_CONFIG = {
  startPage: 'https://frankmtaylor.com',
  linkSelector: 'a[href]',
  shouldCrawl: false,
  useExportedSitemap: true,
};

const DEFAULT_LIBRARIES = {
  ajax: axios,
  dom: cheerio,
  Parser,
};

class SiteCrawler {
  constructor(config, libraries) {
    this.config = { ...SiteCrawler.defaultConfig, ...config };
    this.libraries = { ...SiteCrawler.defaultLibraries, ...libraries };
    this.linkSet = new Set();
    this.outputter = new Outputter('sitemap.json', log);
  }

  static get defaultConfig() {
    return DEFAULT_CONFIG;
  }

  static get defaultLibraries() {
    return DEFAULT_LIBRARIES;
  }

  get origin() {
    const url = new URL(this.config.startPage);

    return url.origin;
  }

  get host() {
    const url = new URL(this.config.startPage);

    return url.host;
  }

  get exportFileName() {
    return this.origin.replace(/https?:\/\//gi, '');
  }

  /**
   * @description formats collection of links to look like jsonified sitemap
   */
  get urlset() {
    const linkArray = [...this.linkSet]
      .map((link) => {
        const url = link.indexOf(this.host) === -1
          ? `${this.origin}${link}`
          : link;
        return {
          loc: url,
        };
      });
    return linkArray;
  }

  /**
   * @description provides a fully qualified path to the sitemap json file
   * @type {string}
   */
  get pathToExportedFile() {
    return Path.join(process.cwd(), `${this.exportFileName}.${this.outputter.defaultOutputFile}`);
  }

  /**
   * @description determines if the links have already been exported to a file
   * @type {boolean}
   */
  get hasExportedLinks() {
    return fs.existsSync(this.pathToExportedFile);
  }

  /**
   * adds multiple items to the linkSet property
   * @param  {string[]|object[]} linkArray an array of href values, or objects with a loc property
   */
  addLinks(linkArray) {
    const cleanArray = linkArray.map((link) => {
      if (typeof link === 'string') {
        return link;
      }
      if (typeof link === 'object' && link.loc) {
        return link.loc;
      }
    });
    this.linkSet = new Set([...this.linkSet, ...cleanArray]);
  }

  /**
   * @description Gets an HTML page
   * @async
   * @param  {string|URL} url fully qualified url to page
   * @param  {Axios} [ajax=this.defaultLibraries.ajax] ajax library
   *
   * @returns {string} HTML markup as a string
   */
  static async getPageAsync(url, ajax = this.defaultLibraries.ajax) {
    let result = null;

    if (!url) throw new Error('A url was not provided');
    try {
      const { data } = await ajax(url);
      result = data;
    } catch (getFileError) {
      await log.errorToFileAsync(getFileError);
    }
    return result;
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
   * @param  {string} [sitemapUrl=this.config.startPage] fully qualified url
   *
   * @returns {object} parsed xml
   *
   */
  async getSitemapAsync(sitemapUrl = this.config.startPage) {
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

  static getLinksFromSitemap(sitemapJson) {
    if (!sitemapJson) throw new Error('Sitemap JSON was not provided');
    const pageLinks = sitemapJson
      .urlset
      .url // note: each url node in the xml becomes object in an array called url
      .map((urlObject) => urlObject.loc[0]);

    return pageLinks;
  }

  /**
   * @description Gets only links from a string containing markup
   * @param  {string} pageMarkup string containing markup
   * @param  {string} [linkSelector=this.defaultConfig.linkSelector] selector to find links
   * @param  {Cheerio} [dom=this.defaultLibraries.dom] Dom querying library
   *
   * @returns {string[]} array of href values
   */
  static getLinksFromMarkup(
    pageMarkup,
    linkSelector = this.defaultConfig.linkSelector,
    dom = this.defaultLibraries.dom,
  ) {
    if (!pageMarkup) throw new Error('Markup was not provided');
    let pageLinks = [];

    try {
      const $ = dom.load(pageMarkup);
      const nodes = $(linkSelector);
      pageLinks = [...nodes]
        .map((node) => node.attribs.href);
    } catch (getLinksFromMarkupError) {
      log.toConsole(getLinksFromMarkupError);
    }

    return pageLinks;
  }

  /**
   * @description Filters an array of links (removes duplicates, external urls, and anchor links)
   * @param  {string[]} pageLinks links to pages
   * @param  {string} siteOrigin the origin of the website
   *
   * @returns {string[]} an array of href values
   */
  static filterPageLinks(pageLinks, siteOrigin) {
    if (!Array.isArray(pageLinks)) throw new Error('pageLinks is not an array');
    if (!siteOrigin) throw new Error('No site origin is provided');

    const filteredLinks = pageLinks.filter((pageLink) => {
      const isFullyQualifiedSiteLink = pageLink.indexOf(siteOrigin) === 0;
      const isRelativeLink = pageLink.indexOf('/') === 0;
      const isAnchorLink = pageLink.indexOf('#') === 0;
      return !isAnchorLink && (isFullyQualifiedSiteLink || isRelativeLink);
    });
    const uniqueLinks = [...new Set(filteredLinks)];

    return uniqueLinks;
  }

  /**
   * @description Gets array of href values from a page
   * @async
   * @param  {string} url fully qualified url to page
   *
   * @returns {string[]} an array of href values
   */
  async getLinksFromPageAsync(url) {
    let links = [];

    try {
      const { linkSelector } = this.config;
      const { ajax, dom } = this.libraries;
      const pageMarkup = await SiteCrawler.getPageAsync(url, ajax);
      const pageLinks = SiteCrawler.getLinksFromMarkup(pageMarkup, linkSelector, dom);
      links = SiteCrawler.filterPageLinks(pageLinks, this.origin);
    } catch (getLinksError) {
      await log.errorToFileAsync(getLinksError);
    }
    return links;
  }

  /**
   * @description Crawls a page and adds links to the linkSet
   * @param  {string} url fully qualified usrl to page
   */
  async crawlPageAsync(url) {
    try {
      const pageLinks = await this.getLinksFromPageAsync(url);
      this.addLinks(pageLinks);
    } catch (crawlPageError) {
      await log.errorToFileAsync(crawlPageError);
    }
  }

  /**
   * @description Crawls entire site looking for links
   * @param  {string} url=this.config.startPage
   */
  async crawlSiteAsync(url = this.config.startPage) {
    try {
      await this.crawlPageAsync(url);
      await forEachAsync(this.urlset, async (urlObject) => {
        await this.crawlPageAsync(urlObject.loc);
      });
    } catch (crawlPageError) {
      await log.errorToFileAsync(crawlPageError);
    }
  }

  /**
   * @description Exports all of the collected site links to a file
   * @param {string} [fileName=this.exportFileName] Name of file to be concatenated to sitemap.json
   */
  async exportSiteLinks(fileName = this.exportFileName) {
    try {
      await this.outputter.writeDataAsync(this.urlset, fileName);
    } catch (exportSiteLinksError) {
      await log.errorToFileAsync(exportSiteLinksError);
    }
  }

  /**
   * @description Crawls. Wrapper for crawl, in case other functionality should be added
   * @param  {string} startPage=this.config.startPage
   */
  async crawl(startPage = this.config.startPage) {
    try {
      await this.crawlSiteAsync(startPage);
    } catch (crawlError) {
      await log.errorToFileAsync(crawlError);
    }
  }

  /**
   * @description Fetches a sitemap and adds links to linkset
   * @param  {string} [sitemapUrl=this.config.startPage]
   */
  async setSitemap(sitemapUrl = this.config.startPage) {
    this.config.startPage = sitemapUrl;

    try {
      const sitemapJson = await this.getSitemapAsync(sitemapUrl);
      const sitemapUrls = SiteCrawler.getLinksFromSitemap(sitemapJson);
      this.addLinks(sitemapUrls);
    } catch (setSitemapError) {
      await this.errorToFileAsync(setSitemapError);
    }
  }

  /**
   * @description sets links from an existing json file
   * @param  {string} fileName
   */
  async setLinksFromJsonFile(fileName) {
    if (!fileName) return;
    try {
      const existingJson = await fs.promises.readFile(fileName, 'utf-8');
      const existingSiteLinks = JSON.parse(existingJson);
      this.addLinks(existingSiteLinks);
    } catch (setLinksError) {
      await this.errorToFileAsync(setLinksError);
    }
  }

  /**
   * @description wrapper for crawl and setSitemap that also produces export file
   * @param  {boolean} [shouldCrawl=this.config.shouldCrawl]
   * @param {boolean} [useExportedSitemap=this.config.useExportedSitemap] use existing file if already exists
   */
  async produceSiteLinks(
    shouldCrawl = this.config.shouldCrawl,
    useExportedSitemap = this.config.useExportedSitemap,
  ) {
    const shouldNotProduceLinks = useExportedSitemap && this.hasExportedLinks;
    if (shouldNotProduceLinks) {
      const alreadyExistsMessage = `The file ${this.pathToExportedFile} already exists and recrawling was not forced.`;
      await log.infoToFileAsync(alreadyExistsMessage);
      await log.toConsole(alreadyExistsMessage);
      await this.setLinksFromJsonFile(`${this.exportFileName}.${this.outputter.defaultOutputFile}`);
      return;
    }

    if (shouldCrawl) {
      await this.crawl();
    } else {
      await this.setSitemap(this.config.startPage);
    }
    await this.exportSiteLinks(this.exportFileName);
  }
}

module.exports = SiteCrawler;
