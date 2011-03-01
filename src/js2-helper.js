var JS2 = function(ele) {
  if (ele instanceof Array) {
    return JS2.Array(ele);
  }
};

JS2.Array = function(a) { 
  return new JS2.$Array(a);
};


JS2.$Array = function(a) { this.array = a };

JS2.$Array.prototype = new Array();

JS2.$Array.prototype.each = function(f) { 
  var n = this.array.length;
  for(var i=0; i<n; i++) { f(this.array[i], i) } 
};

JS2.$Array.prototype.reject = function(f) { 
  var ret = [], n = this.array.length;
  for(var i=0; i<n; i++) { 
    if (f(this.array[i], i)) ret.push(this.array[i]);
  } 
  return new JS2.Array(ret);
};

JS2.$Array.prototype.collect = function(f) { 
  var ret = [], n = this.array.length;
  for(var i=0; i<n; i++) {
    ret.push(f(this.array[i], i));
  }
  return new JS2.Array(ret);
};

JS2.$Array.prototype.grep = function(f) { 
  var ret = [], n = this.array.length;
  for(var i=0; i<n; i++) {
    if (f(this.array[i])) ret.push(this.array[i]);
  }
  return new JS2.Array(ret);
};

if (exports) {
  exports.JS2 = JS2;
}
