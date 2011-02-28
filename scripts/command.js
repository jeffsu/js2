#!/usr/bin/env node
require('../dist/js2-node');
process.argv.shift();
process.argv.shift();
var command = new JS2.Command(process.argv);
