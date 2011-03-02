JS2 = root['JS2'] = function (arg) {
  if (typeof arg == 'string') {
    return JS2.Parser.parse(arg).toString();
  } else if (arg instanceof Array) {
    return new JS2.Array(arg);
  } else {
    return new JS2.Array();
  } 
};

js2 = root['js2'] = JS2;
JS2.ROOT = root;
