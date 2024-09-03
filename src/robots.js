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
   * @description Class for getting a robots.txt file and parsing rules
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
   * @description provides the url to the robots.txt file for the class
   * @returns {string} - The url to the robots.txt file for the site
   */
  get robotsUrl() {
    return Robots.getRobotsUrl(this.config.url);
  }

  /**
     * @description takes the url and makes a robots url from it
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
   * @description gets the robots file from the url
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
   * @description gets the rules from the robots text
   * @param  {string} robotsText
   * @returns {RobotsRules} - The rules of the robots file
   */
  static getRules(robotsText) {
    const safeText = robotsText || ' ';
    const lines = safeText
      .trim()
      .split('\n');

    // set up the data
    // NOTE: I'm not making a robust robots parser. This doesn't account for crawl-delay
    // I don't know where I'd put crawl-delay
    const agents = new Map();
    const allow = new Set();
    const disallow = new Set();

    // declare current agent in outer scsope
    let currentAgent = '';
    lines.forEach((line) => {
      // nix whitespace
      const cleanLine = line.trim();
      if (cleanLine.startsWith('User-agent:')) {
        const agent = line
          .split(':')[1]
          .split('#')[0]
          .replace('#', '')
          .trim();
        // declare the currentAgent here
        currentAgent = agent;
        if (!agents.has(agent)) {
          // if it doesn't exist, create it with empty array
          agents.set(agent, []);
        }
      }
      // either it's disallow or it's allow next
      if (cleanLine.startsWith('Disallow:')) {
        const path = line
          .split(':')[1]
          .split('#')[0]
          .replace('#', '')
          .trim();
        // add to the disallow list
        disallow.add(path);
        // add to the agent's list
        agents.get(currentAgent).push(path);
      } else if (cleanLine.startsWith('Allow:')) {
        const path = line
          .split(':')[1]
          .split('#')[0]
          .replace('#', '')
          .trim();
        // add to the allow list
        allow.add(path);
        // add to the agent's list
        agents.get(currentAgent).push(path);
      }
    });
    return { agents, allow, disallow };
  }

  /**
   * @description if robotsText is set, returns the parsed rules of the file
   * @returns {RobotsRules} - The rules of the robots file
   */
  get rules() {
    return Robots.getRules(this.robotsText);
  }

  /**
   * @description gets the unique allow rules based on robotsText
   * @returns {Set} - The paths that are allowed
   */
  get allow() {
    return this?.rules?.allow || new Set();
  }

  /**
   * @description gets the unique disallow rules based on robotsText
   * @returns {Set} - The paths that are disallowed
   */
  get disallow() {
    return this?.rules?.disallow || new Set();
  }

  /**
   * @description gets the agents based on robotsText
   * @returns {Map} - The rules for each agent
   */
  get agents() {
    return this?.rules?.agents || new Map();
  }

  /**
   * @description gets the rules from from the robotsUrl property
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
   * @description creates a stringified JSON object of the data this class contains
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
