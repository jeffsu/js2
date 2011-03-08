var scope = { foo: 'bar' };

(function(scope){return function($1,$2,$3){

}})(scope);

(function(scope){return function(arg1){

}})(scope);

(function(){return function(arg1){

}})();

(function($this){return function(arg1){

}})(this)
