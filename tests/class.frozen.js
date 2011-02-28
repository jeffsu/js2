(function() {return JS2.Class.extend('Test1.Foo', {
  "member":"member",
  "regexMember":/member/,
  "stuffs":[ 'hello', 'world' ],

  getStuffs:function () {
    return this.stuffs;
  },

  sayHi:function () {
    console.log('say hi');
  }
})})();

JS2.test(function(assert){
  var test = new Test1.Foo(); 
  assert.eq('hello', test.getStuffs()[0]);
});

