import Robots from '../src/robots.js';
import axios from './__mock__/axios.js';

describe('Robots', () => {
  describe('properties', () => {
    const robots = new Robots();
    test('robots text', () => {
      expect(robots.robotsText).toEqual('');
    });
    test('robots url', () => {
      expect(robots.robotsUrl).toEqual('/robots.txt');
    });
    test('robots rules', () => {
      expect(robots.rules).toBeInstanceOf(Object);
    });
  });
  describe('defaultLibraries', () => {
    test('it has default libraries', () => {
      expect(Robots).toHaveProperty('defaultLibraries');
    });
  });
  describe('defaultConfig', () => {
    test('it has default config info', () => {
      expect(Robots).toHaveProperty('defaultConfig');
      expect(Robots.defaultConfig).toHaveProperty('url');
    });
  });
});
