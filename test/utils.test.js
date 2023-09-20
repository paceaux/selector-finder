import { convertMapToObject, jsonifyData } from '../src/utils.js';

describe('utils', () => {
  describe('convertMapToObject', () => {
    const testMap = new Map([['foo', 'bar']]);
    const testObject = { foo: 'bar' };
    test('returns the object if it is given an object', () => {
      const converted = convertMapToObject(testObject);

      expect(converted).toBe(testObject);
    });
    test('returns a map if given an object', () => {
      const converted = convertMapToObject(testMap);

      expect(converted).toMatchObject(testObject);
    });
  });

  describe('jsonifyData', () => {
    test('converts object with old primitives to a formatted string', () => {
      const testObject = {
        string: 'string',
        number: 1,
        boolean: false,
        array: ['string'],
      };
      const converted = jsonifyData(testObject);

      expect(converted)
        .toMatch(`{
  "string": "string",
  "number": 1,
  "boolean": false,
  "array": [
    "string"
  ]
}`);
    });
    test('converts a map to an object', () => {
      const testMap = new Map([['foo', 'string'], ['number', 1]]);

      const converted = jsonifyData(testMap);

      expect(converted)
        .toMatch(`{
  "foo": "string",
  "number": 1
}`);
    });
  });
});
