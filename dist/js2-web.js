(function () {
  // CLASS HELPERS
(function (undefined, JS2) {
  JS2.Class = function () { this.initialize.apply(this, arguments) };

  function _super () {
    var s = arguments.callee.caller._super;
    if (s) return s.apply(this, arguments);
  };

  JS2.Class.prototype.initialize = function () {};

  JS2.Class.extend = function (klassDef, name) {
    // TODO make more efficient
    var ret   = function () { this.initialize.apply(this, arguments) };
    var proto = Object.create(this.prototype);
    ret.prototype = proto;

    for (var k in this) {
      if (this.hasOwnProperty(k)) ret[k] = this[k];
    }

    for (var k in klassDef) {
      if (klassDef.hasOwnProperty(k)) {
        if (proto[k]) klassDef[k]._super = proto[k];
        proto[k] = klassDef[k];
      } 
    }  

    if (! 'initialize' in ret.prototype) {
      proto.initialize = function () {}; 
    }

    proto.super = _super;
    return ret;
  };

  JS2.Class.addStaticMethod = function (name, method) {
    if (this.hasOwnProperty(name)) {
      method._super = this[name]._super;
    } else if (this[name]) {
      method._super = this[name];
    }

    this[name] = method;
  };

  JS2.Class.addMethod = function (name, method) {
    // method exists, override
    if (this.prototype.hasOwnProperty(name)) {
      method._super = this.prototype[name]._super;
    } 
    
    // inheritted method, use super
    else if (this.prototype[name]) {
      method._super = this.prototype[name];      
    }

    this.prototype[name] = method;
  };

  JS2.Class.include = function (mixin) {
    var proto = ret.prototype;
    var mixinProto = mixin.prototype;

    for (var k in mixinProto) {
      if (mixinProto.hasOwnProperty(k)) {
        if (!proto.hasOwnProperty(k)) {
          ret.prototype[k] = mixinProto[k];
	      }
      } 
    }  

    if (! 'initialize' in ret.prototype) {
      ret.prototype.initialize = function () {}; 
    }

    ret.prototype.$super = _super;
    return ret;
  };


  return JS2;
})(undefined, JS2);

});
