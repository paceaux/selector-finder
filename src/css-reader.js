const { promises } = require('fs');
const cssom = require('cssom');

const { LOG_FILE_NAME } = require('./constants');
const Log = require('./logger');

const log = new Log(LOG_FILE_NAME);
class CSSReader {
  constructor(fileName) {
    if (fileName) {
      this.fileName = fileName;
    }
  }

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

  setRawCSS(rawCSS) {
    if (rawCSS) {
      this.rawCSS = rawCSS;
    }
  }

  get parsedCSS() {
    let parsedCSS;

    if (this.rawCSS) {
      parsedCSS = cssom.parse(this.rawCSS);
    }

    return parsedCSS;
  }

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

module.exports = CSSReader;
