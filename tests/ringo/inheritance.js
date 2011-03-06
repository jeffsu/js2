JS2.Class.extend('Foo', {
  hello:function () {
    return "hello";
  }

});

Foo.extend('Bar', {
  hello:function () {
    return this.$super(); 
  } 
});

js2.test(function(assert){
  var bar = new Bar();
  assert.eq(bar.hello(), "hello");
});
