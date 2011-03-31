var js2 = require('js2').js2;
var JS2 = js2;
var foo = 'footext', bar = 'bartext';
var finish = 
"hello world\n"+(foo)+" bar\n"+"yo there\n"+"  \n"+(bar)+"this is the end\n";
js2.test(function(assert){
  assert.eq("hello world\\nfootext bar\\n"+"yo there\\n  bartextthis is the end", finish);
});

