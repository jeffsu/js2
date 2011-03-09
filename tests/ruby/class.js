JS2.Class.extend('Foo', function(KLASS, OO){
  OO.addMember("member","member");
  OO.addMember("regexMember",/member/);
  OO.addMember("stuffs",[ 'hello', 'world' ]);
  OO.addStaticMember("hello","hello");

  OO.addMember("getStuffs",function () {
    return this.stuffs;
  });

  OO.addMember("sayHi",function () {
    for(var _i4=0,_c4=this.getStuffs(),_l4=_c4.length,stuff;stuff=_c4[_i4]||_i4<_l4;_i4++){
      console.log(stuff);
    }
  });

  OO.addStaticMember("sayHello",function () {
    return "hello";
  });
});

JS2.test(function(assert){
  var test = new Foo(); 
  assert.eq('hello', test.getStuffs()[0]);
  assert.eq('hello', Foo.sayHello());
  assert.eq('hello', Foo.hello);
});

