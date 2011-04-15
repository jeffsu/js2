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
  js2.VERSION = "0.3.18";

  JS2.ROOT = JS2;
  
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

(function (undefined, JS2) {
  var TOKENS = [ 
    [ 'COMMENT', "\\/\\/|/\\*" ],
    [ 'SPACE', "\\s+" ],
    [ 'REGEX', "\\/" ],
    [ 'CLASS', "\\bclass\\b" ],
    [ 'MODULE', "\\bmodule\\b" ],
    [ 'STATIC', "\\bstatic\\b" ],
    [ 'include', "\\binclude\\b" ],
    [ 'SHORT_FUNCT', "#\\{|#\\(" ],
    [ 'FOREACH', "\\bforeach\\b" ],
    [ 'CURRY', "\\bcurry\\b" ],
    [ 'IDENT', "[\\w$]+" ],
    [ 'DSTRING', '"' ],
    [ 'SSTRING', "'" ],
    [ 'ISTRING', "%\\{" ],
    [ 'HEREDOC', "<<-?\\w+" ],
    [ 'OPERATOR', "(?:\\+\\+|\\-\\-|[^\\w])" ]
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

      if (m[0] == '/' && this.tokens.divideCompatible()) {
        this.tokens.push([ '/', IDS.OPERATOR ]); // operator
        this.tokens.chomp(1);
        return  true;
      }

      for (var i=0,tokenDef;tokenDef=this.TOKENS[i];i++) {
        if (m[0] == m[i+2]) {
          var klass = JS2.Lexer[tokenDef[0]];

          if (klass) {
            var lexer = new klass(this.tokens);
            if (lexer.consume()) {
              return true;
            }
          } else {
            var type = tokenDef[0];
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
      return JSON.stringify(str);
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
            this.tokens.push([ this.sanitize(matched) + '+(', this.ID ]);
            this.tokens.chomp(m[0].length-1);
            var block = new JS2.Lexer.Block(this.tokens);
            block.tokenize();
            this.tokens.push([ ')+', this.ID ]);
            toEnd = true;
          } else if (m[3] == '}' || m[0] == '}') {
            this.tokens.push([ this.sanitize(matched), this.ID ]);
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
    REGEX: /^<<\-?(\w+)(?::(\w+))?\s*\r?\n/m,
    ID: IDS.HEREDOC,
    consume: function() {
      var m = this.tokens.match(this.REGEX);
      if (!m) return false;

      var templateEngine = m[2];
      this.tokens.chomp(m[0].length);
      this.tokens.push([ "\n", IDS.SPACE ]);

      var mIndent = this.tokens.match(/^(\s*)([^\s])/m);
      var spacing = mIndent[1];
      var nspace  = mIndent[1].length;
      var ender = new RegExp("^\\s*" + m[1] + "(\\r?\\n)?");

      var first   = true;
      var noChomp = false;
      if (templateEngine) {
        this.tokens.push([ 'JS2.TEMPLATES["' + templateEngine + '"].process(', IDS.IDENT ]);
      }

      while (1) {
        var e = this.tokens.match(ender);
        if (e) {
          this.tokens.chomp(e[0].length);
          break;
        } 

        if (noChomp) {
          noChomp = false;
        } else {
          this.tokens.chomp(nspace);
        }

        var next = this.tokens.match(this.REGEX_NEXT);
        if (next) {
          var str    = next[1];
          var ending = next[2];

          if (next[1]) {
            this.tokens.chomp(next[1].length);
            this.tokens.push([ (first ? '' : '+') + this.sanitize(next[1]).replace(/"$/, '\\n"') , IDS.DSTRING ]);
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

      if (templateEngine) {
        this.tokens.push([ ')', IDS.IDENT ]);
      }

      this.tokens.push([ ';', IDS.OPERATOR ]);
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
          mode = 1;
        } else if (str.charAt(i) == '/' && mode == 1) {
          mode = 2;
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
      this.before = [];
    },

    divideCompatible: function() {
      var last = this.lastNonSpace();
      return (last[0].match(/(\}|\)|\+\+|\-\-)$/) || last[1] == IDS.IDENT);
    },

    lastNonSpace: function() {
      var idx   = this.tokens.length - 1;
      var token = this.tokens[idx];
      while (token && token[1] == IDS.SPACE) {
        token = this.tokens[--idx];
      }
      return token;
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
      var ret = this.tokens.pop();
      this.before.push(ret);
      return ret;
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
      this.before.unshift(token);
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

  var KEYWORDS = { 'var': null, 'class': null, 'function': null, 'in': null, 'with': null, 'curry': null, 'static': null, 'module':null };
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
      } else if (KEYWORDS.hasOwnProperty(token[0])) {
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
        case IDS.MODULE: return Module;
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

  var Module = Klass.extend({
    name: 'Module',
    toString: function() {
      var v    = this.validate(/(module)(\s+)/);
      var last = v.last;
      var m = last.match(/^([\w$]+(\.[\w$]+)*)/);
      if (m) {
        var name   = m[1];
        var source = last.substr(name.length);
        return JS2.DECORATOR.createModule(name, source);
      } else {
        // raise error
      }
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
        case 'static': return StaticMember;
        case 'include': return Include;
      }
    },

    handleToken: function(token) {
      if (this.tokens.isBalancedCurly(this) && token[0] == '}') {
        this.closed = true;
      }
    },

    toString: function() {
      var str = this.$super();
      return str.replace(/^{/, 'function(KLASS, OO){');
    }
  });

  var Include = Content.extend({
    name: 'Include',
    handleToken: function(token) {
      if (token[0] == ';') this.closed = true;
    },

    toString: function() {
      var v = this.validate(/^(include)(\s+)/);
      return "OO.include(" + v.last.replace(/;$/, ');');
    }
    
  });

  var StaticMember = Content.extend({
    name: 'StaticMember',
    handOff: function(token) {
      if (this.started) this.closed = true;

      switch (token[0]) {
        case 'var': this.started = true; return Member;
        case 'function': this.started = true; return Method;
      }
    },

    toString: function() {
      var member = this.handOffs[0];
      if (!member) return '';
      var ret = member.toString();
      return ret.replace(/addMember/, 'addStaticMember');
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
      return 'OO.addMember("' + v[3] + '",' + "function" + v[2] + v[5] + ' ' + v[7] + ');';
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

      return 'OO.addMember("' + v[3] + '",' + last + ');';
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
    cache: { count: 0 },
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
      this.cache.count++;
      var v = this.validate(/(foreach)(\s*)(Braces)(\s*)(Block)/);
      var ret =  "for" + this.getBrace(v[3]) + v[5].toString();
      this.cache.count--;
      return ret;
    },

    getBrace: function(brace) {
      var n = this.cache.count;
      var collectionName = "_c" + n;
      var l = "_l" + n;

      var v = brace.validate(/(\()(\s*)(var)(\s+)(I)(\s*\:\s*(I))?(\s+)(in)(\s+)/);
      if (!v) return '';
      var iteratorName   = v[7] || "_i" + n;

      var holder = v[5];
      var collection = v.last.replace(/\)$/, '');

      return "(var " + iteratorName + "=0," +
              collectionName + "=" + collection + "," +
              l + "=" + collectionName + ".length," +
              holder + ";(" +
              holder + '=' + collectionName + '[' + iteratorName + '])||(' +
              iteratorName + '<' + l + ');' +
              iteratorName + '++)';
    }
  });

  var ShortFunct = Content.extend({
    name: "ShortFunct",
    handOff: function(token) {
      if (this.started) {
        this.closed = true;
        this.semi = (new Validator(this.tokens.toArray())).validate(/^(\s*)([^\s\w$])/, 2) ? '' : ';';
      } 

      switch (token[0]) {
        case '(': return Braces;
        case '{': this.started = true; return Block;
      }
    },

    parseArgs: function(str) {
      // (arg1, arg2 with scope1, scope2 binds bindingVar)
      var m =  str.match(/^\((\s*([\w\$]+)(\s*,\s*[\w\$]+)*)?(\s*with\s+(([\w\$]+)(\s*,\s*[\w\$]+)*))?(\s*binds\s+(.+))?\)/);
      if (!m) {}  // raise error

      return {
        braces: '(' + (m[1] || '') + ')',
        scope:  m[5],
        binds:  m[9]
      };
    },

    toString: function() {
      var scopes   = null;
      var inScopes = null;

      var v    = this.validate(/(#)(Braces)?(\s*)(Block)/);
      var args = this.parseArgs(v[2] ? v[2].toString() : '($1,$2,$3)');
      var body = v[4];

      // we need a function within a function
      if (args.binds || args.scope) {
        var scope   = args.scope || '';
        var inScope = scope;

        // need to pass in __self and bind to __self
        if (args.binds) {
          var comma = scope == '' ? '' : ',';
          inScope = scope.replace(/^/, '__self' + comma);
          scope   = scope.replace(/^/,  args.binds + comma);
          
          return '(function(' + inScope + '){' + 'var f = function' + args.braces + body + ';' + ' return function() { return f.apply(__self, arguments)};})(' + scope + ')' + this.semi; 
        } 
        
        // no binding, just use scoping 
        else {
          return '(function(' + inScope + '){' + 'return function' + args.braces + body + ';' + '})(' + scope + ')' + this.semi; 
        }
      } 
      
      // just a normal function
      else {
        return "function" + args.braces + body + this.semi;
      }
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

JS2.Class.extend('FileSystem', function(KLASS, OO){
  OO.addMember("initialize",function (adapter) {
    this.adapter = adapter;
  });

  OO.addMember("find",function (dir, ext, recursive) {
    return this._find(this.expandPath(dir), new RegExp('\\.' + ext + '$'), recursive);
  });

  OO.addMember("_find",function (dir, regex, recursive) {
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
  });

  OO.addMember("canonical",function (file) {
    var abs = this.expandPath(file);
    abs = abs.replace(/\/$/, '');
    return abs;
  });

  OO.addMember("mkpath",function (file) {
    var dirname = this.canonical(this.dirname(file));

    var subdirs = js2(dirname.split('/'));
    subdirs.shift();
    var toMake = '';

    var self = this;
    subdirs.each(function($1,$2,$3){
      toMake += '/' + $1;
      self.mkdir(toMake); 
    });
  });

  // ADAPTER USAGE
  OO.addMember("dirname",function (file) {
    return this.adapter.dirname(file);
  });

  OO.addMember("readdir",function (file) {
    return this.adapter.readdir(file);
  });

  OO.addMember("read",function (file) {
    var data = this.adapter.read(file);
    return data;
  });

  OO.addMember("write",function (file, data) {
    return this.adapter.write(file, data);
  });

  OO.addMember("mtime",function (file) {
    return this.adapter.mtime(file);
  });

  OO.addMember("exists",function (file) {
    return this.isDirectory(file) || this.isFile(file);
  });

  OO.addMember("mkdir",function (file) {
    if (!this.exists(file)) {
      return this.adapter.mkdir(file);
    }
  });

  OO.addMember("isFile",function (file) {
    try {
      return this.adapter.isFile(file);
    } catch(e) {
      return false;
    }
  });

  OO.addMember("setInterval",function (code, interval) {
    return this.adapter.setInterval(code, interval);
  });

  OO.addMember("isDirectory",function (file) {
    try {
      return this.adapter.isDirectory(file);
    } catch(e) {
      return false;
    }
  });

  OO.addMember("expandPath",function (file) {
    return this.adapter.expandPath(file);
  });
});

JS2.Class.extend('Updater', function(KLASS, OO){
  OO.addMember("initialize",function (fs, inDir, outDir, recursive) {
    this.recursive = recursive;
    this.fs        = fs; 
    this.inDir     = this.fs.canonical(inDir);
    this.targetDir = this.fs.canonical(outDir);
    this.verbose = true;
  });

  OO.addMember("update",function (force, funct) {
    var self = this;
    this.matchDirs(this.inDir);
    this.fs.find(this.inDir, 'js2', this.recursive).each(function($1,$2,$3){
      self.tryUpdate($1, force, funct); 
    });
  });

  OO.addMember("matchDirs",function (dir) {
    var subs = this.fs.readdir(dir);
    for(var _i1=0,_c1=subs,_l1=_c1.length,sub;(sub=_c1[_i1])||(_i1<_l1);_i1++){
      var path = dir + '/' + sub;
      if (this.fs.isDirectory(path)) {
        this.fs.mkdir(path.replace(this.inDir, this.targetDir));
        this.matchDirs(path);
      }
    }
  });

  OO.addMember("tryUpdate",function (file, force, funct) {
    var outFile = file.replace(this.inDir, this.targetDir).replace(/\.js2$/, '.js');

    var dir = this.fs.dirname(file);
    if (! this.fs.isDirectory(dir)) this.fs.mkpath(dir);

    if (force || this.fs.mtime(file) > this.fs.mtime(outFile)) {
      JS2.LOGGER.info(file + ' -> ' + outFile);
      if (funct) {
        this.fs.write(outFile, funct(JS2(this.fs.read(file))));
      } else {
        this.fs.write(outFile, JS2(this.fs.read(file)));
      }
    }
  });
});

JS2.Class.extend('Config', function(KLASS, OO){
  OO.addMember("CLI_REGEX",/^-(r|i|f|n|v|m)(=(\w+))?$/);
  OO.addMember("optsLookup",{ 
    'n': 'non-recursive',
    'i': 'interval',
    'f': 'format',
    'v': 'verbose',
    'm': 'use_mtime'
  });

  OO.addMember("initialize",function (fs, argv) {
    this.format    = 'browser';
    this.recursive = true;
    this.interval  = 2;
    this.sourceDir = './app/js2';
    this.targetDir = './public/javascripts';
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
          this[this.optsLookup[m[1]]] = m[3] || true; 
        } else if (! this.command) {
          this.command = opt;
        } else {
          this.args.push(opt);
        }
      }
    }

    this.recursive = !this['non-recursive'];
    this.interval = parseInt(this.interval);
  });

  OO.addMember("loadConfigFile",function (file) {
    if (this.fs.isFile(file)) {
      try {
        var config = JSON.parse(this.fs.read(file).replace(/\n\r?/g, ''));

        if (config['out-dir']) {
          config['target-dir'] = config['target-dir'] || config['out-dir'];
          console.log("Please use target-dir instead of out-dir");
        }

        this.format    = config.format || this.format;
        this.interval  = config['interval'] ? config['interval'] : this.interval;
        this.sourceDir = config['source-dir'] || this.sourceDir;
        this.targetDir = config['target-dir'] || this.targetDir;
        this.verbose   = ('verbose' in config) ? config['verbose'] : false;

        this['non-recursive'] = config['non-recursive'];
        this['use-mtime']     = config['use-mtime'];

        return true;
      } catch(e) {
        console.log(e.toString());
      }
    }
    return false;
  });

});

JS2.Class.extend('Commander', function(KLASS, OO){
  OO.addMember("BANNER","js2 <command> [options] <arguments>\n" +
    "VERSION: " + JS2.VERSION + "\n" +
    "Commands:\n" +
    "  * run <file>                         -- Executes file\n" +
    "  * render <file>                      -- Shows JS2 compiled output\n" +
    "  * compile <source dir> [target dir]  -- Compiles a directory and puts js files into target dir.  If target dir is not specified, source dir will be used\n" + 
    "    Options:\n" +
    "      -n                               -- Do NOT traverse directories recursively\n" +
    "      -v                               -- Verbose \n" +
    "      -f=<format>                      -- Compile for different formats: node, ringo, or browser\n" +
    "  * compile <file>                     -- Compiles a single js2 file into js\n" +
    "  * watch <source dir> <target dir>    -- Similar to compile, but update will keep looping while watching for modifications\n" +
    "    Options:\n" +                      
    "      -n                               -- Do NOT traverse directories recursively\n" +
    "      -f=<format>                      -- Compile for different formats: node, ringo, or browser\n" +
    "      -v                               -- Verbose \n" +
    "      -i=<seconds>                     -- Interval time in seconds between loops\n");

  OO.addMember("initialize",function (argv) {
    this.fs      = JS2.fs;
    this.config  = new JS2.Config(this.fs, argv);
    this.command = this.config.command;

    // HACK for now
    JS2.VERBOSE = this.config.verbose || false;
    JS2.LOGGER  = { info: function($1,$2,$3){ if (JS2.VERBOSE) console.log($1) } };

    switch(this.config.format) {
      case 'ringo':    JS2.DECORATOR = new JS2.RingoDecorator(); break;
      case 'node':     JS2.DECORATOR = new JS2.NodeDecorator(); break;
      default:  JS2.DECORATOR = new JS2.BrowserDecorator(); break;
    }
  });

  OO.addMember("cli",function () {
    if (this[this.command]) {
      this[this.command]();
    } else {
      this.showBanner();
    }
  });

  OO.addMember("render",function () {
    console.log(js2.render(this.fs.read(this.config.args[0])));
  });

  OO.addMember("run",function () {
    var file;
    var i = 0;
    while (file = this.config.args[i++]) {
      eval(js2.render(this.fs.read(file))); 
    }
  });

  OO.addMember("compile",function () {
    var self = this;
    var force = this.config['use-mtime'] ? false : true;
    this.getUpdater().update(force, function($1,$2,$3){ return JS2.DECORATOR.file($1); });
  });

  OO.addMember("getUpdater",function () {
    var inDir     = this.config.args[0] || this.config.sourceDir || '.';
    var targetDir = this.config.args[1] || this.config.targetDir || inDir;
    return new JS2.Updater(this.fs, inDir, targetDir, this.config.recursive);
  });

  OO.addMember("watch",function () {
    var updater = this.getUpdater();
    var self = this;
    var interval = this.config.interval || 2;
    JS2.LOGGER.info('Source Directory:' + updater.inDir + ' -> Target Directory:' + updater.targetDir);
    if (updater.recursive) JS2.LOGGER.info('RECURSIVE');

    // HACK to get this integrated with ruby
    var decor = function($1,$2,$3){ return JS2.DECORATOR.file($1) };
    updater.update(true, decor);
    this.fs.setInterval(function($1,$2,$3){ JS2.LOGGER.info('updating'); updater.update(false, decor); }, interval * 1000);
  });

  OO.addMember("showBanner",function () {
    console.log(this.BANNER);
  });
});


JS2.Class.extend('BrowserDecorator', function(KLASS, OO){
  OO.addMember("file",function (code) {
    return code;
  });

  OO.addMember("klass",function (name, par, source) {
    return par+".extend('"+name+"',"+source+");";
  });

  OO.addMember("createModule",function (name, source) {
    return "JS2.Module.extend('"+name+"',"+source+");";
  });
});

JS2.Class.extend('NodeDecorator', function(KLASS, OO){
  OO.addMember("file",function (code) {
    return "var js2 = require('js2').js2;\nvar JS2 = js2;\n" + code;
  });

  OO.addMember("klass",function (name, par, source) {
    return "var "+name+"=exports['"+name+"']="+par+".extend("+source+");";
  });

  OO.addMember("createModule",function (name, source) {
    return "var "+name+"=exports['"+name+"']=JS2.Module.extend("+source+");";
  });
});

JS2.Class.extend('RingoDecorator', function(KLASS, OO){
  OO.addMember("file",function (code) {
    return "var js2 = require('js2').js2;\nvar JS2 = js2;\n" + code;
  });

  OO.addMember("klass",function (name, par, source) {
    return "var "+name+"=exports['"+name+"']="+par+".extend("+source+");";
  });

  OO.addMember("createModule",function (name, source) {
    return "var "+name+"=exports['"+name+"']=JS2.Module.extend("+source+");";
  });
});

JS2.DECORATOR = JS2.DECORATOR || new JS2.BrowserDecorator();

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
    if (line.match(/^\s*$/)) return;

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
  OO.addMember("SPLIT_REGEX",/^((?:\.|\#|\%)[^=\s\{]*)?(\{.*\})?(=|-)?(?:\s*)(.*)$/);
  OO.addMember("TOKEN_REGEX",/(\%|\#|\.)([\w][\w\-]*)/g);
  OO.addMember("JS_REGEX",/^(-|=)(.*)$/g);
  OO.addMember("SCOPE_OFFSET",1);
  OO.addMember("SELF_CLOSING",{ area: null, basefont: null, br: null, hr: null, input: null, img: null, link: null, meta: null });

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

    if (this.SELF_CLOSING.hasOwnProperty(this.nodeType) && this.children.length == 0) {
      this.selfClose = '/';
    } else {
      this.selfClose = '';
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
      out.unshift('out.push("<' + this.nodeType + '"+JS2.JSMLElement.parseAttributes(' + (this.attributes || "{}") + ', ' + JSON.stringify(this.classes || []) + ', ' + JSON.stringify(this.id || null) + ')+"' + this.selfClose + '>");\n');
      if (this.selfClose == '') {
        out.push('out.push(' + JSON.stringify("</"+(this.nodeType)+">") + ');\n');
      }
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


  JS2.Class.extend('RingoFileAdapter', function(KLASS, OO){
  OO.addMember("initialize",function () {
    this.fs = require('fs'); 
  }); 

  OO.addMember("isDirectory",function (file) {
    return this.fs.isDirectory(file);
  });

  OO.addMember("setInterval",function (code, interval) {
    return setInterval(code, interval);
  });

  OO.addMember("dirname",function (file) {
    var path = this.expandPath(file);
    return file.replace(/[^\/]*$/, '');
  });


  OO.addMember("isFile",function (file) {
    return this.fs.isFile(file);
  });

  OO.addMember("mkdir",function (file) {
    return this.fs.makeDirectory(file);
  });

  OO.addMember("readdir",function (file) {
    return this.fs.list(file);
  });

  OO.addMember("expandPath",function (file) {
    return this.fs.canonical(file);
  });

  OO.addMember("read",function (file) {
    return this.fs.read(file);
  });

  OO.addMember("write",function (file, data) {
    return this.fs.write(file, data);
  });

  OO.addMember("mtime",function (file) {
    try {
      return this.fs.openRaw(file).lastModified().getTime();
    } catch(e) {
      return 0;
    }
  });
});

  JS2.fs = new FileSystem(new RingoFileAdapter());

  JS2.DECORATOR = new JS2.RingoDecorator();
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
