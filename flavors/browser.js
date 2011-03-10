(function (root) {
  // temporarily set root 
// to JS2 global var for this scope
function mainFunction (arg) {
  if (typeof arg == 'string') {
    return JS2.Parser.parse(arg).toString();
  } else if (arg instanceof Array) {
    return new JS2.Array(arg);
  } else {
    return new JS2.Array();
  }
}


  if (!root.console) {
    root.console = {};
    console.log = function (m) {};
  }

  var JS2 = root.JS2 = mainFunction;
  var js2 = root.js2 = JS2;

  JS2.ROOT = JS2;

  
// CLASS HELPERS
(function (undefined, JS2) {

  var OO = function (klass, par) {
    this.klass = klass;
    this.par   = par;

    this['static'] = {
      methods: {},
      members: {},
    };

    this.methods  = {};
    this.members  = {};
    this.children = [];

    if (this.par) this.par.oo.children.push(klass);
  };

  OO.prototype = {
    forbiddenMembers: { 
      'prototype': undefined, 
      'oo': undefined 
    },

    createNamespace: function(name) {
      var splitted = name.split('.');
      var klassName = splitted.pop();
      var root = JS2.ROOT;

      while (splitted.length > 0) {
        var name = splitted.shift();
        if (!root[name]) root[name] = JS2.Class.extend({});
        root = root[name];
      }

      return [ root, klassName ];
    },

    makeSuper: function(newMethod, oldMethod) {
      if (!oldMethod) return newMethod;

      return function() {
        this.$super = oldMethod;
        return newMethod.apply(this, arguments);
      };
    },

    addMember: function(name, member) {
      if (this.forbiddenMembers.hasOwnProperty(name)) return;

      var proto = this.klass.prototype;
      if (typeof proto[name] == 'function' && !(proto[name] instanceof RegExp)) {
        member = this.makeSuper(member, proto[name]);
      }

      proto[name] = member;
    },

    addStaticMember: function(name, member) {
      if (this.forbiddenMembers.hasOwnProperty(name)) return;

      if (typeof this.klass[name] == 'function') {
        if (!this.klass.hasOwnProperty(name)) {
          member = this.makeSuper(member, this.klass[name]);
        }
      }
      
      this.klass[name] = member;
    }
  };

  JS2.Class = function() { this.initialize.apply(this, arguments); };
  JS2.Class.oo = new OO(JS2.Class);
  JS2.Class.prototype = {
    initialize: function () {},
    oo: JS2.Class.oo
  };

  var namedClasses = {};
  JS2.getClass = function(name) {
    return namedClasses[name];
  };

  var noInit = false;
  JS2.Class.extend = function(name, klassDef) {
    var klass = function() { if (!noInit) this.initialize.apply(this, arguments); };
    klass.oo  = new OO(klass, this);

    if (typeof name != 'string') {
      klassDef = name;
    } else {
      namedClasses[name] = klass;
      var namespace = this.oo.createNamespace(name);
      namespace[0][namespace[1]] = klass;
    }

    // create instance of this as prototype for new this
    noInit = true;
    var proto = new this();
    noInit = false;

    klass.prototype = proto;
    var oo   = klass.oo;
    proto.oo = oo;

    for (var name in this) {
      oo.addStaticMember(name, this[name]);
    }

    if (typeof klassDef == 'function') {
      klassDef(klass, oo);
    } else {
      for (var name in klassDef) {
        oo.addMember(name, klassDef[name]);
      }
    }

    return klass;
  };

  var assert = {
    'eq': function(expected, actual) { if (expected != actual) console.log("Expected "+expected+", but got "+actual+".") },
    'isFalse': function(val) { if (val) console.log("Expected false, but got "+val+".") },
    'isTrue': function(val) { if (!val) console.log("Expected true, but got " +val+".") }
  };

  JS2.test = function(message, callback) {
    if (!callback) callback = message;
    callback(assert);
  };


  return JS2;
})(undefined, JS2);

  JS2.Array = function (arr) {
  if (arr instanceof Array) {
    this.append(arr);
  }
};

JS2.Array.prototype = new Array();
JS2.Array.prototype.each = function(f) {
  for (var i=0; i<this.length; i++) {
    f.call(this, this[i], i );
  }
  return this;
};

JS2.Array.prototype.toString = function() {
  return this.join(',');
};


JS2.Array.prototype.until = function(f) {
  for (var i=0; i<this.length; i++) {
    if (f.call(this, this[i], i )) return true;;
  }
  return false;
};


JS2.Array.prototype.collect = function(f) {
  var ret  = new JS2.Array();
  var self = this;
  this.each(function($1,$2,$3){ ret.push(f.call(self, $1, $2)) });
  return ret;
};

// http://clojure.github.com/clojure/clojure.core-api.html#clojure.core/reduce
JS2.Array.prototype.reduce = function(f, val) {
  if (this.length == 0) return val; 
  if (this.length == 1) return val == null ? f(this[0]) : f(val, this[0]);

  var i = 0;
  if (val == null) val = this[i++];

  for (var n=this.length;i<n;i++) {
    val = f(val, this[i]);
  }

  return val;
};

JS2.Array.prototype.reject = function(f) {
  var ret = new JS2.Array();
  if (f instanceof RegExp) {
    this.each(function($1,$2,$3){ if (!$1.match(f)) ret.push($1) });
  } else if (typeof f == 'string' || typeof f == 'number') {
    this.each(function($1,$2,$3){ if ($1 != f) ret.push($1) });
  } else if (typeof f == 'function') {
    var self = this;
    this.each(function($1,$2,$3){ if (!f.call(self, $1, $2)) ret.push($1) });
  }
  return ret;
};

JS2.Array.prototype.select = function(f) {
  var ret = new JS2.Array();
  if (f instanceof RegExp) {
    this.each(function($1,$2,$3){ if ($1.match(f)) ret.push($1) });
  } else if (typeof f == 'string' || typeof f == 'number') {
    this.each(function($1,$2,$3){ if ($1 == f) ret.push($1) });
  } else if (typeof f == 'function') {
    var self = this;
    this.each(function($1,$2,$3){ if (f.call(self, $1, $2)) ret.push($1) });
  }
  return ret;
};

JS2.Array.prototype.append = function(arr) {
  this.push.apply(this, arr);
  return this;
};

JS2.Array.prototype.empty = function() {
  return this.length == 0;
};

JS2.Array.prototype.any = function() {
  return this.length > 0;
};



  js2.ROOT = root;

  return JS2;

})(window);
