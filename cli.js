#!/usr/bin/env node

import yargs from 'yargs/yargs';
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
  DEFAULT_HONOR_ROBOTS,
} from './src/constants.js';

import SelectorFinder from './src/selector-finder.js';
import SiteCrawler from './src/site-crawler.js';
import Outputter from './src/outputter.js';
import Log from './src/logger.js';
import CSSReader from './src/css-reader.js';
import Robots from './src/robots.js';

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
  .option('honorRobots', {
    alias: 'b',
    description: 'Honor robots.txt',
    type: 'boolean',
    default: DEFAULT_HONOR_ROBOTS,
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
  honorRobots,
} = argv;

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
  honorRobots,
};

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
${mainConfig.honorRobots ? '🤖 Honor any robots.txt file' : ''}
`;
    await log
      .toConsole(startMessage)
      .startTimer()
      .infoToFileAsync();

    if (mainConfig.cssFile) {
      mainConfig = await setCSSFileSelectors(mainConfig);
    }

    // Get the robots.txt file
    let robots = null;
    // set the disallowed paths first, b/c there might be another approach to add these later
    let disallowedPaths = [];

    if (mainConfig.honorRobots) {
      robots = new Robots(
        {
          url: mainConfig.sitemap,
          useExportedRobots: mainConfig.useExportedSitemap,
        },
      );

      try {
        await log
          .toConsole('🤖🐕  Getting robots.txt file...')
          .infoToFileAsync();
        // we should pass a config into getRulesAsync; 
        // it should know whether to fetch anew or use existing
        await robots.getRulesAsync();
        // consider finding a toggle. May not always want to see this.
        await robots.exportRobots();
        await robots.exportDisallowed('*');
        disallowedPaths = robots.agents.get('*')?.get('disallow') || [];
        disallowedPaths = [...disallowedPaths];
      } catch (robotsError) {
        await log
          .toConsole('🤖🚫  Error getting robots.txt file. Continuing without it.')
          .errorToFileAsync(robotsError);
      }
    }

    if (disallowedPaths.length > 0) {
      const disallowedPathsMessage = `📄🚫  Disallowed paths: \n ${disallowedPaths.join(',\n')}`;
      await log.toConsole(disallowedPathsMessage).infoToFileAsync(disallowedPaths);
    }

    // Set up the Crawler
    const siteCrawler = new SiteCrawler(
      {
        startPage: mainConfig.sitemap,
        shouldCrawl: mainConfig.crawl,
        useExportedSitemap: mainConfig.useExportedSitemap,
        disallowedPaths,
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
    mainConfig.disallowedPaths = disallowedPaths;

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

⏱   Time lapsed: ${friendlyTime}
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
