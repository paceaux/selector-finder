/**
 * @description Asynchronous foreach
 * @param  {array} array items to iterate over
 * @param  {function} callback asynchronous callback to execute
 */
async function forEachAsync(array, callback) {
  for (let index = 0; index < array.length; index += 1) {
    // the entire friggin' point of this function is this problem
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
}

/**
 * @description Converts a map to an Object so that it can be JSONified
 * @param  {Map} map
 *
 * @returns {Object}
 */
function convertMapToObject(map) {
  if (Object.getPrototypeOf(map) !== Map.prototype) {
    return map;
  }

  const convertedMap = {};

  map.forEach((value, key) => {
    convertedMap[key] = value;
  });

  return convertedMap;
}

/**
 * @description It makes Data JSON Data
 * @param  {Object} data
 *
 * @returns {string}
 */
function jsonifyData(data) {
  const convertedMap = convertMapToObject(data);
  return JSON.stringify(convertedMap, null, 2);
}

module.exports = {
  convertMapToObject,
  forEachAsync,
  jsonifyData,
};
