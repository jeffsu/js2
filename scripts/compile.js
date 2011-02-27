require('../dist/js2-node');
var js2file = process.argv[2];
console.log(JS2.renderFile(js2file));
