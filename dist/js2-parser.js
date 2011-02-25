var JS2 = (function () {
  var JS2 = {};
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

(function (undefined, JS2) {
  var SSTRING_REGEX = /^'[^\\']*(?:\\.[^\\']*)*'/s;
  var DSTRING_REGEX = /^"[^\\"]*(?:\\.[^\\']*)*"/s;
  var REGEX_REGEX   = /^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/s;

  var ISTRING_REGEX     = /^(%\{|})([^\\{]*(?:\\.[^\\']*)*)(#\{|})/s;
  var ISTRING_REGEX_FIN = /^(%\{|})[^\\"]*(?:\\.[^\\']*)*(})/s;

  function comment(str, lexer) {
    var m = str.match(/^\/\/.*/);
    if (m) return m[0];

    var mode = 0;
    for (var i=0; i<str.length; i++) {
      if (str.charAt(i) == '*') {
        mode++;
      } else if (str.charAt(i) == '/' && mode == 1) {
        mode++;
      } else {
        mode = 0;
      }

      if (mode == 2) return str.substr(0,i+1);
    }
  }

  function istring(str, lexer) {
    var tokens = [];
    var m = ISTRING_REGEX.exec(str);

    // found it!
    if (!m) return null;

    if (m[3] == '#{') {
      lexer.tokens.push([ '"' + m[2] + '"+(', IDS.DSTRING ]);

      var curlyCount = 1;
      var res = null;
      lexer.chomp(m[0]);

      while (res = lexer.next(lexer.str)) {
        if (res == -1) return res;
        if (res[0] == '{') {
          ++curlyCount;
        } else if (res[0] == '}') {
          --curlyCount;
        } 

        if (curlyCount == 0) {
          lexer.tokens.push([')+', IDS.DSTRING]);
          istring(lexer.str, lexer);
          break;
        } else {
          lexer.tokens.push(res);
          lexer.chomp(res[0]);
        }
      }
    }

    else if (m[3] == '}') {
      lexer.chomp(m[0]);
      lexer.tokens.push([ '"' + m[2] + '"', IDS.DSTRING ]);
    }

    return -1;
  }

  var TOKENS = [ 
    [ 'COMMENT', "\\/\\/|/\\*", comment ],
    [ 'SPACE', "\\s+" ],
    [ 'REGEX', "\\/", function(str) { var m = REGEX_REGEX.exec(str); if (m) return m[0] } ],
    [ 'CLASS', "class" ],
    [ 'SHORT_FUNCT_ASSIGN', "=>" ],
    [ 'SHORT_FUNCT', "->" ],
    [ 'FOREACH', "foreach" ],
    [ 'CURRY', "curry" ],
    [ 'IDENT', "[\\w$]+" ],
    [ 'HERE_DOC', "<<[A-Z_]+" ],
    [ 'DSTRING', '"', function(str) { var m = DSTRING_REGEX.exec(str); if (m) return m[0]; } ],
    [ 'SSTRING', "'", function(str) { var m = SSTRING_REGEX.exec(str); if (m) return m[0]; } ],
    [ 'ISTRING', "%\\{", istring ],
    [ 'OPERATOR', "[^\w]" ]
  ];

  var IDS = {};
  var REGEX_TOKENS = [];
  for (var i=0,token; token=TOKENS[i]; i++) {
    IDS[token[0]] = i;
    REGEX_TOKENS.push("(" + token[1] + ")");
  }

  var PRIMARY_REGEX = new RegExp("^(" + REGEX_TOKENS.join('|') + ")");

  var Tokens = JS2.Class.extend({
    initialize: function() {
      this.tokens = [];
      this.curlyCount = 0;
      this.braceCount = 0;
    },

    peek: function() {
      return this.tokens[0];
    },

    toArray: function() {
      return this.tokens;
    },

    shift: function() {
      var item = this.tokens.shift(item);
      if (item[0] == '{') {
        this.curlyCount++;
      } else if (item[0] == '}') {
        this.curlyCount--;
      } else if (item[0] == '(') {
        this.braceCount++;
      } else if (item[0] == ')') {
        this.braceCount--;
      }
      return item;
    },

    push: function(item) {
      this.tokens.push(item);
    },

    pop: function() {
      return this.tokens.pop();
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
    }

  });

  var Lexer = JS2.Class.extend({
    tokenize: function(str) {
      this.tokens = new Tokens();
      this.str    = str;
      var res;

      while (res = this.next(this.str)) {
        if (res == -1) continue;

        this.tokens.push(res); 
        this.chomp(res[0]);
      }

      return this.tokens;
    },

    chomp: function(str) {
      this.str = this.str.substr(str.length);
    },

    next: function(str) {
      if (str.length == 0) return null;
      var m = PRIMARY_REGEX.exec(str);
      var res   = null;
      var type  = null;

      for (var i=0,token;token=TOKENS[i]; i++) {
        if (m[0] == m[i+2]) {
          res  = token[2] ? token[2](str, this) : m[0];
          type = i;
          if (res) break;
        }
      }

      if (res == -1) return res;
      return res ? [ res, type ] : null;
    }
  });

  Lexer.IDS = IDS;
  JS2.Lexer = Lexer;
})(undefined, JS2);


(function (undefined, JS2) {
  Parser = {
    parse: function(str) {
      var lexer   = new JS2.Lexer();
      var tokens  = lexer.tokenize(str);
      var root    = new Content(tokens);
      return root;
    },

    parseFile: function(file) {
      return this.parse(require('fs').readFileSync(file, 'utf8'));
    }
  };

  var KEYWORDS = { 'var': null, 'class': null, 'function': null, 'in': null, 'with': null, 'curry': null };
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
      var v  = this.validate(/(class)(\s+)(I)(\s*)/);
      return "var " + v[3] + "=(function() { return JS2.Class.extend(" + v.last + ")();";
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
      var str = this.super();
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
      var v  = this.validate(/(function)(\s+)(I)(\s*)/);
      return v[1] + ':' + "function" + v.last + ',';
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
      switch (token[0]) {
        case '(': this.hasBrace = true; return Braces;
        case '{': this.started = true; return Block;
      }
    },

    toString: function() {
      var ret = ['function']; 
      var i = 0;
      if (this.hasBrace) {
        ret.push(this.handOffs[i++].toString());
      } else {
        ret.push("($1,$2,$3)");
      }

      ret.push(this.handOffs[i].toString());
      return '';
      return ret.join('');
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
        case '(': this.nbraces++; return Braces;
        case '{': this.started = true; return Block;
        case 'with': this.hasWith = true;
      }
    },

    toString: function() {
      var v = this.validate(/(curry)(\s*)(Braces)?(\s*)(with)?(\s*)(Braces)?(\s*)(Block)/);
      var ret = [ '(function(){return function'];

      // args
      ret.push(v[3] ? v[3].toString() : '($1,$2,$3)');

      // block
      ret.push(v[9].toString());

      // close outer block
      ret.push("})");

      // scope
      ret.push(v[5] ? v[7].toString() : "()");

      if (this.addSemiColon) ret.push(';');

      return ret.join('');
    }
  });
  JS2.Parser = Parser;
  JS2.require = function(file) {
    var str = JS2.Parser.parseFile(file).toString(); 
    eval(str);
  }
})(undefined, JS2);

  return JS2;
})();
