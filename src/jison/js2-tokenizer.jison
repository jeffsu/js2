
%lex
esc "\\"

%%

\s+            return 'SPACE'
[a-zA-Z0-9]+   return 'IDENT'

'"'("\\"["bfnrt/{esc}]|"\\u"[a-fA-F0-9]{4}|[^\0-\x08\x0a-\x1f"{esc}])*'"' { return 'D_STRING';}
"'"("\\"["bfnrt/{esc}]|"\\u"[a-fA-F0-9]{4}|[^\0-\x08\x0a-\x1f"{esc}])*"'" { return 'S_STRING';}

"/"("\\"["bfnrt/{esc}]|"\\u"[a-fA-F0-9]{4}|[^\0-\x08\x0a-\x1f"{esc}])*"/"[gms]* { return 'REGEX';}

[:=?|<>%+*;.-]  return 'OPERATOR'

'{'      return 'OPEN_CURLY'
'}'      return 'CLOSE_CURLY'
'('      return 'OPEN_BRACE'
')'      return 'CLOSE_BRACE'

<<EOF>>  return 'EOF'

/lex

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
  : IDENT
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
  | REGEX
  | OPERATOR
  ; 
