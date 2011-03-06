var curr = (function(){return function($1,$2,$3){
  return "foo"
}})();

var funct = function($1,$2,$3){ return "foo" };

js2.test(function(assert){
  assert.eq("foo", funct());
  assert.eq("foo", curr());
});
