(function (undefined, JS2) {
  var TOKENS = [ 
    [ 'COMMENT', "\\/\\/|/\\*" ],
    [ 'SPACE', "\\s+" ],
    [ 'REGEX', "\\/" ],
    [ 'CLASS', "class" ],
    [ 'SHORT_FUNCT', "->|=>" ],
    [ 'FOREACH', "foreach" ],
    [ 'CURRY', "curry" ],
    [ 'IDENT', "[\\w$]+" ],
    [ 'HERE_DOC', "<<[A-Z_]+" ],
    [ 'DSTRING', '"' ],
    [ 'SSTRING', "'" ],
    [ 'ISTRING', "%\\{" ],
    [ 'OPERATOR', "[^\w]" ]
  ];

  var IDS = {};
  var REGEX_TOKENS = [];
  for (var i=0,token; token=TOKENS[i]; i++) {
    IDS[token[0]] = i;
    REGEX_TOKENS.push("(" + token[1] + ")");
  }

  var PRIMARY_REGEX = new RegExp("^(" + REGEX_TOKENS.join('|') + ")");

  JS2.Lexer = JS2.Class.extend({
    TOKENS: TOKENS,
    PRIMARY_REGEX: PRIMARY_REGEX,
    IDS: IDS,

    initialize: function(str) {
      this.tokens = (typeof str == 'string') ? new JS2.Lexer.Tokens(str) : str;
    },

    tokenize: function() {
      while (!this.tokens.finished()) {
        if (! this.consume()) return false;
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

  JS2.Lexer.REGEX = JS2.Lexer.extend({
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

  JS2.Lexer.SSTRING = JS2.Lexer.REGEX.extend({
    REGEX: /^'[^\\']*(?:\\.[^\\']*)*'/,
    ID: IDS.SSTRING
  });

  JS2.Lexer.DSTRING = JS2.Lexer.REGEX.extend({
    REGEX: /^"[^\\"]*(?:\\.[^\\"]*)*"/,
    ID: IDS.DSTRING
  });

  JS2.Lexer.ISTRING = JS2.Lexer.REGEX.extend({
    REGEX_NEXT: /^((\\#|[^#])*?)(#{|})/,
    REGEX: /^%{/,
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

  JS2.Lexer.Block = JS2.Lexer.extend({
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

  JS2.Lexer.COMMENT = JS2.Lexer.extend({
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




  JS2.Lexer.Tokens = JS2.Class.extend({
    initialize: function(str) {
      this.tokens = [];
      this.index  = 0;
      this.str    = str;
      this.orig   = str;
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
      return this.tokens.shift();
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
})(undefined, JS2);
