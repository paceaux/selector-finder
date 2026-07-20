#!/usr/bin/env node
// This is recommended way to import according to docs
/* eslint-disable import/no-unresolved */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import {
  LOG_FILE_NAME,
  DEFAULT_SITEMAP_URL,
  DEFAULT_SELECTOR,
  DEFAULT_OUTPUT_FILE,
  DEFAULT_IS_SPA,
  DEFAULT_LIMIT,
  DEFAULT_TAKE_SCREENSHOTS,
  DEFAULT_SHOW_ELEMENT_DETAILS,
  DEFAULT_SHOW_HTML,
  DEFAULT_CRAWL,
} from './src/constants.js';

import SelectorFinder from './src/selector-finder.js';
import SiteCrawler from './src/site-crawler.js';
import Outputter from './src/outputter.js';
import Log from './src/logger.js';
import CSSReader from './src/css-reader.js';

const log = new Log(LOG_FILE_NAME);

/*
CLI arguments

node index.js --sitemap=https://wherever.com/xml --limit=20 --selector=".yourthing"
node index.js -u https://wherever.com/xml -l 20 -s ".yourthing"
*/
const { argv } = yargs(hideBin(process.argv))
  .option('sitemap', {
    alias: 'u',
    description: 'url for the sitemap',
    type: 'string',
    default: DEFAULT_SITEMAP_URL,
  })
  .option('crawl', {
    alias: 'r',
    description: 'treat the url as an html page and crawl from there',
    type: 'boolean',
    default: DEFAULT_CRAWL,
  })
  .option('dontUseExportedSitemap', {
    alias: 'X',
    description: 'Force the Site Crawler to refetch links and ignore an existing sitemap',
    type: 'boolean',
    default: false,
  })
  .option('limit', {
    alias: 'l',
    description: 'how many pages to crawl',
    type: 'number',
    default: DEFAULT_LIMIT,
  })
  .option('selector', {
    alias: 's',
    description: 'css selector',
    type: 'string',
    default: DEFAULT_SELECTOR,
  })
  .option('takeScreenshots', {
    alias: 'c',
    description: 'Take a screenshot',
    type: 'boolean',
    default: DEFAULT_TAKE_SCREENSHOTS,
  })
  .option('isSpa', {
    alias: 'd',
    description: 'Is a Single Page Application',
    type: 'boolean',
    default: DEFAULT_IS_SPA,
  })
  .option('outputFileName', {
    alias: 'o',
    description: 'name of output file',
    type: 'string',
    default: DEFAULT_OUTPUT_FILE,
  })
  .option('cssFile', {
    alias: 'f',
    description: 'path to a CSS File',
    type: 'string',
  })
  .option('showElementDetails', {
    alias: 'e',
    description: 'Show details like tagname, attributes, innerText for elements',
    type: 'boolean',
    default: DEFAULT_SHOW_ELEMENT_DETAILS,
  })
  .option('showHtml', {
    alias: 'm',
    description: 'Shows the HTML for the element',
    type: 'boolean',
    default: DEFAULT_SHOW_HTML,
  })
  .help()
  .alias('help', 'h');

const {
  sitemap,
  crawl,
  limit,
  dontUseExportedSitemap,
  selector,
  outputFileName,
  takeScreenshots,
  isSpa,
  cssFile,
  showElementDetails,
  showHtml,
} = argv;

/**
 * @typedef {object} SelectorFinderConfig
 * @property {string} sitemap - URL for the sitemap or starting page
 * @property {boolean} crawl - Whether to treat the URL as an HTML page and crawl from there
 * @property {number} limit - How many pages to crawl (0 for unlimited)
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
const selectorFinderConfig = {
  sitemap,
  crawl,
  limit,
  useExportedSitemap: !dontUseExportedSitemap,
  selector,
  outputFileName,
  takeScreenshots,
  isSpa,
  cssFile,
  showElementDetails,
  showHtml,
};

/**
 * Decides if it's a single selector or an array b/c it's a CSS file
 * @async
 * @param {SelectorFinderConfig} config - configuration for finding CSS selectors
 * @returns {Promise<SelectorFinderConfig>} - a modified config
 */
async function setCSSFileSelectors(config) {
  if (config.cssFile) {
    try {
      const cssReader = new CSSReader(config.cssFile);
      await cssReader.readFileAsync();
      // eslint-disable-next-line no-param-reassign
      config.selector = cssReader.selectors;
    } catch (cssFileReadError) {
      await log.errorToFileAsync(cssFileReadError);
    }
  }
  return config;
}

/**
 * @typedef SelectorSearchResult
 * @property {number} totalPagesSearched - the total number of pages search
 * @property {Map<string, object>} pagesWithSelector - a K-V map where K is url and V is page object
 */

/**
 * Formats the results based on what the user has asked for
 * @param  {SelectorSearchResult} result - a search result (defined in selector.finder.js)
 * @param  {boolean} hasElementDetails - whether the json should show element details
 * @param  {boolean} hasElementHtml - whether the full HTML should be shown for the element
 * @returns {object} page results with or without extra details on results
 */
function getFormattedResult(result, hasElementDetails, hasElementHtml) {
  const formattedResult = { ...result };

  const { pagesWithSelector } = result;

  const editedPages = pagesWithSelector.map((pageWithSelector) => {
    const editedPageWithSelector = { ...pageWithSelector };

    if (!hasElementDetails) {
      const editedElements = editedPageWithSelector.elements.map((element) => {
        const { html } = element;
        return { selector: element.selector, html };
      });
      editedPageWithSelector.elements = editedElements;
    }

    if (!hasElementHtml) {
      const editedElements = editedPageWithSelector.elements.map((element) => {
        const newEl = { ...element };
        delete newEl.html;
        return newEl;
      });
      editedPageWithSelector.elements = editedElements;
    }

    return editedPageWithSelector;
  });

  formattedResult.pagesWithSelector = editedPages;

  return formattedResult;
}

/**
 * The CLI; where everything starts
 * @async
 * @param {SelectorFinderConfig} config - The configuration from command line arguments
 * @returns {Promise<void>}
 */
async function main(config) {
  const outputter = new Outputter(DEFAULT_OUTPUT_FILE, log);
  let mainConfig = { ...config };
  if (!mainConfig.sitemap) {
    await log.toConsole('No sitemap provided. Exiting.');
    await log.errorToFileAsync('No sitemap provided. Exiting.');
    return;
  }
  try {
    const startMessage = `
🔍🐕 SelectorHound is looking... 

📃  Sitemap: ${mainConfig.sitemap}
🛑  limit: ${limit === 0 ? 'None' : limit}
${mainConfig.cssFile ? `📂  cssFile: ${cssFile}` : ''}
${mainConfig.selector && !mainConfig.cssFile ? `🎯  CSS Selector: ${mainConfig.selector}` : ''}         
${mainConfig.showElementDetails ? '💡  Show full details for matching elements' : ''}
${mainConfig.isSpa ? '💡  Handle as Single Page Application' : ''}
${mainConfig.takeScreenshots ? '📷  Take Screenshots' : ''}
${mainConfig.useExportedSitemap ? '' : '💡  Ignore any existing .sitemap.json file and make a new one'}
`;
    await log
      .toConsole(startMessage)
      .startTimer()
      .infoToFileAsync();

    if (mainConfig.cssFile) {
      mainConfig = await setCSSFileSelectors(mainConfig);
    }

    // Set up the Crawler
    const siteCrawler = new SiteCrawler(
      {
        startPage: mainConfig.sitemap,
        shouldCrawl: mainConfig.crawl,
        useExportedSitemap: mainConfig.useExportedSitemap,
      },
    );
    log.toConsole(`
🐕  ${mainConfig.crawl ? 'Crawling site' : 'Fetching sitemap'} ${mainConfig.crawl ? 'starting on 🏁' : 'from 🦴'} ${siteCrawler.config.startPage}
      `);
    await siteCrawler.produceSiteLinks();

    const numberOfSiteLinks = siteCrawler.linkSet.size;
    const isNotExported = !mainConfig.useExportedSitemap;
    const siteLinksMessage = `🔗  ${numberOfSiteLinks} URLs ${isNotExported ? 'exported to' : 'read from'} 💾 ${siteCrawler.exportFileName}.sitemap.json`;

    log.toConsole(siteLinksMessage);

    if (siteCrawler.linkSet.size === 0) {
      const noLinksMessage = `
      🚫🔗  No links found. Nothing To search.`;
      await log
        .toConsole(noLinksMessage)
        .infoToFileAsync(noLinksMessage);
      return;
    }
    mainConfig.siteCrawler = siteCrawler;

    const selectorFinder = new SelectorFinder(mainConfig);
    const result = await selectorFinder.findSelectorAsync();
    const { totalPagesSearched, pagesWithSelector, totalMatches } = result;

    const formattedResult = getFormattedResult(
      result,
      mainConfig.showElementDetails,
      mainConfig.showHtml,
    );
    await outputter.writeDataAsync(formattedResult, outputFileName);

    log.endTimer();
    const { elapsedTime } = log;
    const friendlyTime = elapsedTime > 300 ? `${(elapsedTime / 60).toFixed(2)}m` : `${elapsedTime}s`;
    const endMessage = `
🐶  SelectorHound is finished!

🕜  Time lapsed: ${friendlyTime}
🔗  Pages Scanned: ${totalPagesSearched} 
🎯  Pages with a Match: ${pagesWithSelector.length}
🧮  Total Results: ${totalMatches} ${totalMatches > pagesWithSelector.length ? '(multiple matches on a page)' : ''}              
💾  Results File: ${outputFileName}${outputFileName !== 'pages.json' ? '.pages.json' : ''}
`;
    await log.toConsole(endMessage, true).infoToFileAsync();
  } catch (mainFunctionError) {
    await log.errorToFileAsync(mainFunctionError);
  }
}

main(selectorFinderConfig);
