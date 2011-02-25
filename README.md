[JS2](http://github.com/jeffsu/js2) - Javascript Object Oriented Sugar
======================================================================

Sample Syntax:
    class Person {
      var first = "John";
      var last  = "Doe";

      function name() {
        return this.first + ' ' + this.last;
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
Methods
-------
Members
-------
Inheritence
-----------
Mixins
------

Syntactic Sugar
===============
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
