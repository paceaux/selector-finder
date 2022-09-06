const { promises } = require('fs');
const Logger = require('../src/logger');

afterAll(async () => {
  await promises.unlink('test.log.txt');
});

describe('Logger', () => {
  const log = new Logger('test.log.txt');

  describe('Logger.styleInfo', () => {
    test('it makes a pretty block', () => {
      const styledInfo = Logger.styleInfo('A Test');

      expect(styledInfo)
        .toMatch(`
=============================
A Test
=============================`);
    });
    test('it adds a timestamp when asked', () => {
      const styledInfo = Logger.styleInfo('A Test', true);

      const expectedResult = `
==============${new Date()}===============`;
      expect(styledInfo.substr(0, 30))
        .toMatch(expectedResult.substr(0, 30));
    });
  });
  describe('timer', () => {
    test('startTimer', () => {
      log.startTimer();

      expect(typeof log.timerStart).toBe('number');
      expect(log.timerStart).toBeLessThanOrEqual(Date.now());
    });
    test('endTimer', () => {
      log.endTimer();

      expect(typeof log.timerEnd).toBe('number');
      expect(log.timerEnd).toBeLessThanOrEqual(Date.now());
      expect(log.timerEnd).toBeGreaterThanOrEqual(log.timerStart);
    });
    test('elapsedTime', () => {
      log.endTimer();

      expect(typeof log.elapsedTime).toBe('number');
      expect(log.elapsedTime).toBeGreaterThanOrEqual(0);
    });
    test('startTimer deletes the timerEnd property', () => {
      log.startTimer();
      expect(log.timerEnd).toBeUndefined();
    });
  });
  describe('toConsole', () => {
    test('raw message', () => {
      const consoleInfo = 'test info';
      log.toConsole('test info');

      expect(log.rawMessage).toMatch(consoleInfo);
    });
  });

  describe('Logger: writing to files', () => {
    test('it writes an error to a file', async () => {
      const error = new Error('test error');

      await log.errorToFileAsync(error);

      const fileContents = await promises.readFile('test.log.txt', { encoding: 'utf-8' });

      expect(fileContents).toContain(error.message);
    });

    test('it writes info to a file', async () => {
      const testInfo = 'test info';
      await log.infoToFileAsync('test info');
      const fileContents = await promises.readFile('test.log.txt', { encoding: 'utf-8' });

      expect(fileContents).toContain(testInfo);
    });
  });
});
