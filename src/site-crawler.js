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

  async getLinksFromPage(url) {
    let links = [];

    try {
      const { ajax, dom } = this.libraries;
      const pageMarkup = await SiteCrawler.getPageAsync(url, ajax);
      links = SiteCrawler.getLinksFromMarkup(pageMarkup, dom);
    } catch (getLinksError) {
      await log.errorToFileAsync(getLinksError);
    }
    return links;
  }
}

module.exports = SiteCrawler;
