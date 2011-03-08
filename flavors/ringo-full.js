exports.JS2 = (function (root) {
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

  var console = {};
  console.log = function (m) { system.print(m) };

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

    for (var name in klassDef) {
      oo.addMember(name, klassDef[name]);
    }

    for (var name in this) {
      oo.addStaticMember(name, this[name]);
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

(function (undefined, JS2) {
  var TOKENS = [ 
    [ 'COMMENT', "\\/\\/|/\\*" ],
    [ 'SPACE', "\\s+" ],
    [ 'REGEX', "\\/" ],
    [ 'CLASS', "class" ],
    [ 'SHORT_FUNCT', "#\\{|#\\(" ],
    [ 'FOREACH', "foreach" ],
    [ 'CURRY', "curry" ],
    [ 'IDENT', "[\\w$]+" ],
    [ 'DSTRING', '"' ],
    [ 'SSTRING', "'" ],
    [ 'ISTRING', "%\\{" ],
    [ 'HEREDOC', "<<-?\\w+" ],
    [ 'OPERATOR', "[^\\w]" ]
  ];

  var IDS = {};
  var REGEX_TOKENS = [];
  for (var i=0,token; token=TOKENS[i]; i++) {
    IDS[token[0]] = i;
    REGEX_TOKENS.push("(" + token[1] + ")");
  }

  var PRIMARY_REGEX = new RegExp("^(" + REGEX_TOKENS.join('|') + ")");

  JS2.Class.extend('Lexer', {
    TOKENS: TOKENS,
    PRIMARY_REGEX: PRIMARY_REGEX,
    IDS: IDS,

    initialize: function(str) {
      this.tokens = (typeof str == 'string') ? new JS2.Lexer.Tokens(str) : str;
    },

    tokenize: function(root) {
      if (root) {
        var m = this.tokens.match(/^#!.*/);
        if (m) this.tokens.chomp(m[0].length);
      }

      while (!this.tokens.finished()) {
        if (! this.consume()) {
          if (root) {
            console.log("ERROR:\n" + this.tokens.toArray().join("\n") + "\n" + this.tokens.str);
            break;
          } else {
            return false;
          }
        }
      }
      return this.tokens;
    },

    consume: function() {
      var m = this.tokens.match(PRIMARY_REGEX)
      if (!m) return false;

      for (var i=0,tokenDef;tokenDef=this.TOKENS[i];i++) {
        if (m[0] == m[i+2]) {
          var klass = JS2.Lexer[tokenDef[0]];
          if (klass) {
            var lexer = new klass(this.tokens);
            if (lexer.consume()) {
              return true;
            }
          } else {
            this.tokens.push([ m[0], i ]);
            this.tokens.chomp(m[0]);
            return true;
          }
        }
      }
    }
  });

  JS2.Lexer.IDS = IDS;
  JS2.Lexer.extend('Lexer.REGEX', {
    REGEX: /^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/,
    ID: IDS.REGEX,

    consume: function() {
      return this.consumeRegex(this.REGEX);
    },

    consumeRegex: function(regex) {
      var m = this.tokens.match(regex);

      if (m) {
        this.tokens.push([ m[0], this.ID ]);
        return this.tokens.chomp(m[0].length);
      }

      return false;
    }
  });

  JS2.Lexer.extend('Lexer.SHORT_FUNCT', {
    ID: IDS.SHORT_FUNCT,
    consume: function() {
      this.tokens.chomp(1);
      this.tokens.push([ '#', this.ID ]);
      return true;
    }
  });


  JS2.Lexer.REGEX.extend('Lexer.SSTRING', {
    REGEX: /^'[^\\']*(?:\\.[^\\']*)*'/,
    ID: IDS.SSTRING
  });

  JS2.Lexer.REGEX.extend('Lexer.DSTRING', {
    REGEX: /^"[^\\"]*(?:\\.[^\\"]*)*"/,
    ID: IDS.DSTRING
  });

  JS2.Lexer.REGEX.extend('Lexer.ISTRING', {
    REGEX_NEXT: /^((\\#|[^#])*?)(#{|})/,
    REGEX: /^%\{/,
    ID: IDS.ISTRING,
    sanitize: function(str) {
      return str.replace('"', '\\"');
    },
    consume: function() {
      var m = this.tokens.match(this.REGEX);
      if (!m) return false;
      this.tokens.chomp(2);

      // not really ends...
      var toEnd = false;
      while (1) {
        var m = this.tokens.match(this.REGEX_NEXT);
        if (m) {
          var matched = m[1];
          if (m[3] == '#{') {
            this.tokens.push([ '"' + this.sanitize(matched) + '"+(', this.ID ]);
            this.tokens.chomp(m[0].length-1);
            var block = new JS2.Lexer.Block(this.tokens);
            block.tokenize();
            this.tokens.push([ ')+', this.ID ]);
            toEnd = true;
          } else if (m[3] == '}' || m[0] == '}') {
            this.tokens.push([ '"' + this.sanitize(matched) + '"', this.ID ]);
            this.tokens.chomp(m[0].length);
            break;
          }
        } else {
          break;
        }
      }
      return true;
    }
  });

  JS2.Lexer.ISTRING.extend('Lexer.HEREDOC', {
    REGEX_NEXT: /^((\\#|[^#])*?)(#{|\r?\n)/,
    REGEX: /^<<\-?(\w+)\r?\n/m,
    ID: IDS.HEREDOC,
    consume: function() {
      var m = this.tokens.match(this.REGEX);
      if (!m) return false;

      this.tokens.chomp(m[0].length);
      this.tokens.push([ "\n", IDS.SPACE ]);

      var mIndent = this.tokens.match(/^(\s*)([^\s])/m);
      var spacing = mIndent[1];
      var nspace  = mIndent[1].length;
      var ender = new RegExp("^\\s*" + m[1] + "(\\r?\\n)?");

      var first   = true;
      var noChomp = false;

      while (1) {
        var e = this.tokens.match(ender);
        if (e) {
          this.tokens.chomp(e[0].length);
          this.tokens.push([ ';', IDS.DSTRING ]);
          return true;
        } 

        if (noChomp) {
          noChomp = false;
        } else {
          this.tokens.chomp(nspace);
        }

        var next = this.tokens.match(this.REGEX_NEXT);
        if (next) {
          if (next[1]) {
            this.tokens.chomp(next[1].length);
            this.tokens.push([ (first ? '' : '+') + '"' + this.sanitize(next[1]) + '\\\\n"', IDS.DSTRING ]);
          } 

          if (next[3] == '#{') {
            this.tokens.chomp(1);
            this.tokens.push([ '+(', IDS.DSTRING ]);
            var block = new JS2.Lexer.Block(this.tokens);
            block.tokenize();
            this.tokens.push([ ')', IDS.DSTRING ]);
            noChomp = true;
          } else {
            this.tokens.chomp(next[3].length);
          }
        }
        first = false;
      }
      return true;
    }
  });


  JS2.Lexer.extend('Lexer.Block', {
    initialize: function(tokens) {
      this.$super(tokens);
      this.started = false;
    },

    consume: function() {
      if (! this.started) {
        this.started = true;
        this.tokens.chomp(1);
        this.curlyCount = 1;
        return true;
      } else if (this.tokens.str.charAt(0) == '{') {
        this.curlyCount++;
      } else if (this.tokens.str.charAt(0) == '}') {
        this.curlyCount--;
      }

      if (this.curlyCount == 0) {
        this.tokens.chomp(1);
        return false;
      } else {
        this.$super();
        return true;
      }
    } 
  });

  JS2.Lexer.extend('Lexer.COMMENT', {
    ID: IDS.COMMENT,
    consume: function() {
      var m = this.tokens.match(/^\/\/.*/);
      if (m) {
        this.tokens.push([ m[0], IDS.COMMENT ]);
        this.tokens.chomp(m[0].length);
        return true;
      }

      var str = this.tokens.str;
      var mode = 0;
      for (var i=0; i<str.length; i++) {
        if (str.charAt(i) == '*') {
          mode++;
        } else if (str.charAt(i) == '/' && mode == 1) {
          mode++;
        } else {
          mode = 0;
        }

        if (mode == 2) {
          this.tokens.push([ str.substr(0, i+1), IDS.COMMENT ]);
          this.tokens.chomp(i+1);
          return true;
        }
      }
      return false;
    }
  });




  JS2.Class.extend('Lexer.Tokens', {
    initialize: function(str) {
      this.curlyCount = 0;
      this.braceCount = 0;
      this.tokens = [];
      this.index  = 0;
      this.str    = str;
      this.orig   = str;
    },

    toArray: function() {
      return this.tokens;
    },

    match: function(regex) {
      return this.str.match(regex);
    },

    compare: function(str) {
      return this.str.substr(0, str.length) == str;
    },

    // stuff can be string, integer, or regex
    // will return true if it actually made the string 
    // smaller
    chomp: function(stuff) {
      var len = this.str.length;
      if (typeof stuff == 'number') {
        this.str = this.str.substr(stuff);
      } else if (typeof stuff == 'string') {
        this.str = this.str.substr(stuff.length);
      } else if (stuff instanceof RegExp) {
        var m = this.str.match(stuff);
        if (m) {
          this.str = this.str.substr(m[0].length);
        }
      }
      return len > this.str.length;
    },

    finished: function(token) {
      return this.str.length == 0;
    },

    push: function(token) {
      this.tokens.push(token);
    },

    pop: function() {
      return this.tokens.pop();
    },

    peek: function() {
      return this.tokens[0];
    },

    shift: function() {
      var token = this.tokens.shift();
      var str = token[0];
      switch(str) {
        case '{': this.curlyCount++; break;
        case '}': this.curlyCount--; break;
        case '(': this.braceCount++; break;
        case ')': this.braceCount--; break;
      }
      return token;
    },

    freeze: function(obj) {
      obj.curlyCount = this.curlyCount;
      obj.braceCount = this.braceCount;
    },

    isBalancedCurly: function(obj) {
      return obj.curlyCount == this.curlyCount;
    },

    isBalancedBrace: function(obj) {
      return obj.braceCount == this.braceCount;
    },

    empty: function() {
      return this.tokens.length <= 0; 
    },

    charAt: function(n) {
      return this.str.charAt(n);
    },

    indexOf: function(n) {
      return this.str.indexOf(n);
    }

  });
})(undefined, JS2);

(function (undefined, JS2) {
  JS2.Parser = {
    parse: function(str) {
      var lexer   = new JS2.Lexer(str);
      var tokens  = lexer.tokenize(true);
      var root    = new Content(tokens);
      return root;
    },

    parseFile: function(file) {
      return this.parse(js2.fs.read(file, 'utf8'));
    }
  };

  var KEYWORDS = { 'var': null, 'class': null, 'function': null, 'in': null, 'with': null, 'curry': null};
  var IDS = JS2.Lexer.IDS;
  IDS['NODE'] = -1;

  var Validator = JS2.Class.extend({
    initialize: function(content) {
      this.content = content;
    },

    validate: function(regex, n) {
      var str = this.getString(n);
      var m   = regex.exec(str);
      if (!m) return false;

      var ret = [ m ];
      var cIdx = 0;
      for (var i=1; i<=m.length; i++) {
        while (this.content[cIdx] && this.content[cIdx][1] == IDS.COMMENT) cIdx++;

        if (!m[i] || m[i].length == 0) {
          ret.push('');
        } else {
          ret.push(this.content[cIdx++][0]);
        }
      }

      if (n == null) {
        var last = [];
        while (cIdx<this.content.length) {
          last.push(this.content[cIdx++][0].toString()); 
        }

        ret.last = last.join('');
      }
      return ret;
    },

    getString: function(n) {
      n = n ? n : this.content.length;
      var ret = [];

      for (var i=0; i<n; i++) {
        var token = this.content[i];
        if (! token) break;
        var str = this.getTokenString(token);
        if (str != null) ret.push(str);
      }

      return ret.join('');
    },

    getTokenString: function(token) {
      if (token[1] == IDS.COMMENT) {
        return null;
      } else if (token[0] in KEYWORDS) {
        return token[0];
      } else if (token[1] == IDS.SPACE) {
        return token[0];
      } else if (token[1] == IDS.IDENT) {
        return 'I';
      } else if (typeof token[0] == 'object') {
        return token[0].name;
      } else if (typeof token[0] == 'string') {
        return token[0];
      }  
    }
  });

  var Content = JS2.Class.extend({
    name: 'Content',
    initialize: function(tokens) {
      this.curlyCount = tokens.curlyCount;
      this.braceCount = tokens.braceCount;
      this.content = [];
      this.tokens = tokens;
      this.handOffs = [];

      this.processTokens(tokens);
    }, 

    processTokens: function() {
      while (!this.tokens.empty() && !this.closed) {
        var token = this.tokens.peek();
        var klass = this.handOff(token);
        if (this.closed) break;

        if (klass) {
          this.handOffs.push(this.newNode(klass, this.tokens));
        } else {
          this.content.push(token);
          this.handleToken(this.tokens.shift());
        }

        if (this.closed) break;
      }    
    },

    handleToken: function(token) {},

    newNode: function(klass, tokens) {
      var node = new klass(tokens); 
      this.content.push([ node, IDS.NODE ]);
      return node;
    },

    validate: function(regex) {
      return (new Validator(this.content)).validate(regex);
    },

    getValidateString: function() {
      return (new Validator(this.content)).getString();
    },

    handOff: function(token) {
      switch (token[1]) {
        case IDS.CLASS: return Klass;
        case IDS.FOREACH: return Foreach;
        case IDS.SHORT_FUNCT: return ShortFunct;
        case IDS.CURRY: return Curry;
      }
    },

    toString: function() {
      var ret = [];
      for (var i=0; i<this.content.length; i++) {
        ret.push(this.content[i][0].toString()); 
      }
      return ret.join('');
    }
  });

  var Klass = Content.extend({
    name: 'Klass',
    handOff: function(token) {
      if (this.started) this.closed = true;
      switch (token[0]) {
        case '{': this.started = true; return KlassBlock;
      }
    }, 

    toString: function() {
      var v  = this.validate(/(class)(\s+)/);
      var last = v.last;
      var m = last.match(/^([\w$]+(\.[\w$]+)*)(\s+extends\s+([\w$]+(\.?[\w$]+))*)?/);

      var name = m[1];
      var par  = m[4] || 'JS2.Class';
      var source = last.substr(m[0].length);

      return JS2.DECORATOR.klass(name, par, source);
    }
  });

  var Block = Content.extend({
    name: 'Block',
    handleToken: function(token) {
      if (this.tokens.isBalancedCurly(this) && token[0] == '}') {
        this.closed = true;
      }
    } 
  });

  var KlassBlock = Block.extend({
    name: 'KlassBlock',
    handOff: function(token) {
      switch (token[0]) {
        case 'var': return Member;
        case 'function': return Method;
      }
    },

    handleToken: function(token) {
      if (this.tokens.isBalancedCurly(this) && token[0] == '}') {
        this.closed = true;
      }
    },

    toString: function() {
      var str = this.$super();
      return str.replace(/,(\s+\})$/, "$1");
    } 
  });

  var Method = Content.extend({
    name: 'Method',
    handOff: function(token) {
      if (this.started) this.closed = true;
      if (token[0] == '(') {
        return Braces;
      } else if (token[0] == '{') {
        this.started = true;
        return Block;
      }
    },

    toString: function () {
      var v  = this.validate(/^(function)(\s+)(I)(\s*)(Braces)(\s*)(Block)/);
      return v[3] + ':' + "function" + v[2] + v[5] + ' ' + v[7] + ',';
    }
  });

  var Member = Content.extend({
    name: 'Member',
    handleToken: function(token) {
      if (token[0] == ';') this.closed = true;
    },

    toString: function () {
      var v = this.validate(/(var)(\s+)(I)(\s*)(=)?(\s*)/);
      var last = v.last.replace(/;$/, '');
      if (last.length == 0) last = 'null';

      return '"' + v[3] + '":' + last + ',';
    }
  });



  var Braces = Content.extend({
    name: 'Braces',
    handleToken: function(token) {
      if (this.tokens.isBalancedBrace(this) && token[0] == ')') {
        this.closed = true;
      }
    } 
  });

  var Foreach = Content.extend({
    cache: { count: 1 },
    name: 'Foreach',
    handOff: function(token) {
      if (this.started) {
        this.closed = true;
      }
      switch (token[0]) {
        case '(': return Braces;
        case '{': this.started = true; return Block;
      }
    },

    toString: function() {
      var v = this.validate(/(foreach)(\s*)(Braces)(\s*)(Block)/);
      return "for" + this.getBrace(v[3]) + v[5].toString();
    },

    getBrace: function(brace) {
      var n = this.cache.count++;
      var iteratorName   = "_i" + n;
      var collectionName = "_c" + n;
      var l = "_l" + n;

      var v = brace.validate(/(\()(\s*)(var)(\s+)(I)(\s+)(in)(\s+)/);
      if (!v) return '';

      var holder = v[5];
      var collection = v.last.replace(/\)$/, '');

      return "(var " + iteratorName + "=0," +
              collectionName + "=" + collection + "," +
              l + "=" + collectionName + ".length," +
              holder + ";" +
              holder + '=' + collectionName + '[' + iteratorName + ']||' +
              iteratorName + '<' + l + ';' +
              iteratorName + '++)';
    }
  });

  var ShortFunct = Content.extend({
    name: "ShortFunct",
    handOff: function(token) {
      if (this.started) {
        this.closed = true;
        var foo = (new Validator(this.tokens.toArray())).getString(2);
        this.semi = (new Validator(this.tokens.toArray())).validate(/^(\s*)([^\s\w$])/, 2) ? '' : ';';
      }

      switch (token[0]) {
        case '(': return Braces;
        case '{': this.started = true; return Block;
      }
    },

    toString: function() {
      var v = this.validate(/(#)(Braces)?(\s*)(Block)/);
      return "function" + (v[2] ? v[2] : "($1,$2,$3)") + v[4] + this.semi;
    }
  });

  var Curry = Content.extend({
    name: "Curry",
    handOff: function(token) {
      if (this.started) {
        var v = (new Validator(this.tokens.toArray())).validate(/^(\s*)([\w$]+)/, 2);
        if (v) this.addSemiColon = true;
        this.closed = true;
      }

      if (this.nbraces == null) this.nbraces = 0;

      switch (token[0]) {
        case '(': return Braces;
        case '{': this.started = true; return Block;
      }
    },

    toString: function() {
      var v = this.validate(/(curry)(\s*)(Braces)?(\s*)(with)?(\s*)(Braces)?(\s*)(Block)/);

      var scopeOuter = (v[5] ? v[7].toString() : "()");
      var scopeInner = scopeOuter.replace(/\bthis\b/, '$this');

      var ret = [ '(function' + scopeInner + '{return function' ];

      // args
      ret.push(v[3] ? v[3].toString() : '($1,$2,$3)');

      // block
      ret.push(v[9].toString());

      // close outer block
      ret.push("})");

      // scope
      ret.push(scopeOuter);

      if (this.addSemiColon) ret.push(';');

      return ret.join('');
    }
  });

  JS2.require = function(file) {
    var str = JS2.Parser.parseFile(file + '.js2').toString(); 
    eval(str);
  }

  JS2.parse = function(str) { return this.Parser.parse(str); };
  JS2.parseFile = function(file) { return this.Parser.parseFile(file); };
  JS2.render = function(str) { return this.parse(str).toString(); };
  JS2.renderFile = function(file) { return this.parseFile(file).toString(); };

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
  var ret = new JS2.Array();
  this.each(function($1,$2,$3){ ret.push(f.call(this, $1, $2)) });
  return ret;
};

JS2.Array.prototype.reduce = function(f, val) {
  this.each(function($1,$2,$3){ val = f.call(this, $1, val) });
};

JS2.Array.prototype.reject = function(f) {
  var ret = new JS2.Array();
  if (f instanceof RegExp) {
    this.each(function($1,$2,$3){ if (!$1.match(f)) ret.push($1) });
  } else if (typeof f == 'string' || typeof f == 'number') {
    this.each(function($1,$2,$3){ if ($1 != f) ret.push($1) });
  } else if (typeof f == 'function') {
    this.each(function($1,$2,$3){ if (!f.call(this, $1, $2)) ret.push($1) });
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
    this.each(function($1,$2,$3){ if (f.call(this, $1, $2)) ret.push($1) });
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


JS2.Class.extend('FileSystem', {
  initialize:function (adapter) {
    this.adapter = adapter;
  },

  find:function (dir, ext, recursive) {
    return this._find(this.expandPath(dir), new RegExp('\\.' + ext + '$'), recursive);
  },

  _find:function (dir, regex, recursive) {
    if (!this.isDirectory(dir))  return [];

    var parts = this.adapter.readdir(dir); 

    var files = js2();
    var self = this;

    js2(parts).reject(/^\.\.?$/).each(function($1,$2,$3){
      var file = dir + '/' + $1;
      if (self.isFile(file) && file.match(regex)) {
        files.push(file); 
      } else if (self.isDirectory(file)) {
        var found = self._find(file, regex, recursive);
        for (var i=0; i<found.length; i++) {
          files.push(found[i]); 
        }
      }
    });

    return files;
  },

  canonical:function (file) {
    var abs = this.expandPath(file);
    abs = abs.replace(/\/$/, '');
    return abs;
  },

  mkpath:function (file) {
    var dirname = this.canonical(this.dirname(file));

    var subdirs = js2(dirname.split('/'));
    subdirs.shift();
    var toMake = '';

    var self = this;
    subdirs.each(function($1,$2,$3){
      toMake += '/' + $1;
      self.mkdir(toMake); 
    });
  },

  // ADAPTER USAGE
  dirname:function (file) {
    return this.adapter.dirname(file);
  },

  readdir:function (file) {
    return this.adapter.readdir(file);
  },

  read:function (file) {
    var data = this.adapter.read(file);
    return data;
  },

  write:function (file, data) {
    return this.adapter.write(file, data);
  },

  mtime:function (file) {
    return this.adapter.mtime(file);
  },

  exists:function (file) {
    return this.isDirectory(file) || this.isFile(file);
  },

  mkdir:function (file) {
    if (!this.exists(file)) {
      return this.adapter.mkdir(file);
    }
  },

  isFile:function (file) {
    try {
      return this.adapter.isFile(file);
    } catch(e) {
      return false;
    }
  },

  setInterval:function (code, interval) {
    return this.adapter.setInterval(code, interval);
  },

  isDirectory:function (file) {
    try {
      return this.adapter.isDirectory(file);
    } catch(e) {
      return false;
    }
  },

  expandPath:function (file) {
    return this.adapter.expandPath(file);
  }
});


JS2.Class.extend('Updater', {
  initialize:function (fs, inDir, outDir, recursive) {
    this.recursive = recursive;
    this.fs      = fs; 
    this.inDir   = this.fs.canonical(inDir);
    this.outDir  = this.fs.canonical(outDir);
    this.verbose = true;
  },

  update:function (force, funct) {
    var self = this;
    this.matchDirs(this.inDir);
    this.fs.find(this.inDir, 'js2', this.recursive).each(function($1,$2,$3){
      self.tryUpdate($1, force, funct); 
    });
  },

  matchDirs:function (dir) {
    var subs = this.fs.readdir(dir);
    for(var _i4=0,_c4=subs,_l4=_c4.length,sub;sub=_c4[_i4]||_i4<_l4;_i4++){
      var path = dir + '/' + sub;
      if (this.fs.isDirectory(path)) {
        this.fs.mkdir(path.replace(this.inDir, this.outDir));
        this.matchDirs(path);
      }
    }
  },

  tryUpdate:function (file, force, funct) {
    var outFile = file.replace(this.inDir, this.outDir).replace(/\.js2$/, '.js');

    var dir = this.fs.dirname(file);
    if (! this.fs.isDirectory(dir)) this.fs.mkpath(dir);

    if (force || this.fs.mtime(file) > this.fs.mtime(outFile)) {
      if (funct) {
        this.fs.write(outFile, funct(JS2(this.fs.read(file))));
      } else {
        this.fs.write(outFile, JS2(this.fs.read(file)));
      }
    }
  }
});


JS2.Class.extend('Config', {
  "CLI_REGEX":/^-(r|i|f)(:?=(\w+))$/,
  "optsLookup":{ 
    'n': 'non-recursive',
    'i': 'interval',
    'f': 'format'
  },

  initialize:function (fs, argv) {
    this.format    = 'browser';
    this.recursive = true;
    this.interval  = 2;
    this.sourceDir = './app/js2';
    this.outDir    = './public/javascripts';
    this.args      = [];

    this.fs = fs;

    if (! this.loadConfigFile('./config/js2.json')) {
      this.loadConfigFile('./js2.json');
    }

    if (argv) {
      while (argv.length) {
        var opt = argv.shift(); 
        var m = opt.match(this.CLI_REGEX);
        if (m) {
          this[this.optsLookup[m[0]]] = m[1] || true; 
        } else if (! this.command) {
          this.command = opt;
        } else {
          this.args.push(opt);
        }
      }
    }

    this.interval = parseInt(this.interval);

  },

  loadConfigFile:function (file) {
    if (this.fs.isFile(file)) {
      try {
        var config = JSON.parse(this.fs.read(file).replace(/\n/g, ''));

        this.format    = config.format    || this.format;
        this.recursive = config['non-recursive'] ? false : this.recursive;
        this.interval  = config['interval'] ? config['interval'] : this.interval;
        this.sourceDir = config['source-dir'] || this.sourceDir;
        this.outDir    = config['out-dir'] || this.outDir;

        return true;
      } catch(e) {
        console.log(e.toString());
      }
    }
    return false;
  }

});


JS2.Class.extend('Commander', {
  "BANNER":"js2 <command> [options] <arguments>\n" +
    "Commands:\n" +
    "  * run <file>                -- Executes file\n" +
    "  * render <file>             -- Shows JS2 compiled output\n" +
    "  * compile <inDir> [outDir]  -- Compiles a directory and puts js files into outDir.  If outDir is not specified, inDir will be used\n" + 
    "    Options:\n" +
    "      -n                      -- Do NOT traverse directories recursively\n" +
    "      -f=<format>             -- Compile for different formats: node, ringo, or browser\n" +
    "  * compile <file>            -- Compiles a single js2 file into js\n" +
    "  * watch <inDir> <outDir>    -- Similar to compile, but update will keep looping while watching for modifications\n" +
    "    Options:\n" +
    "      -n                      -- Do NOT traverse directories recursively\n" +
    "      -i=<seconds>            -- Interval time in seconds between loops\n",

  "DEFAULT_CONFIG":{
    compile: { inDir: 'src', outDir: 'lib', recursive: true, decorator: 'Node'  },
    watch: { inDir: 'src', outDir: 'lib', recursive: true, decorator: 'Node' }
  },

  initialize:function (argv) {
    this.fs      = JS2.fs;
    this.config  = new JS2.Config(this.fs, argv);
    this.command = this.config.command;
  },

  cli:function () {
    if (this[this.command]) {
      this[this.command]();
    } else {
      this.showBanner();
    }
  },

  render:function () {
    console.log(js2.render(this.fs.read(this.config.args[0])));
  },

  run:function () {
    var file;
    var i = 0;
    while (file = this.config.args[i++]) {
      eval(js2.render(this.fs.read(file))); 
    }
  },

  compile:function () {
    var self = this;
    this.getUpdater().update(true, function($1,$2,$3){ return JS2.DECORATOR.file($1); });
  },

  getUpdater:function () {
    var inDir  = this.config.args[0] || '.';
    var outDir = this.config.args[1] || inDir;
    return new JS2.Updater(this.fs, inDir, outDir, this.config.recursive);
  },

  watch:function () {
    var updater = this.getUpdater();
    var self = this;
    var interval = this.config.interval || 2;
    console.log('Input Directory:' + updater.inDir + ' -> Output Directory:' + updater.outDir);
    if (updater.recursive) console.log('RECURSIVE');

    // HACK to get this integrated with ruby
    updater.update();
    setInterval(function($1,$2,$3){ console.log('updating'); updater.update(true, function($1,$2,$3){ return JS2.DECORATOR.file($1); }); }, interval * 1000);
  },

  showBanner:function () {
    console.log(this.BANNER);
  }
});



JS2.Class.extend('Decorator.Browser', {
  file:function (code) {
    return code;
  },

  klass:function (name, par, source) {
    return par+".extend('"+name+"',"+source+");";
  }
});

JS2.Class.extend('Decorator.Node', {
  file:function (code) {
    return "var js2 = require('js2').js2;\nvar JS2 = js2;\n" + code;
  },

  klass:function (name, par, source) {
    return "var "+name+"=exports['"+name+"']="+par+".extend("+source+");";
  }
});

JS2.Class.extend('Decorator.Ringo', {
  file:function (code) {
    return "var js2 = require('js2').js2;\nvar JS2 = js2;\n" + code;
  },

  klass:function (name, par, source) {
    return "var "+name+"=exports['"+name+"']="+par+".extend("+source+");";
  }
});



  JS2.Class.extend('RingoFileAdapter', {
  initialize:function () {
    this.fs = require('fs'); 
  }, 

  isDirectory:function (file) {
    return this.fs.isDirectory(file);
  },

  setInterval:function (code, interval) {
    return setInterval(code, interval);
  },

  dirname:function (file) {
    var path = this.expandPath(file);
    return file.replace(/[^\/]*$/, '');
  },


  isFile:function (file) {
    return this.fs.isFile(file);
  },

  mkdir:function (file) {
    return this.fs.makeDirectory(file);
  },

  readdir:function (file) {
    return this.fs.list(file);
  },

  expandPath:function (file) {
    return this.fs.canonical(file);
  },

  read:function (file) {
    return this.fs.read(file);
  },

  write:function (file, data) {
    return this.fs.write(file, data);
  },

  mtime:function (file) {
    try {
      return this.fs.openRaw(file).lastModified().getTime();
    } catch(e) {
      return 0;
    }
  }
});


  JS2.fs = new JS2.FileSystem(new JS2.RingoFileAdapter());

  js2.DECORATOR = new JS2.Decorator.Ringo();
  js2.ROOT = root;
  return js2;
})(this);

exports.js2 = JS2;
exports.compile = function (inDir, outDir, args) {
  opts = opts || [];
  var argv = [ 'compile' ];
  for (var i=0; i<opts.length; i++) argv.push(opts[i]);
  argv.push(inDir);
  argv.push(outDir);

  var c = new JS2.Commander(argv);
  c.cli();

  return exports.js2;
};
