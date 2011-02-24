JS2.Lexer = (function () {
  var SSTRING_REGEX = /^'[^\\']*(?:\\.[^\\']*)*'/s;
  var DSTRING_REGEX = /^"[^\\"]*(?:\\.[^\\']*)*"/s;
  var REGEX_REGEX   = /^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/s;

  var ISTRING_REGEX     = /^(%\{|})([^\\{]*(?:\\.[^\\']*)*)(#\{|})/s;
  var ISTRING_REGEX_FIN = /^(%\{|})[^\\"]*(?:\\.[^\\']*)*(})/s;

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
    [ 'OPERATOR', "." ]
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

  var l = new Lexer();
  return Lexer;
})();

