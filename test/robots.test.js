import { unlink } from 'fs/promises';


import { jest } from '@jest/globals';
import Robots from '../src/robots.js';
import axios from './__mock__/axios.js';

import Outputter from '../src/outputter.js';

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

const MOCK_WITH_COMMENTS = `
User-agent: CCBot# CC Bot
Disallow: /

User-agent: PerplexityBot # Perplexity Bot
Disallow: / # Disallow root

User-agent:*
Allow: /about-me/ # Allow about me
Disallow: /wp-admin/# Disallow admin
Disallow: /wp-includes/
Disallow: /wp-content/plugins/
Disallow: /wp-admin/admin-ajax.php`;

axios.mockImplementation((url) => {
  if (url === 'https://blog.frankmtaylor.com') {
    return Promise.resolve({ data: MOCK_DATA });
  }
});

global.fetch = jest.fn((url) => {
  if (url === 'https://blog.frankmtaylor.com/robots.txt') {
    return Promise.resolve({
      text: () => Promise.resolve(MOCK_DATA),
    });
  }
  if (url === 'https://foo.com/robots.txt') {
    return Promise.resolve({
      text: () => Promise.resolve
    });
  }
});

beforeEach(() => {
  fetch.mockClear();
  axios.mockClear();
});
afterAll(async () => {
  await unlink('blog.frankmtaylor.com.robots.json');
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
    test('robots outputter', () => {
      expect(robots.outputter).toBeInstanceOf(Outputter);
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
        expect(star.size).toEqual(2);
        expect(star.get('disallow')).toEqual(new Set(['/wp-admin/', '/wp-includes/', '/wp-content/plugins/', '/wp-admin/admin-ajax.php']));
      });
      test('allow is correct', () => {
        const rules = Robots.getRules(MOCK_DATA);
        expect(rules.allow.has('/about-me/')).toEqual(true);
      });
      test('rules do not have comments or spaces', () => {
        const rules = Robots.getRules(MOCK_WITH_COMMENTS);
        expect(rules.agents.has('CCBot')).toEqual(true);
        expect(rules.agents.has('PerplexityBot')).toEqual(true);
        expect(rules.agents.has('*')).toEqual(true);
        expect(rules.disallow.has('/wp-admin/')).toEqual(true);
      });
    });
  });
  describe('getters', () => {
    test('exportFileName', () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      expect(robots.exportFileName).toEqual('blog.frankmtaylor.com');
    });
    test('pathToExportedFile', () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      expect(robots.pathToExportedFile).toEqual(`${process.cwd()}/blog.frankmtaylor.com.robots.json`);
    });
    test('pathToDisallowedFile', () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      expect(robots.pathToDisallowedFile).toEqual(`${process.cwd()}/blog.frankmtaylor.com.disallowed.json`);
    });
    test('hasExportedRobots', () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      expect(robots.hasExportedRobots).toEqual(false);
    });
    test('hasExportedDisallowed', () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      expect(robots.hasExportedDisallowed).toEqual(false);
    });
    test('it will have allow, disallow, agents without a url', async () => {
      const robots = new Robots();
      expect(robots.allow.size).toEqual(0);
      expect(robots.disallow.size).toEqual(0);
      expect(robots.agents.size).toEqual(0);
    });
    test('it will have rules with a url', async () => {
      const robots = new Robots();
      expect(robots).toHaveProperty('rules');
      expect(robots.rules).toBeInstanceOf(Object);
    });
    test('it will have properties without a', async () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      await robots.getRulesAsync();
      expect(robots.rules.agents.size).toEqual(6);
      expect(robots.rules.allow.size).toEqual(1);
      expect(robots.rules.disallow.size).toEqual(5);
    });
  });
  describe('method: getRules', () => {
    test('it will throw an error without a url', async () => {
      const robots = new Robots();
      expect(robots.getRulesAsync()).rejects.toThrow('url must not be empty');
    });
    test('it will return the rules', async () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      const rules = await robots.getRulesAsync();
      expect(rules.agents.size).toEqual(6);
      expect(rules.allow.size).toEqual(1);
      expect(rules.disallow.size).toEqual(5);
    });
  });
  describe('method: toJson', () => {
    test('it will return a JSON string', () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      const parsed = JSON.parse(robots.toJSON());
      const jsonified = robots.toJSON();
      expect(typeof jsonified).toEqual('string');
      expect(parsed).toHaveProperty('allow');
      expect(parsed).toHaveProperty('disallow');
      expect(parsed).toHaveProperty('agents');
    });
    test('will return a robust json string with live data', async () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      await robots.getRulesAsync();
      const parsed = JSON.parse(robots.toJSON());
      const jsonified = robots.toJSON();
      expect(typeof jsonified).toEqual('string');
      expect(parsed).toHaveProperty('allow');
      expect(parsed).toHaveProperty('disallow');
      expect(parsed).toHaveProperty('agents');
      expect(parsed.agents).toBeInstanceOf(Object);
      expect(parsed.agents['*']).toBeInstanceOf(Object);
      expect(parsed.agents['*']).toHaveProperty('allow');
    });
  });
  describe('method:isUrldisallowed', () => {
    test('will return true if the url is disallowed', async () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      await robots.getRulesAsync();
      expect(robots.isUrlDisallowed('https://blog.frankmtaylor.com/wp-admin/')).toEqual(true);
    });
  });
  describe('method:isUrlExplicityAllowed', () => {
    test('will return true if the url is allowed', async () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      await robots.getRulesAsync();
      expect(robots.isUrlExplicityAllowed('https://blog.frankmtaylor.com/about-me/')).toEqual(true);
    });
  });
  describe('method: exportRobots', () => {
    test('it will export to a file', async () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      await robots.getRulesAsync();
      await robots.exportRobots();
      expect(robots.hasExportedRobots).toEqual(true);
    });
  });
  describe('method: exportDisallowed', () => {
    test('it will export to a file', async () => {
      const robots = new Robots('https://blog.frankmtaylor.com');
      await robots.getRulesAsync();
      await robots.exportDisallowed();
      expect(robots.hasExportedRobots).toEqual(true);
    });
  });
});
