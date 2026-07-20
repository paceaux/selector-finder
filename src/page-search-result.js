import ElementSearchResult from './element-search-result.js';

/**
 * The results of searching for CSS selectors on a page
 * @class PageSearchResult
 * @classdesc For a collection of results on a single page
 */
export default class PageSearchResult {
  /**
   * Creates an instance of PageSearchResult
   * @param {string} url - The URL of the page being searched
   */
  constructor(url) {
    /**
     * Url of the page
     * @public
     * @type {string}
     */
    this.url = url;

    /**
     * All Element search results
     * @public
     * @type {Array<ElementSearchResult>}
     */
    this.elements = [];

    /**
     * Selectors that were used
     * @public
     * @type {Array<string>}
     */
    this.usedSelectors = [];
  }

  /**
   * Adds unused selectors to the page search result
   * @param {string[]} selectors - Array of CSS selectors that were not found on the page
   */
  addUnusedSelectors(selectors) {
    if (selectors.length > 0) {
      this.unusedSelectors = selectors;
    }
  }

  /**
   * Adds selector errors that occurred during the search process
   * @param {Error[]|string[]} selectorErrors - Array of errors when adding selectors
   */
  addSelectorErrors(selectorErrors) {
    if (selectorErrors.length > 0) {
      if (!this.selectorErrors) this.selectorErrors = [];
      this.selectorErrors.push(...selectorErrors);
    }
  }

  /**
   * Adds a CSS selector to usedSelectors
   * @param {string} selector - The CSS selector that was successfully used on the page
   */
  addUsedSelector(selector) {
    if (this.usedSelectors.indexOf(selector) === -1) {
      this.usedSelectors.push(selector);
    }
  }

  /**
   * Adds element search results from matched DOM nodes
   * @param {object[]} matches - Array of DOM nodes that matched a CSS selector
   * @param {string} cssSelector - The CSS selector used to find the matches
   */
  addElementSearchResults(matches, cssSelector) {
    if (matches.length > 0) {
      for (let idx = 0; idx < matches.length; idx += 1) {
        const node = matches[idx];
        if (!node.selector && cssSelector) node.selector = cssSelector;
        const elementSearchResult = new ElementSearchResult(node);
        this.elements.push(elementSearchResult);
        this.addUsedSelector(elementSearchResult.selector);
      }
    }
  }

  /**
   * Gets the total number of element matches found on this page
   * @readonly
   * @returns {number} The total count of matched elements
   */
  get totalMatches() {
    return this.elements.length;
  }
}
