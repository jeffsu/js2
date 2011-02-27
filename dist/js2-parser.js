var JS2 = (function (root) {
  var JS2 = {};

  JS2.MODE = 'web_parser';
  JS2.ROOT = root;
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

(function (undefined, JS2) {
  var SSTRING_REGEX = /^'[^\\']*(?:\\.[^\\']*)*'/;
  var DSTRING_REGEX = /^"[^\\"]*(?:\\.[^\\']*)*"/;
  var REGEX_REGEX   = /^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/;

  var ISTRING_REGEX     = /^(%\{|})([^\\{]*(?:\\.[^\\']*)*)(#\{|})/;
  var ISTRING_REGEX_FIN = /^(%\{|})[^\\"]*(?:\\.[^\\']*)*(})/;

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
    [ 'SHORT_FUNCT', "->|=>" ],
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

  var Lexer = JS2.Class.extend('Lexer', {
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
      this.str = this.str.toString().substr(str.length);
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


  var Validator = JS2.Class.extend('Validator', {
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

  var Content = JS2.Class.extend('Content', {
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
      return "var " + v[3] + "=(function() { return JS2.Class.extend('"+v[3]+"'," + v.last + ")})();";
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
      if (this.started) this.closed;
      switch (token[0]) {
        case '(': return Braces;
        case '{': this.started = true; return Block;
      }
    },

    toString: function() {
      var v = this.validate(/(->)(\s*)(Braces)?(\s*)(Block)/);
      return (v[1] == '->' ? '' : '=') + "function" + (v[3] ? v[3] : "($1,$2,$3)") + v[5];
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

  JS2.parse = function(str) { return this.Parser.parse(str); };
  JS2.parseFile = function(file) { return this.Parser.parseFile(file); };
  JS2.render = function(str) { return this.parse(str).toString(); };
  JS2.renderFile = function(file) { return this.parseFile(file).toString(); };

})(undefined, JS2);

  (function (undefined, JS2) {
  JS2.require = function(file, callback) {
    var xmlhttp;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
      xmlhttp = new XMLHttpRequest();
    } else { 
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
        try {
          eval(JS2.render(xmlhttp.responseText));
        } catch(e) {
          console.log(JS2.render(xmlhttp.responseText));
        }
        if (callback) callback(xmlhttp.responseText);
      }
    }

    xmlhttp.open("GET",file,true);
    xmlhttp.send();
  }
})(undefined, JS2);

  return JS2;
})(window);
