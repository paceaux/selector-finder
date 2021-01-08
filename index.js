
const { promises } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const fs = promises;

const { LOG_FILE_NAME, SITEMAP_URL } = require('./src/constants');
const { jsonifyData } = require('./src/utils');
const { SelectorFinder } = require('./src/selector-finder');
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
    .option('outputFileName', {
        alias: 'o',
        description: 'name of output file',
        type: 'string',
        default: 'pages',
    })
    .help()
    .alias('help', 'h')
    .argv;

const { sitemap, limit, selector, outputFileName } = argv;



/** Outputs the results to a file
 * @param  {Map} resultsMap
 * @param  {string} fileName
 */
async function writeResultAsync(data, fileName) {
    try {
        await fs.writeFile(fileName, data, {
            encoding: 'utf-8'
        });
    } catch (fileWriteError) {
        await log.errorToFileAsync(fileWriteError);
    }
}


async function main(sitemapUrl, limit, selector, outputFileName) {
    try {
        const startMessage = 
`
| Looking...                
| Sitemap: ${sitemapUrl},   
| limit: ${limit}           
| CSS Selector: ${selector} 
`
        log.toConsole(startMessage);
        await log.infoToFileAsync(startMessage);
        const { totalPagesSearched, pagesWithSelector } = await SelectorFinder.findSelectorAsync(sitemapUrl, limit, selector);

        const jsonifiedData = jsonifyData(pagesWithSelector);
        
        await writeResultAsync(jsonifiedData, `${outputFileName}.json`);

        const endMessage = `
| Finished
| Scanned ${totalPagesSearched} pages                   
| ${outputFileName}.json
`;
        log.toConsole(endMessage, true);
        await log.infoToFileAsync(endMessage)
    } catch (mainFunctionError) {
        await log.errorToFileAsync(mainFunctionError);
    }
}


main(sitemap, limit, selector, outputFileName);