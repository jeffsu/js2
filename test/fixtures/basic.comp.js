
/*
 * Comments
 * This is a comment
 */
JS2.OO.createClass("Test.Foo");  (function (K) {var self=K; var _super=JS2.OO['super']; 
  K.oo('accessor', [ 'testAcc' ]);
  K.oo('property', [ 'testProp' ]);

  /*
   * hello
   */

  K.oo('method', "testFunct", function () {

  });

  K.oo('method', "testForeach", function () {
    for (var i=0,ele,i__arr=elements,i__len=i__arr.length; (ele=i__arr[i]) || i<i__len; i++) {
      for (var i=0,yo,i__arr=yos,i__len=i__arr.length; (yo=i__arr[i]) || i<i__len; i++) {

      }
      
    }
  });

})(Test.Foo);
Test.Foo.oo('setHTMLCache', {"main": function(){return "<div class='hello'>world</div>"}});  (function (K) { K.oo('method',  'getTemplate', function () { return [{"class":"Bar"},{"class":"Foo"}] }) })(Test.Foo);
JS2.OO.createClass("Bar");  (function (K) {var self=K; var _super=JS2.OO['super']; 

})(Bar);
JS2.OO.createClass("Foo");  (function (K) {var self=K; var _super=JS2.OO['super']; 

})(Foo);
