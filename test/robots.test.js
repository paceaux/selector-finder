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
  describe('static getRobotsUrl', () => {
    test('will provide /robots.txt if nothing else', () => {
      const url = '';
      expect(Robots.getRobotsUrl(url)).toEqual('/robots.txt');
    });
    test('will clean off a trailing slash', () => {
      const url = 'https://frankmtaylor.com/';
      expect(Robots.getRobotsUrl(url)).toEqual('https://frankmtaylor.com/robots.txt');
    });
    test('will add /robots.txt if it is not there', () => {
      const url = 'https://frankmtaylor.com';
      expect(Robots.getRobotsUrl(url)).toEqual('https://frankmtaylor.com/robots.txt');
    });
  });
  describe('static getRobotsFile', () => {
    test('will return the robots.txt file', async () => {
      const url = 'https://blog.frankmtaylor.com';
      const result = await Robots.getRobotsFile(url);
      expect(result).toEqual(MOCK_DATA);
    });
  });
});
