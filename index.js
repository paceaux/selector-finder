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
} = require('./src/constants');
const SelectorFinder = require('./src/selector-finder');
const Outputter = require('./src/outputter');
const Log = require('./src/logger');

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
  .help()
  .alias('help', 'h');

const {
  sitemap,
  limit,
  selector,
  outputFileName,
  takeScreenshots,
  isSpa,
  cssFile,
} = argv;

const selectorFinderConfig = {
  sitemap,
  limit,
  selector,
  outputFileName,
  takeScreenshots,
  isSpa,
  cssFile,
};

async function main(config) {
  const outputter = new Outputter(DEFAULT_OUTPUT_FILE, log);
  try {
    const startMessage = `
| Looking...                
| Sitemap: ${config.sitemap},   
| limit: ${limit}
${config.cssFile ? `| cssFile (${cssFile})` : ''}         
${config.selector && !config.cssFile ? `| CSS Selector (${selector})` : ''}         
${config.isSpa ? '| Handle as Single Page Application' : ''}         
${config.takeScreenshots ? '| Take Screenshots' : ''}         
`;
    await log
      .toConsole(startMessage)
      .startTimer()
      .infoToFileAsync();

    const selectorFinder = new SelectorFinder(config);
    const result = await selectorFinder.findSelectorAsync();
    const { totalPagesSearched, pagesWithSelector, totalMatches } = result;

    await outputter.writeDataAsync(result, outputFileName);

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
