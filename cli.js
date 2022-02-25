#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const {
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
} = require('./src/constants');
const SelectorFinder = require('./src/selector-finder');
const SiteCrawler = require('./src/site-crawler');
const Outputter = require('./src/outputter');
const Log = require('./src/logger');
const CSSReader = require('./src/css-reader');

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
  selector,
  outputFileName,
  takeScreenshots,
  isSpa,
  cssFile,
  showElementDetails,
  showHtml,
} = argv;

const selectorFinderConfig = {
  sitemap,
  crawl,
  limit,
  selector,
  outputFileName,
  takeScreenshots,
  isSpa,
  cssFile,
  showElementDetails,
  showHtml,
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
  try {
    const startMessage = `
| Looking...                
| Sitemap: ${mainConfig.sitemap},
| limit: ${limit === 0 ? 'None' : limit}
${mainConfig.cssFile ? `| cssFile (${cssFile})` : ''}         
${mainConfig.selector && !mainConfig.cssFile ? `| CSS Selector (${mainConfig.selector})` : ''}         
${mainConfig.isSpa ? '| Handle as Single Page Application' : ''}         
${mainConfig.takeScreenshots ? '| Take Screenshots' : ''}         
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
      },
    );
    await log.toConsole(`
      ||> ${mainConfig.crawl ? 'Crawling site' : 'Fetching sitemap'}
      ||> ${mainConfig.crawl ? 'Starting on' : 'using'} ${siteCrawler.config.startPage}
      `);
    await siteCrawler.produceSiteLinks();

    await log.toConsole(`
      ||-> Site links exported to ${siteCrawler.exportFileName}
    `);

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
    const endMessage = `
| Finished after ${log.elapsedTime}s
| Pages Scanned: ${totalPagesSearched} 
| Pages with a Match: ${pagesWithSelector.length}
| Total Results: ${totalMatches}                  
| FileName: ${outputFileName}
`;
    await log.toConsole(endMessage, true).infoToFileAsync();
  } catch (mainFunctionError) {
    await log.errorToFileAsync(mainFunctionError);
  }
}

main(selectorFinderConfig);
