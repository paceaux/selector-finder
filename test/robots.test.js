import Robots from '../src/robots.js';
import axios from './__mock__/axios.js';

const MOCK_DATA = `User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: *
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /wp-content/plugins/
Disallow: /wp-admin/admin-ajax.php`;

axios.mockImplementation((url) => {
  if (url === 'https://blog.frankmtaylor.com') {
    return Promise.resolve({ data: MOCK_DATA });
  }
});

describe('Robots', () => {
  describe('constructor', () => {
    test('it will create a new instance of Robots', () => {
      const robots = new Robots();
      expect(robots).toBeInstanceOf(Robots);
    });
    test('it will create a new instance of Robots with a string as config', () => {
      const robots = new Robots('http://foo.com');
      expect(robots).toBeInstanceOf(Robots);
    });
    test('it will create a new instance of Robots with a config', () => {
      const robots = new Robots({ url: 'http://foo.com' });
      expect(robots).toBeInstanceOf(Robots);
    });
  });
  describe('properties', () => {
    const robots = new Robots('http://foo.com');
    test('robots text', () => {
      expect(robots.robotsText).toEqual('');
    });
    test('robots url', () => {
      expect(robots.robotsUrl).toEqual('http://foo.com/robots.txt');
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
  describe('static getRobotsUrl', () => {
    test('will not matter if the base has a trailing slash', () => {
      const url = 'https://frankmtaylor.com/';
      expect(Robots.getRobotsUrl(url)).toEqual('https://frankmtaylor.com/robots.txt');
    });
    test('will add /robots.txt if it is not there', () => {
      const url = 'https://frankmtaylor.com';
      expect(Robots.getRobotsUrl(url)).toEqual('https://frankmtaylor.com/robots.txt');
    });
    test('will be fine if sent a URL with /robots.txt', () => {
      const url = new URL('https://frankmtaylor.com/robots.txt');
      expect(Robots.getRobotsUrl(url)).toEqual('https://frankmtaylor.com/robots.txt');
    });
    test('will be fine if sent a URL with /robots.txt', () => {
      const url = new URL('https://frankmtaylor.com/robots.txt');
      expect(Robots.getRobotsUrl(url)).toEqual('https://frankmtaylor.com/robots.txt');
    });
    test('will throw an error if the url is empty', () => {
      const url = '';
      expect(() => Robots.getRobotsUrl(url)).toThrow();
    });
    test('will throw an error if not a string', () => {
      const url = 123;
      expect(() => Robots.getRobotsUrl(url)).toThrow();
    });
  });
  describe('static getRobotsFile', () => {
    test('will return the robots.txt file', async () => {
      const url = 'https://blog.frankmtaylor.com';
      const result = await Robots.getRobotsFile(url);
      expect(result).toEqual(MOCK_DATA);
    });
    test('will return the robots.txt file if a /robots.txt is provided', async () => {
      const url = 'https://blog.frankmtaylor.com/robots.txt';
      const result = await Robots.getRobotsFile(url);
      expect(result).toEqual(MOCK_DATA);
    });
    test('will throw an error if fetch fails', () => {
      const url = 123;
      expect(Robots.getRobotsFile(url)).rejects.toThrow('url must be a string');
    });
  });
});
