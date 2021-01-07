const axios = require('axios');
const cheerio = require('cheerio');
const { Parser } = require('xml2js');
const { promises } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const fs = promises;
const SITEMAP_URL = 'https://www.exlrt.com/sitemap.xml';
const LOG_FILE_NAME = 'log.txt';

const { forEachAsync, jsonifyData } = require('./utils');
const Log = require('./logger');
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


/**
 * @description Gets an XML Sitemap
 * @param  {string} sitemapUrl fully qualified url
 * 
 * @returns {object} parsed xml
 * 
 */
async function getSitemapAsync(sitemapUrl) {
    try {

        const { data } = await axios(sitemapUrl);
        const parser = new Parser();
        const parsedXml = await parser.parseStringPromise(data);       
        return parsedXml;
    }
    catch (getSitemapError) {
        await log.errorToFileAsync(getSitemapError);
    }
}


/**
 * @typedef SearchPageResult
 * @property {string} url Url of the page with a result
 * @property {object} elements a cheerio object with the results
 */

/**
 * @description searches a single url for a selector
 * @param  {string} url
 * @param  {string} selector a valid css selector
 * 
 * @returns {null|SearchPageResult}
 */
async function searchPageAsync(url, selector) {
        let result = null;

        if (!url || !selector) {
            await log.errorToFileAsync(new Error('Tried to search on a page with invalid url or selector'));
            return result;
        }

        try {
            const { data } = await axios(url);
            const $ = cheerio.load(data);
            const elements = $(selector);

            if (elements.length > 0) {
                result = {url, elements};
            }
        } catch (searchPageError) {
            await log.errorToFileAsync(searchPageError);
        }

        return result;
}


/**
 * @description Searches all pages provided from JSON object
 * @param  {Object} sitemapJson JSON object generated from sitemap
 * @param  {string} selector CSS Selector
 * 
 * @returns {Map<String, Object>}
 */
async function searchPagesAsync(sitemapJson, selector) {
    const results = new Map();

    try {
        await forEachAsync(sitemapJson, async (sitemapObj) => {
            const result = await searchPageAsync(sitemapObj.loc[0], selector);
            
            if (result) {
                results.set(result.url, result.elements);
            }
        });
    } catch (searchPagesError) {
        await log.errorToFileAsync(searchPagesError);
    }

    return results;
}


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

        const sitemapJson = await getSitemapAsync(sitemapUrl);
        const urls = sitemapJson.urlset.url.slice(0, limit || sitemapJson.urlset.url.length - 1);
        const pagesWithSelector = await searchPagesAsync(urls, selector);
        const jsonifiedData = jsonifyData(pagesWithSelector);
        
        await writeResultAsync(jsonifiedData, `${outputFileName}.json`);

        const endMessage = `
| Finished
| Scanned ${urls.length} pages                   
| ${outputFileName}.json
`;
        log.toConsole(endMessage, true);
        await log.infoToFileAsync(endMessage)
    } catch (mainFunctionError) {
        await log.errorToFileAsync(mainFunctionError);
    }
}


main(sitemap, limit, selector, outputFileName);