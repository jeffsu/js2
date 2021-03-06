var js2 = require('js2').js2;
var JS2 = js2;
var JSML=exports['JSML']=JS2.Class.extend( function(KLASS, OO){
  OO.addStaticMember("process",function (txt) {
    return new KLASS(txt);
  });

  OO.addMember("initialize",function (txt) {
    var lines = txt.split(/\n/);
    this.root    = new JS2.JSMLElement('');
    this.current = this.root;
    this.stack   = [ this.root ];
  });
});

var JSMLElement=exports['JSMLElement']=JS2.Class.extend( function(KLASS, OO){

  OO.addMember("initialize",function (line) {
    this.nodeID   = null;

    this.parse(spaceMatch[2]);
  });
});




var Foo=exports['Foo']=JS2.Class.extend( function(KLASS, OO){
  OO.addMember("member","member");
  OO.addMember("regexMember",/member/);
  OO.addMember("stuffs",[ 'hello', 'world' ]);
  OO.addStaticMember("hello","hello");

  OO.addMember("getStuffs",function () {
    return this.stuffs;
  });

  OO.addMember("sayHi",function () {
    for(var _i1=0,_c1=this.getStuffs(),_l1=_c1.length,stuff;(stuff=_c1[_i1])||(_i1<_l1);_i1++){
      console.log(stuff);
    }
  });

  OO.addStaticMember("sayHello",function () {
    return "hello";
  });
});

var Bar=exports['Bar']=JS2.Class.extend( function(KLASS, OO){
  OO.addMember("foo","foo");
  OO.addMember("initialize",function () {
    this.foo = 'bar';
  });
});

JS2.test(function(assert){
  var test = new Foo(); 
  assert.eq('hello', test.getStuffs()[0]);
  assert.eq('hello', Foo.sayHello());
  assert.eq('hello', Foo.hello);
});

