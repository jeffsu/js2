JS2.Class.extend('Foo', function(KLASS, OO){
  OO.addMember("hello",function () {
    return "hello";
  });

});

Foo.extend('Bar', function(KLASS, OO){
  OO.addMember("hello",function () {
    return this.$super(); 
  }); 
});

js2.test(function(assert){
  var bar = new Bar();
  assert.eq(bar.hello(), "hello");
});
