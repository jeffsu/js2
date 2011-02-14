var JS2 = (function (undefined) {
  var JS2   = function () {};
  JS2.Class = function () {};

  function _super() {
    var s = arguments.callee.caller._super;
    if (s) {
      return s.apply(this, arguments);
    }
  }

  JS2.Class.extend = function (klassDef) {
    var ret = function () { this.initialize.apply(this, arguments) };

    for (var k in klassDef) {
      if (klassDef.hasOwnProperty(k)) {
        ret.prototype[k] = klassDef[k];
      } 
    }  

    for (var k in this.prototype) {
      if (this.prototype.hasOwnProperty(k) ) {
        if (!(k in ret.prototype)) {
          ret.prototype[k] = this.prototype[k];
        } else {
          ret.prototype[k]._super = this.prototype[k];
        }
      }
    }

    for (var k in this) {
      if (this.hasOwnProperty(k)) ret[k] = this[k];
    }

    if (! 'initialize' in ret.prototype) {
      ret.prototype.initialize = function () {}; 
    }

    ret.prototype.super = _super;


    return ret;
  };

  return JS2;
})();

exports.JS2 = JS2;
