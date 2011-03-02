// temporarily set root 
// to JS2 global var for this scope
JS2 = (function () { return function (arg) {
  if (typeof arg == 'string') {
    return JS2.Parser.parse(arg).toString();
  } else if (arg instanceof Array) {
    return new JS2.Array(arg);
  } else {
    return new JS2.Array();
  }
}})();
js2 = JS2;
