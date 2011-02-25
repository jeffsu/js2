[JS2](http://github.com/jeffsu/js2) - Javascript Object Oriented Sugar
======================================================================

JS2 is just javascript with added functionality.  You can think of it as just a superset of javascript.

    class Person {
      var first = "John";
      var last  = "Doe";

      function name() {
        return "#{this.first} #{this.last}";
      }
    }

    class Employee extends Person {
      function name() {
        return "Employee:" + this.super(); 
      }
    }

    var employee = new Employee();

Object Oriented Programming
===========================

Methods, Members and Properties
-------------------------------
  class Rectangle {
    var height = 10;
    var width  = 5;

    function setDimensions(h, w) {
      this.height = h;
      this.width  = w;
    }

    function area() {
      return this.height * this.width;
    }
  }

Inheritence
-----------
  class Square extends Rectangle {
    function setDimensions(side) {
      this.height = this.width = side;
    }
  }

Mixins
------
  module TalkableShape {
    function sayArea() {
      alert(this.aread());
    }
  }

  class Square extends Rectangle {
    include TalkableShape;
    function setDimensions(side) {
      this.height = this.width = side;
    }
  }

Syntactic Sugar
===============
Interpolated Strings
--------------------
  var name    = "John Doe";
  var message = "Welcome #{name}";

Foreach
-------
    var things = [ 'hello', 'world' ];
    foreach (var thing in things) {
      alert(thing);
    }

Functions
---------
    var say1 => (name) { alert(name); }
    var say2 => { alert($1); }
    node.click(->{ alert('clicked'); })

Curry
-----
    var message = 'Welcome';

    var say1 = curry (name) with (message) {
      alert(message + ' ' + name); 
    }
    say1("John Doe");

    var say2 = curry with (message) {
      alert(message); 
    }
    say2();

    var say3 = curry (name) {
      alert(name);
    }
    say3("Welcome John Doe");
