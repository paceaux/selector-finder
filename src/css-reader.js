import { promises } from 'fs';
import cssom from 'cssom';

import { LOG_FILE_NAME } from './constants.js';
import Log from './logger.js';

const log = new Log(LOG_FILE_NAME);

/**
 * For reading and parsing CSS files
 * @class CSSReader
 * @classdesc This is a convenience wrapper for the cssom.
 *   its job is to get a CSS file and produce its contents
 */
export default class CSSReader {
  /**
   * Creates an instance of CSSReader
   * @param {string} [fileName] - The name of the CSS file to read
   */
  constructor(fileName) {
    if (fileName) {
      /**
       * @public
       * @property {string|undefined} - the name of the CSS file
       */
      this.fileName = fileName;
    }
  }

  /**
   * Reads the contents of a file asynchronously
   * @static
   * @async
   * @param {string} fileName - The name of a file to read from
   * @returns {Promise<string|null>} The contents of the file or null if an error occurs
   */
  static async readFileContents(fileName) {
    let contents = null;

    if (!fileName) {
      throw new Error('FileName not provided');
    }
    try {
      contents = await promises.readFile(fileName, 'utf8');
    } catch (getFileError) {
      await log.errorToFileAsync(getFileError);
    }

    return contents;
  }

  /**
   * Reads the CSS file associated with this instance
   * @async
   * @returns {Promise<string|null>} The contents of the CSS file
   */
  async readFileAsync() {
    let fileContents = null;
    try {
      fileContents = await CSSReader.readFileContents(this.fileName);
      this.setRawCSS(fileContents);
    } catch (readFileError) {
      await log.errorToFileAsync(readFileError);
      throw (readFileError);
    }
    return fileContents;
  }

  /**
   * Sets the CSS on the rawCSS property
   * @param {string} rawCSS - The raw CSS content as a string
   */
  setRawCSS(rawCSS) {
    if (rawCSS) {
      /**
       * @public
       * @property {string|undefined} - the contents of a CSS file
       */
      this.rawCSS = rawCSS;
    }
  }

  /**
   * Gets the parsed CSS as a CSSOM object
   * @readonly
   * @returns {Object|undefined} The parsed CSS object or undefined if no raw CSS is available
   */
  get parsedCSS() {
    let parsedCSS;

    if (this.rawCSS) {
      parsedCSS = cssom.parse(this.rawCSS);
    }

    return parsedCSS;
  }

  /**
   * Gets an array of unique CSS selectors from the parsed CSS
   * @readonly
   * @returns {string[]|undefined} An array of unique CSS selectors or undefined if no parsed CSS
   * is available
   */
  get selectors() {
    let selectors;

    if (this.parsedCSS) {
      const { cssRules } = this.parsedCSS;
      const selectorList = cssRules.map((cssRule) => cssRule.selectorText);
      selectors = [...new Set(selectorList)];
    }

    return selectors;
  }
}
