import * as cheerio from 'cheerio';

export default class ElementSearchResult {
  constructor(element) {
    this.tag = element.name || element.localName;
    this.applyAttributes(element);
    this.innerText = element.text || element.innerText;
    this.selector = element.cssSelector || element.selector;
    this.html = cheerio.load(element, null, false);
  }

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

  applyAttributes(element) {
    const attributes = element.attribs || element.attributes;
    if (attributes && Object.keys(attributes).length > 0) {
      this.attributes = attributes;
    }
  }
}
