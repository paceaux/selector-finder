
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { LOG_FILE_NAME, SITEMAP_URL, DEFAULT_OUTPUT_FILE } = require('./src/constants');
const SelectorFinder = require('./src/selector-finder');
const Outputter = require('./src/outputter');
const Log = require('./src/logger');
const log = new Log(LOG_FILE_NAME);


/* 
CLI arguments

node index.js --sitemap=https://wherever.com/xml --limit=20 --selector=".yourthing"
node index.js -u https://wherever.com/xml -l 20 -s ".yourthing"
*/
const argv = yargs(hideBin(process.argv))
    .option('sitemap', {
        alias: 'u',
        description: 'url for the sitemap',
        type: 'string',
        default: SITEMAP_URL
    })
    .option('limit', {
        alias: 'l',
        description: 'how many pages to crawl',
        type: 'number',
        default: 0,
    })
    .option('selector', {
        alias: 's',
        description: 'css selector',
        type: 'string',
        default: '.title',
    })
    .option('takeScreenshots', {
        alias: 'c',
        description: 'Take a screenshot',
        type: 'boolean',
        default: false,
    })
    .option('isSpa', {
        alias: 'd',
        description: 'Is a Single Page Application',
        type: 'boolean',
        default: false,
    })
    .option('outputFileName', {
        alias: 'o',
        description: 'name of output file',
        type: 'string',
        default: DEFAULT_OUTPUT_FILE,
    })
    .help()
    .alias('help', 'h')
    .argv;

const { sitemap, limit, selector, outputFileName, takeScreenshots, isSpa } = argv;

async function main(sitemapUrl, limit, selector, outputFileName, takeScreenshots, isSpa) {
    try {
        const startMessage = 
`
| Looking...                
| Sitemap: ${sitemapUrl},   
| limit: ${limit}           
| CSS Selector: ${selector} 
`
        await log.toConsole(startMessage).infoToFileAsync();
        const { totalPagesSearched, pagesWithSelector } = await SelectorFinder.findSelectorAsync(sitemapUrl, limit, selector, takeScreenshots);

        await Outputter.writeDataAsync(pagesWithSelector, outputFileName);
        const endMessage = `
| Finished
| Scanned ${totalPagesSearched} pages                   
| ${outputFileName}.json
`;
        await log.toConsole(endMessage, true).infoToFileAsync();
    } catch (mainFunctionError) {
        await log.errorToFileAsync(mainFunctionError);
    }
}


main(sitemap, limit, selector, outputFileName, takeScreenshots, isSpa);