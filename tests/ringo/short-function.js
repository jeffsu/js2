var js2 = require('js2').js2;
var JS2 = js2;
var simple = function($1,$2,$3){ return $1; };
var args   = function(foo){ return foo };

var scopeVar = "hello";

var scope  = (function(scopeVar){return function(foo){ return scopeVar; };})(scopeVar);
var scope2 = (function(scopeVar){return function(){ return scopeVar; };})(scopeVar);

var boundVar = { hello: 'hello' };

var bound  = (function(__self){var f = function($1,$2,$3){ return this.hello; }; return function() { return f.apply(__self, arguments)};})(boundVar);
var bound2 = (function(__self,scopeVar){var f = function(foo){ return this.hello + foo + scopeVar; }; return function() { return f.apply(__self, arguments)};})(boundVar,scopeVar);
var bound3 = (function(__self,scopeVar){var f = function(){ return this.hello + scopeVar; }; return function() { return f.apply(__self, arguments)};})(boundVar,scopeVar);

js2.test(function(assert){
  assert.eq(simple('foo'), 'foo');
  assert.eq(args('foo'), 'foo');
  assert.eq(scope(), 'hello');
  assert.eq(scope2(), 'hello');
  assert.eq(bound(), 'hello');
  assert.eq(bound2('world'), 'helloworldhello');
  assert.eq(bound3(), 'hellohello');
});
