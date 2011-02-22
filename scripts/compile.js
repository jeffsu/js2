var Parser = require('../src/js2-core').parser;
var js2file = process.argv[2];

console.log(Parser.parseFile(js2file).toString());
