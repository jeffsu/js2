var js2 = require('js2').js2;
var JS2 = js2;
var simple = function($1,$2,$3){ return $1; };
var args   = function(foo){ return foo };

var scopeVar = "hello";

var scope  = (function(scopeVar){return function(foo){ return scopeVar; };})(scopeVar);
var scope2 = (function(scopeVar){return function(){ return scopeVar; };})(scopeVar);

var Foo=exports['Foo']=JS2.Class.extend(  function(KLASS, OO){
  OO.addMember("bound",{ foo: 'incorrect' });
  OO.addMember("foo",'correct');

  OO.addMember("testBound",function () {
    this.bound.test1 = (function(__self){var f = function(){ return this.foo; }; return function() { return f.apply(__self, arguments)};})(this);
  });
});

js2.test(function(assert){
  assert.eq(simple('foo'), 'foo');
  assert.eq(args('foo'), 'foo');
  assert.eq(scope(), 'hello');
  assert.eq(scope2(), 'hello');

  var foo = new Foo();
  foo.testBound();
  assert.eq(foo.bound.test1(), 'correct');
});
