const Logger = require('../src/logger');

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
      expect(log.timerStart).toBeLessThan(Date.now());
      expect(log.timerEnd).toBeUndefined();
    });
    test('endTimer', () => {
      log.endTimer();

      expect(typeof log.timerEnd).toBe('number');
      expect(log.timerEnd).toBeLessThan(Date.now());
      expect(log.timerEnd).toBeGreaterThan(log.timerStart);
    });
    test('elapsedTime', () => {
      log.endTimer();

      expect(typeof log.elapsedTime).toBe('number');
      expect(log.elapsedTime).toBeGreaterThan(0);
    });
  });
});
