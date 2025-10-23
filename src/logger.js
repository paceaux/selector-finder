/* This is a logger; it needs to write to console. */
/* eslint-disable no-console */
import chalk from 'chalk';
import boxen from 'boxen';
import process from 'process';
import path from 'path';
import { promises } from 'fs';
import { COLOR_COOL, COLOR_NEUTRAL_LIGHTEST } from './constants.js';

const fs = promises;

/**
 * For logging messages
 * @class Log
 * @classdesc This handles all logging in the application, whether it's
 *   to the terminal or to a log file
 */
export default class Log {
  /**
   * Creates an instance of Log
   * @param {string} [logFile] - The name of the file to log to
   */
  constructor(logFile) {
    this.logFile = path.resolve(process.cwd(), logFile);
  }

  /**
   * Logs an error to a log file
   * @param  {Error} error - an error object
   * @returns {Promise<Log>} - returns the instance so that other methods can be chained
   */
  async errorToFileAsync(error) {
    const rawMessage = error
      ? error.stack
      : this.rawMessage;

    this.rawMessage = rawMessage;
    try {
      await fs.appendFile(this.logFile, Log.styleInfo(this.rawMessage, true));
    } catch (errorLoggingError) {
      console.log('That sucks. Couldn\'t write the error');
      console.error(errorLoggingError);
    }

    return this;
  }

  /**
   * Logs text to a file
   * @param  {string} info - the text to log
   * @returns {Promise<Log>} - returns the instance so that other methods can be chained
   */
  async infoToFileAsync(info) {
    const rawMessage = info || this.rawMessage;

    this.rawMessage = rawMessage;
    try {
      await fs.appendFile(this.logFile, Log.styleInfo(rawMessage, true));
    } catch (errorLoggingError) {
      console.log('That sucks. Couldn\'t write the error');
      console.error(errorLoggingError);
    }

    return this;
  }

  /**
   * Generates a message in a box, optionally with a timestamp as the header
   * @static
   * @param  {string} info - the text to style
   * @param  {boolean} showTimestamp=false - whether to show a timestamp
   */
  static styleInfo(info, showTimestamp = false) {
    return `
==============${showTimestamp ? new Date() : ''}===============
${info}
=============================
`;
  }

  /**
   * Adds a colorful padded box around a message, optionally with a timestamp
   * @static
   * @param  {string} info - the info to style
   * @param  {boolean} showTimestamp=false - whether to show a timestamp
   * @return {boxen} a styled message
   */
  static boxInfo(info, showTimestamp = false) {
    const options = { padding: 1 };
    if (showTimestamp) {
      options.title = (new Date()).toUTCString();
      options.titleAlignment = 'center';
    }
    return boxen(info, options);
  }

  /**
   * Logs a styled message to the console
   * @param  {string} info - the info to style
   * @param  {boolean} isImportant - whether to give the message a background
   * @returns {Promise<Log>} - returns the instance so that other methods can be chained
   */
  toConsole(info, isImportant) {
    const rawMessage = info || this.rawMessage;
    const infoMessage = Log.boxInfo(rawMessage);

    this.rawMessage = rawMessage;
    if (isImportant) {
      console.log(chalk.bgHex(COLOR_COOL).hex(COLOR_NEUTRAL_LIGHTEST)(infoMessage));
    } else {
      console.log(chalk.hex(COLOR_COOL).bold(infoMessage));
    }

    return this;
  }

  /**
   * Starts a timer on the log object (you only get one)
   * @returns {Promise<Log>} - returns the instance so that other methods can be chained
   */
  startTimer() {
    this.timerStart = Date.now();
    if (this.timerEnd) {
      delete this.timerEnd;
    }
    return this;
  }

  /**
   * ends a timer on the log object
   * @returns {Promise<Log>} - returns the instance so that other methods can be chained
   */
  endTimer() {
    this.timerEnd = Date.now();

    return this;
  }

  /**
   * Gets the time between startTimer() and endTimer()
   * @readonly
   * @returns {number} the elapsed time in seconds
   */
  get elapsedTime() {
    let elapsedTime = 0;

    if (this.timerStart && this.timerEnd) {
      elapsedTime = this.timerEnd - this.timerStart;
    }
    return (elapsedTime / 1000);
  }
}
