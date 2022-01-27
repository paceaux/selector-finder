const axios = require('axios');
const cheerio = require('cheerio');

const { LOG_FILE_NAME } = require('./constants');
const Log = require('./logger');

const log = new Log(LOG_FILE_NAME);

const DEFAULT_CONFIG = {
  startPage: 'https://frankmtaylor.com',
  linkSelector: 'a[href]',
};

const DEFAULT_LIBRARIES = {
  ajax: axios,
  dom: cheerio,
};

class SiteCrawler {
  constructor(config, libraries) {
    this.config = { ...SiteCrawler.defaultConfig, ...config };
    this.libraries = { ...SiteCrawler.defaultLibraries, ...libraries };
    this.linkSet = new Set();
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

  /**
   * @description formats collection of links to look like jsonified sitemap
   */
  get urlset() {
    const linkArray = [...this.linkSet]
      .map((link) => {
        const url = link.indexOf(this.origin) === -1
          ? `${this.origin}${link}`
          : link;
        return {
          loc: url,
        };
      });
    return linkArray;
  }

  /**
   * adds multiple items to the linkSet property
   * @param  {string[]} linkArray an array of href values
   */
  addLinks(linkArray) {
    this.linkSet = new Set([...this.linkSet, ...linkArray]);
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

    const $ = dom.load(pageMarkup);
    const nodes = $(linkSelector);
    pageLinks = [...nodes]
      .map((node) => node.attribs.href);

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

  async crawlPageAsync(url) {
    try {
      const pageLinks = await this.getLinksFromPageAsync(url);
      this.addLinks(pageLinks);
    } catch (crawlPageError) {
      await log.errorToFileAsync(crawlPageError);
    }
  }
}

module.exports = SiteCrawler;
