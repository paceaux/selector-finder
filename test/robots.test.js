import { jest } from '@jest/globals';
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
Allow: /about-me/
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /wp-content/plugins/
Disallow: /wp-admin/admin-ajax.php`;

axios.mockImplementation((url) => {
  if (url === 'https://blog.frankmtaylor.com') {
    return Promise.resolve({ data: MOCK_DATA });
  }
});

global.fetch = jest.fn(() => Promise.resolve({
  text: () => Promise.resolve(MOCK_DATA),
}));

beforeEach(() => {
  fetch.mockClear();
  axios.mockClear();
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
    test('it will create a new instance of Robots with a URL', () => {
      const robots = new Robots(new URL('http://foo.com'));
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
  describe('static getRules', () => {
    test('it will return an object even without text', () => {
      expect(Robots.getRules()).toBeInstanceOf(Object);
    });
    test('it will always return an object with agents, allow, disallow', () => {
      const rules = Robots.getRules();
      expect(rules).toHaveProperty('agents');
      expect(rules).toHaveProperty('allow');
      expect(rules).toHaveProperty('disallow');
    });
    describe('rule types are correct', () => {
      test('the thing returned is an object', () => {
        const rules = Robots.getRules(MOCK_DATA);
        expect(rules).toBeInstanceOf(Object);
      });
      test('the agents will be a map', () => {
        const rules = Robots.getRules();
        expect(rules.agents).toBeInstanceOf(Map);
      });
      test('the allow will be a set', () => {
        const rules = Robots.getRules();
        expect(rules.allow).toBeInstanceOf(Set);
      });
      test('the disallow will be a set', () => {
        const rules = Robots.getRules();
        expect(rules.disallow).toBeInstanceOf(Set);
      });
    });
    describe('parsing', () => {
      test('it will parse the rules', () => {
        const rules = Robots.getRules(MOCK_DATA);
        expect(rules.agents.size).toEqual(6);
        expect(rules.allow.size).toEqual(1);
        expect(rules.disallow.size).toEqual(5);
      });
      test('agents are correct', () => {
        const rules = Robots.getRules(MOCK_DATA);
        expect(rules.agents.has('GPTBot')).toEqual(true);
        expect(rules.agents.has('PerplexityBot')).toEqual(true);
        expect(rules.agents.has('*')).toEqual(true);
      });
      test('agent of * has all correct rules', () => {
        const rules = Robots.getRules(MOCK_DATA);
        const star = rules.agents.get('*');
        expect(star).toEqual(['/about-me/', '/wp-admin/', '/wp-includes/', '/wp-content/plugins/', '/wp-admin/admin-ajax.php']);
      });
      test('allow is correct', () => {
        const rules = Robots.getRules(MOCK_DATA);
        expect(rules.allow.has('/about-me/')).toEqual(true);
      });
    });
  });
});
