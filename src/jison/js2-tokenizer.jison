
%lex
esc "\\"

%%

\s+            return 'SPACE'
[a-zA-Z0-9$]+  return 'IDENT'

'"'("\\"["bfnrt/{esc}]|"\\u"[a-fA-F0-9]{4}|[^\0-\x08\x0a-\x1f"{esc}])*'"' { return 'D_STRING';}
"'"("\\"["bfnrt/{esc}]|"\\u"[a-fA-F0-9]{4}|[^\0-\x08\x0a-\x1f"{esc}])*"'" { return 'S_STRING';}


"<<"([A-Z]+) return 'HERE_DOC'
'{'      return 'OPEN_CURLY'
'}'      return 'CLOSE_CURLY'
'('      return 'OPEN_BRACE'
')'      return 'CLOSE_BRACE'
'->' return 'SHORT_FUNCTION'
'=>' return 'SHORT_FUNCTION'

[:=?|<>%+*;.,-]  return 'OPERATOR'

<<EOF>>  return 'EOF'

/lex

%left SHORT_FUNCTION

%start program
%%

program
  : tokens EOF
  ;

tokens
  : tokens token
  | token
  ;

token
  : token_place
    {yy.append($1)} 
  ;

token_place
  : SHORT_FUNCTION
  | HERE_DOC
  | IDENT
  | OPEN_CURLY
    {yy.curlyCount++}
  | CLOSE_CURLY
    {yy.curlyCount--}
  | OPEN_BRACE
    {yy.braceCount++}
  | CLOSE_BRACE
    {yy.braceCount--}
  | SPACE
  | D_STRING
  | S_STRING
  | OPERATOR
  ; 
