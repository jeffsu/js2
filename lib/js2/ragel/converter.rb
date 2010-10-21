
class Converter
  attr_accessor :file

  def initialize(file, lexer)
    @file = file
  end

  def tokenize(str)
    data_length = str.length
    data = str.unpack("c*")
    eof  = str.length

    in_class      = 0
    curlies       = []
    close_on_semi = false

    is_static  = false
    is_private = false

    curly_idx = 0 # nth '{'
    cb_count  = 0
    br_count  = 0

    <%= replacer.start_node :STUFF, 0, true %>

    %% write data;
    %% write init;
    %% write exec;

    <%= replacer.stop_node('data_length-1') %>



  end

  def start_node (type, idx, is_static)
    @lexer.start_node(type, idx, is_static)
  end

  def stop_node (idx)
    @lexer.stop_node(idx)
  end

  def mark_node (idx)
    @lexer.mark_node(idx)
  end

  def tokenize! (data, lexer)
    @data  = data
    @lexer = lexer
    self.tokenize(data)
  end


end

 %%{
  machine js2;
  alphtype char;

  action actionStringBegin {
  }

  action actionStringAcc {
  }

  action actionStringAccBsEscape {
  }

  action actionStringAccUtf16 {
  }

  unicodecharacter = any;
  unicodeinitialalphabetic = alpha;
  unicodealphanumeric = alnum;
  whitespacecharacter = [\t\v\f ];
  lineterminator = ('\r' | '\n');
  asciidigit = digit;
  ws = (whitespacecharacter | lineterminator);

  literals = (
      '=='  | '!='  | '===' | '!==' | '<='  | '>='  | '||'  | '&&'  | '++'  | '--'  | '<<'  | '<<=' | '>>'  | '>>=' | '>>>' | '>>>='| '&='  | '%='  | '^='  | '|='  | '+='  | '-='  | '*='  | '/='  
  );

  # put in class
  # put in accessor
  keywords = (
    'break' | 'case' | 'catch' | 'continue' | 'default' | 'delete' | 'do' |
    'else' | 'finally' | 'for' | 'function' | 'if' | 'in' | 'instanceof' |
    'new' | 'return' | 'switch' | 'this' | 'throw' | 'try' | 'typeof' | 'var' | 'accessor' |
    'void' | 'while' | 'with' | 'const' | 'true' | 'false' | 'null' | 'debugger' | 
    'class' | 'static' | 'foreach' | 'module' | 'include' | 'property'
  );

  # took out class
  reserved = (
    'abstract' | 'boolean' | 'byte' | 'char' | 'double' | 'enum' | 'export' |
    'extends' | 'final' | 'float' | 'goto' | 'implements' | 'import' | 'int' | 'interface' |
    'long' | 'native' | 'package' | 'private' | 'protected' | 'public' | 'short' |
    'super' | 'synchronized' | 'throws' | 'transient' | 'volatile' 
  );

  nonterminator = any - lineterminator;
  linecommentcharacters = nonterminator*;
  nonterminatororslash = nonterminator - '/';
  nonterminatororastreisk = nonterminator - '*';
  nonterminatororasteriskorslash = nonterminator - ('*' | '/');
  blockcommentcharacters = (nonterminatororslash | (nonterminatororastreisk '/'))*;
  multilineblockcommentcharacters = (blockcommentcharacters lineterminator)*;

  linecomment = '//' linecommentcharacters;
  singlelineblockcomment = '/*' blockcommentcharacters '*/';
  multilineblockcomment = '/*' multilineblockcommentcharacters blockcommentcharacters '*/';
  comment = linecomment | singlelineblockcomment | multilineblockcomment;
  
  string_begin = '\'' @ actionStringBegin;
  string_end = '\'';
  stringchar_normal = ^(['\\] | 0..0x1f) @ actionStringAcc;
  stringchar_bs_esc = '\\'['\\/bfnrt] @ actionStringAccBsEscape;
  stringchar_utf16 = '\\u'[0-9a-fA-F]{4} @ actionStringAccUtf16;
  stringchar_bs_other = '\\'^(['\\/bfnrtu]|0..0x1f) @ actionStringAccBsEscape;
  stringchar = (stringchar_normal | stringchar_bs_esc | stringchar_utf16 | stringchar_bs_other);
  string = string_begin . stringchar* . string_end;

  ds_string_begin = '"' @ actionStringBegin;
  ds_string_end = '"';
  ds_stringchar_normal = ^(["\\] | 0..0x1f) @ actionStringAcc;
  ds_stringchar_bs_esc = '\\'["\\/bfnrt] @ actionStringAccBsEscape;
  ds_stringchar_utf16 = '\\u'[0-9a-fA-F]{4} @ actionStringAccUtf16;
  ds_stringchar_bs_other = '\\'^(["\\/bfnrtu]|0..0x1f) @ actionStringAccBsEscape;
  ds_stringchar = (ds_stringchar_normal | ds_stringchar_bs_esc | ds_stringchar_utf16 | ds_stringchar_bs_other);
  ds_string = ds_string_begin . ds_stringchar* . ds_string_end;

  all_string = string | ds_string;

  integer = '-'? . digit+;
  float = '-'? (
    (('0' | [1-9][0-9]*) '.' [0-9]+ ([Ee] [+\-]?[0-9]+)?)
    | (('0' | [1-9][0-9]*) ([Ee] [+\-]?[0-9]+))
  );
  number = integer | float;

  identifier_char = ([a-zA-Z0-9_]) | '$';
  identifier = identifier_char+;

  ordinaryregexpchar = nonterminator - ('/' | '\\');
  regexpchars = (ordinaryregexpchar | '\\' nonterminator)+;
  regexpbody = '/' @ {regexp_start = p;} regexpchars '/';
  regexpflags = ('g' | 'i' | 'm')*;
  regexpliteral = regexpbody regexpflags;

  specialcasedivide = (
    identifier '/'
  );
  single_char = any;

  var_list   =  (identifier . ws* . ',' . ws*)* . identifier?;
  arg_list   = '(' . ws* . var_list . ws* .')';

  curry_with = 'with' . ws* . arg_list;
  curry      = 'curry' . ws* . arg_list? . ws* . curry_with? . ws*;

  foreach    = 'foreach' . ws* . '(' . ws* . 'var' . ws* . identifier . (ws* . ':' . ws* . identifier)? . ws*;

  js2_include    = 'include' . ws+  . identifier;
  js2_class      = 'class' . ws+  . identifier;
  js2_module     = 'module' . ws+  . identifier;

  property   = ws . 'property' . ws . var_list;
  member     = ws . ('static' . ws+)? . 'var' . ws+  . identifier;
  method     = ws . ('static' . ws+)? . 'function' . ws* . identifier;
  private    = ws . 'private' . ws;
  accessor   = ws . 'accessor' . ws;


  main := |*

    lineterminator => { 
      //line_number++;
    };

    js2_class => {
      if (in_class == 0) {
        <%= replacer.start_node :CLASS %>
        in_class = curly_idx;
      }
    };

    private => {
      if (in_class && in_class == curly_idx) {
        <%= replacer.start_node :PRIVATE %>
        <%= replacer.stop_node  %>
      }
    };

    js2_module => {
      if (in_class == 0) {
        <%= replacer.start_node :MODULE %>
        in_class = curly_idx;
      }
    };

    property => {
      if (in_class && in_class == curly_idx) {
        <%= replacer.start_member :PROPERTY %>
      }
    };

    accessor => {
      if (in_class && in_class == curly_idx) {
        <%= replacer.start_member :ACCESSOR %>
      }
    };


    member => {
      if (in_class && in_class == curly_idx) {
        <%= replacer.start_member :MEMBER %>
      }
    };

    method => {
      if (in_class && in_class == curly_idx) {
        <%= replacer.start_node :METHOD %>
      }
    };


    js2_include => {
      if (in_class && in_class == curly_idx) {
        <%= replacer.start_member :INCLUDE %>
      }
    };

    foreach => {
      <%= replacer.start_node :FOREACH %>
      mark_on_br = br_count;
      br_count++;
    };

    curry => {
      <%= replacer.start_node :CURRY %>
    };

    whitespacecharacter => {};
    comment => { 
      <%= replacer.comment %>  
    };

    all_string => {};
    number => {};
    keywords => { };

    literals => { };
    reserved => { };
    identifier => { };

    <%= replacer.def_literals %>

    single_char | (('(' | '{' | ';' | '}') ws* regexpliteral) => {
      char single = data[ts-data];

      if (single == '{') {
        in_foreach = 0;
        cb_count++;
      } else if (single == '}') {
        cb_count--;
        if (curly_idx && curlies[curly_idx] == cb_count) {
          in_foreach = 0;
          <%= replacer.stop_node %>
          if (curlies[in_class] == cb_count) {
            in_class = 0;
          }
        }
      } else if (single == ';' && close_on_semi == 1) {
        <%= replacer.stop_member %>
      }

      if (single == ';' || single == '}') {
        classable = 1;
      }

      if (single == '(') {
        br_count++;
      } else if (single == ')') {
        br_count--;
        if (mark_on_br == br_count) {
          <%= replacer.stop_node %>
          mark_on_br = -1;
        }
      }
    };

  *|;
}%%


