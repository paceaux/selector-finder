import Path from 'path';
import fs from 'fs';

import { LOG_FILE_NAME } from './constants.js';
import Log from './logger.js';
import Outputter from './outputter.js';

const log = new Log(LOG_FILE_NAME);

const DEFAULT_CONFIG = {
  url: '',
  useExportedRobots: true,
};

const DEFAULT_LIBRARIES = {

};

/**
 * @class Robots
 * @description Class for getting a robots.txt file and parsing rules
 * @param  {Object|string|URL} [config=DEFAULT_CONFIG] - Config or url of base site
 * @param  {Object} [libraries=DEFAULT_LIBRARIES] - The libraries to use for the robots.txt file
 * @property {Object} config - The configuration for the class
 * @property {Object} libraries - The libraries to use for the robots.txt file
 * @property {string} robotsText - The text of the robots file
 * @property {Outputter} outputter - The outputter for the class
 * @property {string} exportFileName - The name of the file to export the robots data to
 * @property {string} pathToExportedFile - The path to the exported file
 * @property {string} pathToDisallowedFile - The path to the disallowed file
 * @property {boolean} hasExportedRobots - Determines if the links have already been exported to a file
 * @property {boolean} hasExportedDisallowed - Determines if a disallowed file has already exported
 * @property {Map} 

 */
export default class Robots {
  _existingRules = null;

  /**
   * @description Class for getting a robots.txt file and parsing rules
   * @param  {Object|string|URL} [config=DEFAULT_CONFIG] - Config or url of base site
   * @param  {Object} [libraries=DEFAULT_LIBRARIES] - The libraries to use for the robots.txt file
   */
  constructor(config, libraries) {
    let safeConfig = {};
    if (typeof config === 'string' || config instanceof URL) {
      safeConfig.url = config;
    } else {
      safeConfig = { ...config };
    }
    this.config = { ...Robots.defaultConfig, ...safeConfig };
    this.libraries = { ...Robots.defaultLibraries, ...libraries };
    this.robotsText = '';
    this.outputter = new Outputter('robots.json', log);
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
   * @description the name of the file to export the robots data to
   */
  get exportFileName() {
    return this.robotsUrl
      .replace(/https?:\/\//gi, '')
      .replace(/\/robots/gi, '')
      .replace(/.txt/gi, '');
  }

  /**
   * @description provides a fully qualified path to the robots json file
   * @type {string}
   */
  get pathToExportedFile() {
    return Path.join(process.cwd(), `${this.exportFileName}.${this.outputter.defaultOutputFile}`);
  }

  /**
   * @description provides a fully qualified path to the disallowed json file
   * @type {string}
   */
  get pathToDisallowedFile() {
    return Path.join(process.cwd(), `${this.exportFileName}.disallowed.json`);
  }

  /**
   * @description determines if the links have already been exported to a file
   * @type {boolean}
   */
  get hasExportedRobots() {
    return fs.existsSync(this.pathToExportedFile);
  }

  /**
   * @description determines if a disallowed file has already exported
   * @type {boolean}
   */
  get hasExportedDisallowed() {
    return fs.existsSync(this.pathToDisallowedFile);
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
   * Reads a line from a robots file and determines what the keyname is
   * @static
   * @param  {string} rule
   * @returns {string} - The key of the rule
   */
  static getRuleKey(rule) {
    if (!rule) return '';
    return rule
      .split(':')[0]
      .replace(':', '')
      .toLowerCase()
      .trim();
  }

  /**
   * Reads a line from a robots file and determines what the value is
   * @static
   * @param  {string} rule
   * @returns {string} - The value of the rule
   */
  static getRuleValue(rule) {
    if (!rule) return '';
    return rule
      .split(':')[1]
      .split('#')[0]
      .replace('#', '')
      .trim();
  }

  /**
   * @param  {Map} agents  - a map of the user agents
   * @param  {string} url - the url to test
   * @param  {string} [userAgent='*'] - the user agent to test
   * @param  {boolean} [allowedAnywhere=false] - ignore userAgent and see if allowed anywhere
   * @param  {Set} [allAllowRules=Set()]
   */
  static isUrlExplicityAllowed(agents, url, userAgent = '*', allowedAnywhere = false, allAllowRules = new Set()) {
    if (!url) return false;

    const safeUrl = new URL(url);
    let allowRules = agents.has(userAgent)
      ? [...agents.get(userAgent).get('allow')]
      : [];

    if (allowedAnywhere) {
      allowRules = [...allAllowRules];
    }
    const hasMatches = allowRules
      .some((rule) => safeUrl.pathname.includes(rule));

    return hasMatches;
  }

  /**
   * determines if a url is disallowed based on a map of agents, 
   * @param  {Map} agents - a map of user agents
   * @param  {string} url - the url to test
   * @param  {string} [userAgent='*'] - the user agent to test
   * @param  {boolean} [disallowedAnywhere=false] - ignore userAgent and see if disallowed anywhere
   * @param  {Set} [allDisallowRules=Set()] - all disallow rules
   */
  static isUrlDisallowed(agents, url, userAgent = '*', disallowedAnywhere = false, allDisallowRules = new Set()) {
    if (!agents) return false;
    if (!url) return false;

    const safeUrl = new URL(url);
    let disallowRules = agents.has(userAgent)
      ? [...agents.get(userAgent).get('disallow')]
      : [];

    if (disallowedAnywhere) {
      disallowRules = [...allDisallowRules];
    }

    const hasMatches = disallowRules
      .some((rule) => safeUrl.pathname.includes(rule));

    return hasMatches;
  }

  /**
   * @typedef {Map} AgentRules
   * @property {Set<string>} allow - The paths that are allowed
   * @property {Set<string>} disallow - The paths that are disallowed
   */

  /**
   * @typedef {Object} RobotsRules
   * @property {AgentRules} agents - The rules for each agent
   * @property {Set<string>} allow - The paths that are allowed
   * @property {Set<string>} disallow - The paths that are disallowed
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
      if (!cleanLine) return;
      const key = Robots.getRuleKey(cleanLine);
      const value = Robots.getRuleValue(cleanLine);

      switch (key) {
        case 'user-agent':
          // declare the currentAgent here
          currentAgent = value;
          if (!agents.has(value)) {
            // if it doesn't exist, create it with empty Map
            const agentMap = new Map([
              ['allow', new Set()],
              ['disallow', new Set()],
            ]);
            agents.set(value, agentMap);
          }
          break;
        case 'disallow':
          // add to the disallow list
          disallow.add(value);
          // add to the agent's list
          agents.get(currentAgent).get('disallow').add(value);
          break;
        case 'allow':
          // add to the allow list
          allow.add(value);
          // add to the agent's list
          agents.get(currentAgent).get('allow').add(value);
          break;
        default:
          break;
      }
    });
    return { agents, allow, disallow };
  }

  set rules(rules) {
    this._existingRules = rules;
  }

  /**
   * @description if robotsText is set, returns the parsed rules of the file
   * @returns {RobotsRules} - The rules of the robots file
   */
  get rules() {
    return this._existingRules || Robots.getRules(this.robotsText);
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
   * @returns {AgentRules} - The rules for each agent
   */
  get agents() {
    return this?.rules?.agents || new Map();
  }

  /**
   * @param  {string} fileName
   * @param  {string[]} [ruleNames=['agents', 'allow', 'disallow']]
   */
  async setRulesFromJsonFile(fileName, ruleNames = ['agents', 'allow', 'disallow']) {
    if (!fileName) return;
    try {
      const savedJson = await fs.promises.readFile(fileName, 'utf-8');
      const savedRules = JSON.parse(savedJson);
      const hasExistingAgents = this.rules.agents.size > 0;
      const hasExistingAllow = this.rules.allow.size > 0;
      const hasExistingDisallow = this.rules.disallow.size > 0;

      const currentAgents = hasExistingAgents ? this.rules.agents : new Map();
      const currentAllow = hasExistingAllow ? this.rules.allow : new Set();
      const currentDisallow = hasExistingDisallow ? this.rules.disallow : new Set();

      const url = savedRules.url || savedRules.config.url || this.config.url;
      const agents = ruleNames.includes('agents')
         ? new Map(savedRules.agents || savedRules)
          : currentAgents;
      const allow = ruleNames.includes('allow') 
        ? new Set(savedRules.allow || savedRules)
        : currentAllow;
      const disallow = ruleNames.includes('disallow')
        ? new Set(savedRules.disallow || savedRules)
        : currentDisallow;
      const existingRules = { agents, allow, disallow };
      this.rules = existingRules;
      this.config.url = url;
    } catch (setRulesError) {
      await log.errorToFileAsync(setRulesError);
    }
  }

  /**
   * @description gets the rules from from the robotsUrl property
   * @param  {string|URL} [url=this.robotsUrl] - The url of the robots file
   * @param  {boolean} [useExportedRobots=this.config.useExportedRobots] - Use the exported robots file
   * @returns {Promise<RobotsRules>} - The rules of the robots file
   */
  async getRulesAsync(url = this.robotsUrl, useExportedRobots = this.config.useExportedRobots) {
    const shouldNotProduceRobots = useExportedRobots && this.hasExportedRobots;

    if (shouldNotProduceRobots) {
      await this.setRulesFromJsonFile(this.pathToExportedFile);
      return this.rules;
    }

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
   * @description checks if the url is disallowed based on the rules
   * @param  {string} url - url to check
   * @param  {string} [userAgent='*'] name of user agent
   * @param  {boolean} [disallowedAnywhere=false] ignore user agent, see if disallowed anywhere
   */
  isUrlDisallowed(url, userAgent = '*', disallowedAnywhere = false) {
    if (!url) return false;

    return Robots.isUrlDisallowed(this.agents, url, userAgent, disallowedAnywhere, this.disallow);
  }

  /**
   * @description checks if the url is explicitly allowed,
   *  robots is meant to exclude, not include. So this is here to
   * check if a url was written out specifically
   * @param  {string|URL} url url to validate
   * @param  {string} [userAgent='*'] name of user agent
   * @param  {boolean} [allowedAnywhere=false] ignore user agent and check if allowed anywhere
   */
  isUrlExplicityAllowed(url, userAgent = '*', allowedAnywhere = false) {
    if (!url) return false;

    return Robots.isUrlExplicityAllowed(this.agents, url, userAgent, allowedAnywhere, this.allow);
  }

  /**
   * @description creates a stringified JSON object of agents, or the agents on this object
   * @param  {Object} [data=this] - The data
   * @returns {string} - The JSON representation of the class
   */
  toJSON(dataObject = this) {
    const agentObject = {};
    const agents = dataObject.agents || this.agents || new Map();
    agents.forEach((value, key) => {
      agentObject[key] = {
        allow: [...value.get('allow')],
        disallow: [...value.get('disallow')],
      };
    });
    const allow = dataObject.allow || this.allow || new Set();
    const disallow = dataObject.disallow || this.disallow || new Set();
    const url = dataObject.url || dataObject.config?.url || this.config.url;
    const robotsUrl = Robots.getRobotsUrl(url);
    const data = {
      url,
      robotsUrl,
      allow: [...allow],
      disallow: [...disallow],
      agents: agentObject,
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * @description exports the robots data to a file
   * @param  {string} [fileName=this.exportFileName] name for the file the data is exported to
   */
  async exportRobots(fileName = this.exportFileName) {
    try {
      await this.outputter.writeDataAsync(JSON.parse(this.toJSON()), fileName);
    } catch (exportRobotsError) {
      await log.errorToFileAsync(exportRobotsError);
    }
  }

  /**
   * @description exports the disallowed paths to a json file
   * @param  {string} [agent='*'] the user agent whose disallow rules should be exported
   */
  async exportDisallowed(agent = '*') {
    const disallowedIterable = this.agents.get(agent)?.get('disallow') || [];
    const disallowed = [...disallowedIterable];
    try {
      const outputter = new Outputter('disallowed.json', log);
      await outputter.writeDataAsync(disallowed, `${this.exportFileName}`);
    } catch (exportDisallowedError) {
      await log.errorToFileAsync(exportDisallowedError);
    }
  }
}
