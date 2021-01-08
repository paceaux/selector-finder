const colors = require('colors/safe');
const { promises } = require('fs');
const fs = promises;

class Log {
    constructor(logFile) {
        this.logFile = logFile;
    }

    /**
     * @description Logs an error to a log file
     * @param  {Error} error
     */
    async errorToFileAsync(error) {
        const rawMessage = error || this.rawMessage;

        this.rawMessage = rawMessage;
        try {
            await fs.appendFile(this.logFile, Log.styleInfo(`${JSON.stringify(rawMessage)}`, true));
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
        const infoMessage= Log.styleInfo(rawMessage);

        this.rawMessage = rawMessage;
        if (isImportant) {
            console.log(colors.bold.white(infoMessage))
        } else {
            console.log(colors.blue(infoMessage));
        }

        return this;
    }
}

module.exports = Log;