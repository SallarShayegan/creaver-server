
module.exports.getRandomID = (prefix, length) => {
  // Returns random id with prefix and digits with the length passed as parameter
  let id = prefix;
  for (let i = 0; i < length; i++) {
    id += Math.floor(Math.random() * 9);
  }
  return id;
}
