
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
    'eq': function(val, expected) { if (expected != val) console.log("Expected "+expected+", but got "+val+".") },
    'isFalse': function(val) { if (val) console.log("Expected false, but got "+val+".") },
    'isTrue': function(val) { if (!val) console.log("Expected true, but got " +val+".") }
  };

  JS2.test = function(message, callback) {
    if (!callback) callback = message;
    callback(assert);
  };


  return JS2;
})(undefined, JS2);
