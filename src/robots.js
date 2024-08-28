import { LOG_FILE_NAME } from './constants.js';
import Log from './logger.js';

const log = new Log(LOG_FILE_NAME);

const DEFAULT_CONFIG = {
  url: '',
};

const DEFAULT_LIBRARIES = {

};

export default class Robots {
  constructor(config, libraries) {
    this.config = { ...Robots.defaultConfig, ...config };
    this.libraries = { ...Robots.defaultLibraries, ...libraries };
    this.robotsText = '';
  }

  static get defaultConfig() {
    return DEFAULT_CONFIG;
  }

  static get defaultLibraries() {
    return DEFAULT_LIBRARIES;
  }

  get robotsUrl() {
    return Robots.getRobotsUrl(this.config.url);
  }

  /**
     * @param  {string} url - The URL to get the robots.txt file from
     * @returns {string} - The URL of the robots
     */
  static getRobotsUrl(url) {
    const safeUrl = url || '';
    let cleanUrl = safeUrl
      .trim()
      .replace(/\/$/, '');

    if (!cleanUrl.endsWith('/robots.txt')) {
      cleanUrl = `${cleanUrl}/robots.txt`;
    }
    return cleanUrl;
  }

  static async getRobotsFile(url) {
    const cleanUrl = Robots.getRobotsUrl(url);
    let result;
    try {
      const response = await fetch(cleanUrl);
      const text = await response.text();
      result = text;
    } catch (error) {
      await log.errorToFileAsync(error);
    }
    return result;
  }

  static getRules(robotsText) {
    const safeText = robotsText || ' ';
    const lines = safeText
      .trim()
      .split('\n');

    const agents = new Map();
    const allow = new Set();
    const disallow = new Set();

    let currentAgent = '';
    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('User-agent:')) {
        const agent = line.split(' ')[1];
        currentAgent = agent;
        agents.set(agent, []);
      }
      if (cleanLine.startsWith('Disallow:')) {
        const path = line.split(' ')[1];
        disallow.add(path);
        agents.get(currentAgent).push(path);
      } else if (cleanLine.startsWith('Allow:')) {
        const path = line.split(' ')[1];
        allow.add(path);
        agents.get(currentAgent).push(path);
      }
    });
    return { agents, allow, disallow };
  }

  get rules() {
    return Robots.getRules(this.robotsText);
  }

  get allow() {
    return this?.rules?.allow || new Set();
  }

  get disallow() {
    return this?.rules?.disallow || new Set();
  }

  get agents() {
    return this?.rules?.agents || new Map();
  }

  async getRules(url = this.robotsUrl) {
    let rules = new Map();
    if (!url) {
      return rules;
    }
    try {
      const robotsText = await Robots.getRobotsFile(url);
      this.robotsText = robotsText;
      rules = Robots.getRules(robotsText);
    } catch (getRulesError) {
      await Log.errorToFileAsync(getRulesError);
    }

    return rules;
  }

  toJSON() {
    const data = {
      robotsUrl: this.robotsUrl,
      allow: [...this.allow],
      disallow: [...this.disallow],
      agents: [...this.agents],
    };

    return JSON.stringify(data, null, 2);
  }
}
