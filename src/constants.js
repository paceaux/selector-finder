/**
 * @description CLI default for a sitemap. Overwritten by --sitemap or -u
 * @constant {string} DEFAULT_SITEMAP_URL - The default sitemap URL; default is https://frankmtaylor.com/sitemap.xml
 */
export const DEFAULT_SITEMAP_URL = 'https://frankmtaylor.com/sitemap.xml';

/**
 * @description Not used. Should be removed
 * @todo remove this later
 */
export const DEFAULT_SHOULD_CRAWL_SITEMAP = false;

/**
 * @description CLI default for output file. Overwritten by --outputFileName, -o
 * @constant {string} DEFAULT_OUTPUT_FILE - the name of the output file
 */
export const DEFAULT_OUTPUT_FILE = 'pages.json';

/**
 * @description CLI default for selector. Overwritten by --selector, -s
 * @constant {string} DEFAULT_SELECTOR - The CSS Selector to look for
 */
export const DEFAULT_SELECTOR = '.title';

/**
 * @description CLI default for handling SPAs. Overwritten by --isSpa, -d
 * @constant {boolean} DEFAULT_IS_SPA - Whether to use Puppeteer
 */
export const DEFAULT_IS_SPA = false;

/**
 * @description CLI default for how many pages to search. Overwritten by --limit, -l
 * @constant {boolean} DEFAULT_LIMIT - Maximum pages
 */
export const DEFAULT_LIMIT = 0;

/**
 * @description CLI default for taking screenshots. Overwritten by --takeScreenshots, -c
 * @constant {boolean} DEFAULT_TAKE_SCREENSHOTS - Whether to take screenshots
 */
export const DEFAULT_TAKE_SCREENSHOTS = false;

/**
 * @description CLI default for outputting element details. Overwritten by --showElementDetails, -e
 * @constant {boolean} DEFAULT_SHOW_ELEMENT_DETAILS - Whether to put attributes, etc in result
 */
export const DEFAULT_SHOW_ELEMENT_DETAILS = false;

/**
 * @description CLI default for outputting html of element. Overwritten by --showHtml, -m
 * @constant {boolean} DEFAULT_SHOW_HTML - Whether to output html in a result
 */
export const DEFAULT_SHOW_HTML = true;

/**
 * @description CLI default for crawling the site. Overwritten by --crawl, -r
 * @constant {boolean} DEFAULT_CRAWL - whether to get urls by crawling, or using sitemap
 */
export const DEFAULT_CRAWL = false;

/**
 * @description Background color for console logging
 * @constant {string} COLOR_COOL - a hexadecimal color that should be a cool hue
 */
export const COLOR_COOL = '#0B6060';

/**
 * @description Foreground (text) color for console logging
 * @constant {string} COLOR_NEUTRAL_LIGHTEST - a hexadecimal color that's neutral and light
 */
export const COLOR_NEUTRAL_LIGHTEST = '#ffffff';

/**
 * @description Log File. Used internally for managing all logging in the app.
 * @constant {string} LOG_FILE_NAME - The name of the log file; default is log.txt
 */
export const LOG_FILE_NAME = 'log.txt';