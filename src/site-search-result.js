/**
 * @class SiteSearchResult
 * @classdesc Represents search results for an entire site
 */
export default class SiteSearchResult extends Array {
  /**
 * @property {number} The total matches taken from all results
 */
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
