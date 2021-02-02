// eslint-disable-next-line max-classes-per-file
class PageSearchResult {
  constructor(url, elements) {
    this.url = url;
    this.elements = elements;
  }

  get totalMatches() {
    return this.elements.length;
  }
}

class SiteSearchResult extends Array {
  get totalMatches() {
    let total = 0;

    this.forEach((match) => {
      if (match.totalMatches) {
        total += match.totalMatches;
      }
    });

    return total;
  }
}

module.exports = { SiteSearchResult, PageSearchResult };
