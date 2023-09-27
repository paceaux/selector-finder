import { promises } from 'fs';

import Outputter from '../src/outputter.js';
import Logger from '../src/logger.js';

const testFileName = 'test.txt';
const customFileName = 'custom';
const testString = 'test information';
const testData = { information: 'test' };
const testLogger = new Logger('test.log.txt');

describe('Outputter', () => {
  describe('properties', () => {
    const outputter = new Outputter(testFileName, testLogger);
    test('default output file', () => {
      expect(outputter.defaultOutputFile).toMatch(testFileName);
    });
    test('it has a built-in logger', () => {
      expect(outputter.log).toBeInstanceOf(Logger);
    });
  });
  describe('writeFileAsync', () => {
    const outputter = new Outputter(testFileName, testLogger);

    afterAll(async () => {
      await promises.unlink(testFileName);
    });
    test('it writes data to a file', async () => {
      await outputter.writeFileAsync(testString, testFileName);

      const fileContents = await promises.readFile(testFileName, { encoding: 'utf-8' });

      expect(fileContents).toContain(testString);
    });
    test('an error happens when it doesn\'t have data ', async () => {
      await expect(outputter.writeFileAsync(undefined, testFileName)).rejects.toThrow();
    });
    test('an error happens when it doesn\'t have a filename ', async () => {
      await expect(outputter.writeFileAsync(testString)).rejects.toThrow();
    });
    test('an error happens when it doesn\'t have a filename or data ', async () => {
      await expect(outputter.writeFileAsync()).rejects.toThrow();
    });
  });
  describe('writeDataAsync', () => {
    const outputter = new Outputter(testFileName, testLogger);

    afterAll(async () => {
      await promises.unlink(testFileName);
      await promises.unlink(`${customFileName}.${testFileName}`);
    });
    test('it writes data to a file', async () => {
      await outputter.writeDataAsync(testData, testFileName);

      const fileContents = await promises.readFile(testFileName, { encoding: 'utf-8' });

      expect(fileContents).toContain(JSON.stringify(testData, null, 2));
    });
    test('it writes a custom filename ', async () => {
      await outputter.writeDataAsync(testData, customFileName);

      const fileContents = await promises.readFile(`${customFileName}.${testFileName}`, { encoding: 'utf-8' });

      expect(fileContents).toContain(JSON.stringify(testData, null, 2));
    });
  });
});
