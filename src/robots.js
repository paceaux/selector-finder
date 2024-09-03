import { LOG_FILE_NAME } from './constants.js';
import Log from './logger.js';

const log = new Log(LOG_FILE_NAME);

const DEFAULT_CONFIG = {
  url: '',
};

const DEFAULT_LIBRARIES = {

};

export default class Robots {
  /**
   * @param  {Object|string|URL} [config=DEFAULT_CONFIG] - Config or url of base site
   * @param  {Object} [libraries=DEFAULT_LIBRARIES] - The libraries to use for the robots.txt file
   */
  constructor(config, libraries) {
    const safeConfig = {};
    if (typeof config === 'string' || config instanceof URL) {
      safeConfig.url = config;
    }
    this.config = { ...Robots.defaultConfig, ...safeConfig };
    this.libraries = { ...Robots.defaultLibraries, ...libraries };
    this.robotsText = '';
  }

  /**
   * @returns {Object} - The default config for the class
   */
  static get defaultConfig() {
    return DEFAULT_CONFIG;
  }

  /**
   * @returns {Object} - The default libraries for the class
   */
  static get defaultLibraries() {
    return DEFAULT_LIBRARIES;
  }

  /**
   * @returns {string} - The url to the robots.txt file for the site
   */
  get robotsUrl() {
    return Robots.getRobotsUrl(this.config.url);
  }

  /**
     * @param  {string|URL} url - The URL to get the robots.txt file from
     * @returns {string} - A url with /robots.txt at the end
     */
  static getRobotsUrl(url) {
    const isURL = url instanceof URL;
    const isString = typeof url === 'string';
    if (!isURL && !isString) {
      throw new Error('url must be a string or URL');
    }
    if (isString && url === '') {
      throw new Error('url must not be empty');
    }
    const safeUrl = !isURL ? new URL(url) : url;
    const hasRobots = safeUrl.pathname.endsWith('robots.txt');
    if (!hasRobots) {
      safeUrl.pathname = 'robots.txt';
    }
    return safeUrl.href;
  }

  /**
   * @param  {string|URL} url - the url of the robots file
   * @returns {Promise<string>} - the text of the robots file
   */
  static async getRobotsFile(url) {
    let result;
    const cleanUrl = Robots.getRobotsUrl(url);
    try {
      const response = await fetch(cleanUrl);
      const text = await response.text();
      result = text;
    } catch (error) {
      await log.errorToFileAsync(error);
    }
    return result;
  }

  /**
   * @typedef {Object} RobotsRules
   * @property {Map} agents - The rules for each agent
   * @property {Set} allow - The paths that are allowed
   * @property {Set} disallow - The paths that are disallowed
   */

  /**
   * @param  {string} robotsText
   * @returns {RobotsRules} - The rules of the robots file
   */
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
        if (!agents.has(agent)) {
          agents.set(agent, []);
        }
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

  /**
   * @returns {RobotsRules} - The rules of the robots file
   */
  get rules() {
    return Robots.getRules(this.robotsText);
  }

  /**
   * @returns {Set} - The paths that are allowed
   */
  get allow() {
    return this?.rules?.allow || new Set();
  }

  /**
   * @returns {Set} - The paths that are disallowed
   */
  get disallow() {
    return this?.rules?.disallow || new Set();
  }

  /**
   * @returns {Map} - The rules for each agent
   */
  get agents() {
    return this?.rules?.agents || new Map();
  }

  /**
   * @param  {string|URL} [url=this.robotsUrl] - The url of the robots file
   * @returns {Promise<RobotsRules>} - The rules of the robots file
   */
  async getRules(url = this.robotsUrl) {
    let rules = {
      agents: new Map(),
      allow: new Set(),
      disallow: new Set(),
    };
    try {
      const robotsText = await Robots.getRobotsFile(url);
      this.robotsText = robotsText;
      rules = Robots.getRules(robotsText);
    } catch (getRulesError) {
      await Log.errorToFileAsync(getRulesError);
    }

    return rules;
  }

  /**
   * @returns {string} - The JSON representation of the class
   */
  toJSON() {
    const data = {
      url: this.config.url,
      robotsUrl: this.robotsUrl,
      allow: [...this.allow],
      disallow: [...this.disallow],
      agents: [...this.agents],
    };

    return JSON.stringify(data, null, 2);
  }
}
