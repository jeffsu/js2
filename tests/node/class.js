var js2 = require('js2').js2;
var JS2 = js2;
var Foo=exports['Foo']=JS2.Class.extend( function(KLASS){
  KLASS.oo.addMember("member","member");
  KLASS.oo.addMember("regexMember",/member/);
  KLASS.oo.addMember("stuffs",[ 'hello', 'world' ]);

  KLASS.oo.addMember("getStuffs",function () {
    return this.stuffs;
  });

  KLASS.oo.addMember("sayHi",function () {
    for(var _i4=0,_c4=this.getStuffs(),_l4=_c4.length,stuff;stuff=_c4[_i4]||_i4<_l4;_i4++){
      console.log(stuff);
    }
  });
});

JS2.test(function(assert){
  var test = new Foo(); 
  assert.eq('hello', test.getStuffs()[0]);
});

