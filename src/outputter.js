import { promises } from 'fs';
import process from 'process';
import path from 'path';

import { LOG_FILE_NAME, DEFAULT_OUTPUT_FILE } from './constants.js';
import { jsonifyData } from './utils.js';
import Log from './logger.js';

const fs = promises;

/**
 * @class Outputter
 * @classdesc For writing any files to the file system
 */
export default class Outputter {
  /**
   * Creates an instance of Outputter
   * @param {string} [defaultOutputFile=DEFAULT_OUTPUT_FILE] - The file to output
   * @param {Log} logger - An instance of Log
   */
  constructor(defaultOutputFile = DEFAULT_OUTPUT_FILE, logger = new Log(LOG_FILE_NAME)) {
    /**
     * @public
     * @type {string} - defaultFilename for outputting
     */
    this.defaultOutputFile = defaultOutputFile;

    /**
     * @public
     * @type {Log} - Logger
     */
    this.log = logger;
  }

  /**
   * Outputs the results to a file
   * @param  {object|string} data - data to write to the file
   * @param  {string} fileName - name of the file to create
   * @returns {Promise<void>}
   */
  async writeFileAsync(data, fileName) {
    if (!data || !fileName) {
      throw new Error('No data or filename provided');
    }

    const fullFileAndPath = path.resolve(process.cwd(), fileName);

    try {
      await fs.writeFile(fullFileAndPath, data, {
        encoding: 'utf-8',
      });
    } catch (fileWriteError) {
      await this.log.errorToFileAsync(fileWriteError);
    }
  }

  /**
   * Stringifies an object and writes it to a file.
   * @description If a filename is not given, the filename is the default.
   *  If a filename is given, it's prepended to the default filename
   * @param  {object} data - An object to write to the file
   * @param  {string} [fileName = DEFAULT_OUTPUT_FILE] - Name of the file.
   * @returns {Promise} an empty promise if successful
   */
  async writeDataAsync(data, fileName) {
    let outputFileName = this.defaultOutputFile;

    if (fileName !== this.defaultOutputFile) {
      outputFileName = `${fileName}.${outputFileName}`;
    }

    const fullFileAndPath = path.resolve(process.cwd(), outputFileName);

    try {
      const jsonifiedData = jsonifyData(data);

      await this.writeFileAsync(jsonifiedData, fullFileAndPath);
    } catch (writeDataAsyncError) {
      await this.log.errorToFileAsync(writeDataAsyncError);
    }
  }
}
