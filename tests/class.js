(function() {return JS2.Class.extend('Test1.Foo', {
  "member":"member",
  "regexMember":/member/,
  "stuffs":[ 'hello', 'world' ],

  getStuffs:function () {
    return this.stuffs;
  },

  sayHi:function () {
    for(var _i4=0,_c4=this.getStuffs(),_l4=_c4.length,stuff;stuff=_c4[_i4]||_i4<_l4;_i4++){
      console.log(stuff);
    }
  }
})})();

JS2.test(function(assert){
  var test = new Test1.Foo(); 
  assert.eq('hello', test.getStuffs()[0]);
});

