const { promises } = require('fs');

const fs = promises;

const { LOG_FILE_NAME, DEFAULT_OUTPUT_FILE } = require('./constants');
const { jsonifyData } = require('./utils');
const Log = require('./logger');

const log = new Log(LOG_FILE_NAME);

class Outputter {
  constructor() {

  }

  /** Outputs the results to a file
     * @param  {Map} resultsMap
     * @param  {string} fileName
     */
  static async writeFileAsync(data, fileName) {
    try {
      await fs.writeFile(fileName, data, {
        encoding: 'utf-8',
      });
    } catch (fileWriteError) {
      await log.errorToFileAsync(fileWriteError);
    }
  }

  /**
     * @description Stringifies an object and writes it to a file
     * @param  {Object} data
     * @param  {string} fileName
     */
  static async writeDataAsync(data, fileName) {
    let outputFileName = DEFAULT_OUTPUT_FILE;

    if (fileName !== DEFAULT_OUTPUT_FILE) {
      outputFileName = `${fileName}.${outputFileName}`;
    }

    try {
      const jsonifiedData = jsonifyData(data);

      await Outputter.writeFileAsync(jsonifiedData, outputFileName);
    } catch (writeDataAsyncError) {
      await log.errorToFileAsync(writeDataAsyncError);
    }
  }
}

module.exports = Outputter;
