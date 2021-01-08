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
        try {
            await fs.appendFile(this.logFile, Log.styleInfo(`${JSON.stringify(error)}`, true));
        } catch (errorLoggingError) {
            console.log('That sucks. Couldn\'t write the error');
            console.error(errorLoggingError);
        }
    }

    async infoToFileAsync(info) {
        try {
            await fs.appendFile(this.logFile, Log.styleInfo(info, true));
        } catch (errorLoggingError) {
            console.log('That sucks. Couldn\'t write the error');
            console.error(errorLoggingError);
        }
    }

    static styleInfo(info, showTimestamp = false) {

        return `
==============${showTimestamp ? new Date() : ''}===============
${info}
=============================
`;
    }

    toConsole(info, isImportant) {
        const infoMessage= Log.styleInfo(info);
        
        if (isImportant) {
            console.log(colors.bold.white(infoMessage))
        } else {
            console.log(colors.blue(infoMessage));
        }
    }
}

module.exports = Log;