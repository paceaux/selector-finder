const axios = require('axios');
const cheerio = require('cheerio');
const { Parser } = require('xml2js');

const { LOG_FILE_NAME } = require('./constants');
const { forEachAsync } = require('./utils');
const Log = require('./logger');
const log = new Log(LOG_FILE_NAME);


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

/**
 * @typedef SelectorSearchResult
 * @property {number} totalPagesSearched 
 * @property {Map<String, Object>} pagesWithSelector 
 */

/**
 * Finds a CSS selector on a site using a sitemap
 * @param  {string} sitemapUrl
 * @param  {number} limit total pages to search
 * @param  {string} selector CSS selector
 *
 * @returns {SelectorSearchResult}
 */
async function findSelectorAsync(sitemapUrl, limit, selector) {
    let result = null;

    try {

        const sitemapJson = await getSitemapAsync(sitemapUrl);
        const urls = sitemapJson.urlset.url.slice(0, limit || sitemapJson.urlset.url.length - 1);
        const pagesWithSelector = await searchPagesAsync(urls, selector);
        
        result =  {
            totalPagesSearched: urls.length,
            pagesWithSelector,
        };

    } catch (findSelectorError) {
        await log.errorToFileAsync(findSelectorError);
    }

    return result;
}

module.exports = {
    findSelectorAsync,
};
