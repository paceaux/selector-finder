/* This is a logger; it needs to write to console. */
/* eslint-disable no-console */
import colors from 'chalk';
import process from 'process';
import path from 'path';
import { promises } from 'fs';

const fs = promises;

export default class Log {
  constructor(logFile) {
    this.logFile = path.resolve(process.cwd(), logFile);
  }

  /**
     * @description Logs an error to a log file
     * @param  {Error} error
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

  static styleInfo(info, showTimestamp = false) {
    return `
==============${showTimestamp ? new Date() : ''}===============
${info}
=============================
`;
  }

  toConsole(info, isImportant) {
    const rawMessage = info || this.rawMessage;
    const infoMessage = Log.styleInfo(rawMessage);

    this.rawMessage = rawMessage;
    if (isImportant) {
      console.log(colors.bold.white(infoMessage));
    } else {
      console.log(colors.blue(infoMessage));
    }

    return this;
  }

  startTimer() {
    this.timerStart = Date.now();
    if (this.timerEnd) {
      delete this.timerEnd;
    }
    return this;
  }

  endTimer() {
    this.timerEnd = Date.now();

    return this;
  }

  get elapsedTime() {
    let elapsedTime = null;

    if (this.timerStart && this.timerEnd) {
      elapsedTime = this.timerEnd - this.timerStart;
    }
    return (elapsedTime / 1000);
  }
}
