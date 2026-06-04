import * as cheerio from 'cheerio';

/**
 * A single search result that is an HTML element
 * @class ElementSearchResult
 * @classdesc A data structure for a single element that's a search result.
 */
export default class ElementSearchResult {
  /**
   * Creates an instance of ElementSearchResult
   * @param {HTMLElement} element - The element object to extract information from
   */

  constructor(element) {
    /**
     * @public
     * @type {string} The inner text content of the element
     */
    this.tag = element.name || element.localName;

    this.applyAttributes(element);

    /**
     * @public
     * @type {string} The inner text content of the element
     */
    this.innerText = element.text || element.innerText;

    /**
     * @public
     * @type {string} The CSS selector that matches this element
     */
    this.selector = element.cssSelector || element.selector;

    /**
     * @public
     * @type {CheerioAPI} Cheerio's API
     */
    this.html = cheerio.load(element, null, false);
  }

  /**
   * Gets attributes from an element and returns them as an object
   * @static
   * @param {Object} element - The element to extract attributes from
   * @returns {Object|null} An object containing attribute name-value pairs, or null if none
   *  exist
   */
  static extractAttributes(element) {
    let attributes = null;
    const elAttributes = element.attribs || element.attributes;
    if (elAttributes && elAttributes.length > 0) {
      attributes = {};

      [...element.attributes].forEach((attribute) => {
        const { name, value } = attribute;
        attributes[name] = value;
      });
    }
    return attributes;
  }

  /**
   * Applies attributes from an element to this instance if they exist
   * @param {Node} element - The element containing attributes to apply
   */
  applyAttributes(element) {
    const attributes = element.attribs || element.attributes;
    if (attributes && Object.keys(attributes).length > 0) {
      /**
       * @public
       * @type {NamedNodeMap|undefined} - a map of attributes
       */
      this.attributes = attributes;
    }
  }
}
