exports.JS2 = (function (root) {
  var console = {};
  console.log = function (m) { system.print(m) };

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


  var JS2 = root.JS2 = mainFunction;
  var js2 = root.js2 = JS2;
  js2.ROOT = JS2;
  js2.VERSION = "0.3.15";

  
// CLASS HELPERS
(function (undefined, JS2) {

  var OO = function (klass, par) {
    this.klass = klass;
    this.par   = par;

    this.members       = {};
    this.staticMembers = {};
    this.children = [];
    this.included = [];

    if (this.par) this.par.OO.children.push(klass);
  };

  OO.prototype = {
    forbiddenMembers: { 
      'prototype': undefined, 
      'OO': undefined 
    },
 
    include: function(module) {
      this.included.push(module);
      var members = module.OO.members;
      for (var name in members) {
        if (members.hasOwnProperty(name)) {
          this.addMember(name, members[name]);
        }
      }

      var staticMembers = module.OO.staticMembers;
      for (var name in staticMembers) {
        if (staticMembers.hasOwnProperty(name)) {
          this.addStaticMember(name, staticMembers[name]);
        }
      }

      if (typeof staticMembers['included'] == 'function') {
        staticMembers['included'](this.klass);
      }
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
      this.members[name] = member;
    },

    addStaticMember: function(name, member) {
      if (this.forbiddenMembers.hasOwnProperty(name)) return;

      if (typeof this.klass[name] == 'function') {
        if (!this.klass.hasOwnProperty(name)) {
          member = this.makeSuper(member, this.klass[name]);
        }
      }
      
      this.klass[name] = member;
      this.staticMembers[name] = member;
    }
  };

  JS2.Class = function() { this.initialize.apply(this, arguments); };
  JS2.Class.OO = new OO(JS2.Class);
  JS2.Class.prototype = {
    initialize: function () {},
    oo: JS2.Class.OO
  };

  var namedClasses = {};
  JS2.getClass = function(name) {
    return namedClasses[name];
  };

  var noInit = false;
  JS2.Class.extend = function(name, klassDef) {
    var klass = function() { if (!noInit) this.initialize.apply(this, arguments); };
    klass.OO  = new OO(klass, this);

    if (typeof name != 'string') {
      klassDef = name;
    } else {
      namedClasses[name] = klass;
      var namespace = this.OO.createNamespace(name);
      namespace[0][namespace[1]] = klass;
    }

    // create instance of this as prototype for new this
    noInit = true;
    var proto = new this();
    noInit = false;

    klass.prototype = proto;
    var oo   = klass.OO;
    proto.OO = oo;

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

  JS2.Module = JS2.Class;

  var assert = {
    'eq': function(expected, actual) { if (expected != actual) console.log("Expected "+expected+", but got "+actual+".") },
    'isFalse': function(val) { if (val) console.log("Expected false, but got "+JSON.stringify(val)+".") },
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


  JS2.Class.extend('JSML', function(KLASS, OO){
  OO.addStaticMember("process",function (txt) {
    return new KLASS(txt);
  });

  OO.addMember("initialize",function (txt) {
    var lines = txt.split(/\n/);
    this.root    = new JS2.JSMLElement();
    this.stack   = [ this.root ];

    for(var _i1=0,_c1=lines,_l1=_c1.length,l;(l=_c1[_i1])||(_i1<_l1);_i1++){
      if (l.match(/^\s*$/)) continue;
      this.processLine(l);
    }

    var toEval = 'function process() { var out = [];\n' + this.flatten().join('') + '\n return out.join("");\n}';
    eval(toEval);

    this.result = function(bound) {
      bound = bound || {};
      return process.call(bound);
    };
  });

  OO.addMember("flatten",function () {
    return this.root.flatten();
  });

  OO.addMember("processLine",function (line) {
    var ele   = new JS2.JSMLElement(line);
    var scope = this.getScope();

    if (ele.scope == scope) {
      this.stack.pop();
      this.getLast().push(ele);
      this.stack.push(ele);
    } else if (ele.scope > scope) {
      this.getLast().push(ele); 
      this.stack.push(ele);
    } else if (ele.scope < scope) {
      var diff = scope - ele.scope + 1;
      while(diff-- > 0) {
        this.stack.pop();
      }
      this.getLast().push(ele);
      this.stack.push(ele);
    }
  });


  OO.addMember("getScope",function () {
    return this.stack.length - 1;
  });

  OO.addMember("getLast",function () {
    return this.stack[this.stack.length-1];
  });

});

JS2.Class.extend('JSMLElement', function(KLASS, OO){
  OO.addMember("SCOPE_REGEX",/^(\s*)(.*)$/);
  OO.addMember("SPLIT_REGEX",/^((?:\.|\#|\%)[^=\-\s\{]*)?(\{.*\})?(=|-)?(?:\s*)(.*)$/);
  OO.addMember("TOKEN_REGEX",/(\%|\#|\.)([\w-]+)/g);
  OO.addMember("JS_REGEX",/^(-|=)(.*)$/g);
  OO.addMember("SCOPE_OFFSET",1);

  OO.addMember("initialize",function (line) {
    this.children = [];

    if (line == null) {
      this.scope = this.SCOPE_OFFSET;
      return;
    }

    var spaceMatch = line.match(this.SCOPE_REGEX);
    this.scope = spaceMatch[1].length / 2 + this.SCOPE_OFFSET;

    this.classes  = [];
    this.nodeID   = null;

    this.parse(spaceMatch[2]);
  });

  OO.addMember("push",function (child) {
    this.children.push(child);
  });

  OO.addMember("parse",function (line) {
    this.attributes;
    this.line = line;
    var self = this;

    var splitted = line.match(this.SPLIT_REGEX);
    var tokens   = splitted[1];
    var attrs    = splitted[2];
    var jsType   = splitted[3];
    var content  = splitted[4];

    if (tokens) {
      tokens.replace(this.TOKEN_REGEX, function(match, type, name){ 
        switch(type) {
          case '%': self.nodeType = name; break;
          case '.': self.classes.push(name); break;
          case '#': self.nodeID = name; break;
        } 
        return '';
      });
    }

    if (jsType == '=') {
      this.jsEQ = content;
    } else if (jsType == '-') {
      this.jsExec = content;
    } else {
      this.content = content;
    }

    if (attrs) {
      this.attributes = attrs;
    }

    if (!this.nodeType && (this.classes.length || this.nodeID)) {
      this.nodeType = 'div';
    }
  });

  OO.addMember("flatten",function () {
    var out = [];
   
    for(var _i1=0,_c1=this.children,_l1=_c1.length,c;(c=_c1[_i1])||(_i1<_l1);_i1++){
      var arr = c.flatten();
      for(var _i2=0,_c2=arr,_l2=_c2.length,item;(item=_c2[_i2])||(_i2<_l2);_i2++){
        out.push(item);
      }
    }

    if (this.nodeType) {
      this.handleJsEQ(out);
      this.handleContent(out);
      out.unshift('out.push("<' + this.nodeType + '"+JS2.JSMLElement.parseAttributes(' + (this.attributes || "{}") + ', ' + JSON.stringify(this.classes || []) + ', ' + JSON.stringify(this.id || null) + ')+">");\n');
      out.push('out.push(' + JSON.stringify("</"+(this.nodeType)+">") + ');\n');
    } else {
      this.handleJsExec(out);
      this.handleJsEQ(out);
      this.handleContent(out);
    }

    return out;
  });

  OO.addMember("handleJsEQ",function (out) {
    if (this.jsEQ) {
      this.jsEQ = this.jsEQ.replace(/;\s*$/, '');
      out.unshift('out.push(' + this.jsEQ + ');\n');
    }
  });

  OO.addMember("handleContent",function (out) {
    if (this.content != null && this.content.length > 0) {
      out.unshift('out.push(' + JSON.stringify(this.content) + ');\n');
    }
  });


  OO.addMember("handleJsExec",function (out) {
    if (this.jsExec) {
      out.unshift(this.jsExec);
      if (this.jsExec.match(/\{\s*$/)) {
        out.push("}\n");
      }
    }
  });

  OO.addStaticMember("parseAttributes",function (hash, classes, id) {
    var out = [];
    classes = classes || [];
    if (hash['class']) classes.push(hash['class']);
    if (classes.length) hash['class'] = classes.join(" ");

    for (var k in hash) {
      if (hash.hasOwnProperty(k)) {
        out.push(k + '=' + JSON.stringify(hash[k]));
      }
    }
    return (out.length ? ' ' : '') + out.join(' ');
  });
});


  JS2.TEMPLATES = { jsml: JS2.JSML };


  js2.ROOT = root;
  return js2;
})(this);

exports.js2 = exports.JS2;
