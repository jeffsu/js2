var js2 = require('js2').js2;
var JS2 = js2;
var bar = "bar";
var test1 = "foobar";
var test2 = 'foobar';
var test3 = "foo"+(bar)+"";

js2.test(function(assert){
  assert.eq(test1, 'foobar'); 
  assert.eq(test2, 'foobar'); 
  assert.eq(test3, 'foobar'); 
});
