[JS2](http://github.com/jeffsu/js2) - Friendly Cross Browser Object Oriented Javascript
=======================================================================================

Classes and Methods
--------------------
To create a class, use the "class" keyword followed by matching curly braces.  If the class
has an "initialize" method defined, it will run that right after an instance is created.
Getters and setters can be created by using the "property" keyword.


Here is an example of a class:

    class Person {
      // creates getName() and setName(name) methods
      property name;

      // creates getAge() and setAge(age) methods
      property age;

      // called after new Person(age) is called
      function initialize(age) {
        this.age = age;
      }
    }

    var p = new Person(14);
    p.setName("Jeff");
    var age = p.getAge(); // 14

Modules/Mixins/Multiple Inheritance
-----------------------------------
JS2 uses a Ruby-inspired methodology for multiple inheritance.  Here is an example
of how it works:

    module Flyable {
      function fly() {
        alert("I believe I can fly!");
      }
    }

    class Duck {
      include Flyable;
    }

    var duck = new Duck();
    duck.fly();

Syntactic Sugar
---------------

*Foreach*: iterating through an array without having to manually create temp variables:

    var items = [ 'foo', 'bar', 'baz' ]
    foreach (var item in items) {
      alert(item);
    }

    // with index
    foreach (var item:i in items) {
      alert(i + ':' + item);
    }

*Currying*: tightly scoped anonymous functions to prevent memory leaks
   
    var bigData = getBigData();
    var inScope = getSmallData();

    element.onClick = curry (evt) with (inScope, this) { 
      alert("curry" + inScope);
      // variable "self" is available as the "this" in the outer scope
    }


