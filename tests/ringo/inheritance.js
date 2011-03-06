var js2 = require('js2').js2;
var JS2 = js2;
var Foo=exports['Foo']=JS2.Class.extend( {
  hello:function () {
    return "hello";
  }

});

var Bar=exports['Bar']=Foo.extend( {
  hello:function () {
    return this.$super(); 
  } 
});

js2.test(function(assert){
  var bar = new Bar();
  assert.eq(bar.hello(), "hello");
});
