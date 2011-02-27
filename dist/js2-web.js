var JS2 = (function (root) {
  var JS2 = {};
  JS2.MODE = 'web';
  JS2.ROOt = root;
  // CLASS HELPERS
(function (undefined, JS2) {

  function $super () {
    var s = arguments.callee.caller.$super;
    if (s) return s.apply(this, arguments);
  }

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
        if (!root[name]) {
          root[name] = JS2.Class.extend({});
        } 
        root = root[name];
      }

      return [ root, klassName ];
    },

    addMember: function(name, member) {
      if (this.forbiddenMembers.hasOwnProperty(name)) return;

      var proto = this.klass.prototype;
      if (typeof proto[name] == 'function') {
        member.$super = proto[name];
      }

      proto[name] = member;
    },

    addStaticMember: function(name, member) {
      if (this.forbiddenMembers.hasOwnProperty(name)) return;

      if (typeof this.klass[name] == 'function') {
        if (!this.klass.hasOwnProperty(name)) {
          member.$super = this.klass[name];
        }
      }
      
      this.klass[name] = member;
    }
  };

  JS2.Class = function() { this.initialize.apply(this, arguments); };
  JS2.Class.oo = new OO(JS2.Class);
  JS2.Class.prototype = {
    initialize: function () {},
    $super: $super,
    oo: JS2.Class.oo
  };

  var noInit = false;
  JS2.Class.extend = function(name, klassDef) {
    var klass = function() { if (!noInit) this.initialize.apply(this, arguments); };
    klass.oo  = new OO(klass, this);

    if (typeof name != 'string') {
      klassDef = name;
    } else {
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

    for (var name in klassDef) {
      oo.addMember(name, klassDef[name]);
    }

    for (var name in this) {
      oo.addStaticMember(name, this[name]);
    }

    return klass;
  };

  // simple test framework
  JS2.assertEquals = function (left, right) {
    if (left != right) console.log("Expected "+left+" but got "+right+".");
  };

  // simple test framework
  JS2.assertEquals = function (left, right) {
    if (left != right) console.log("Expected "+left+" but got "+right+".");
  };

  return JS2;
})(undefined, JS2);

  return JS2;
})(window);
