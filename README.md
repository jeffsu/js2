[JS2](http://github.com/jeffsu/js2) - Friendly Cross Browser Object Oriented Javascript
=======================================================================================

JS2 is a way to write classes in a more familiar way for programmers who are used to syntax in languages such as: Java, Ruby, C++, etc...
The main motivation is to provide a clean and a less verbose syntax for creating classes, inheritance and modules in Javascript.  JS2 plays
nicely with most of the popular frameworks including: jQuery and prototype.  It also provides some syntactic sugar on the repetative aspects
of Javascript.

Sample Syntax:
    class Rectangle {
      property height;
      property width;
    
      function area () {
        return this.height * this.width;
      }
    }
    
    class Square extends Rectangle {
      function area () {
        return this.width * this.width;
      }
    }
    
    var s = new Square();

* [Installation](http://github.com/jeffsu/js2/blob/master/wiki/installation.md)
* [Language Features and Examples](http://github.com/jeffsu/js2/blob/master/wiki/features.md)
* [Compiler Features](http://github.com/jeffsu/js2/blob/master/wiki/compiler.md)
* [Source](http://github.com/jeffsu/js2)

Things You need to run JS2
--------------------------
* Ruby - language used to parse js2 and generate javascript
* Ruby Gems - ruby package manager
  * js2
  * RubyInline
  * haml (optional)

Quick Start Guide
-----------------
Create a js2 file (foo.js2):
    class Person {
      function speak() {
        alert("Hello! I'm a person!");
      }

      function walk() {
        alert("Walking!");
      }
    }

    class Student extends Person {
      function speak() {
        alert("Hello, I'm a student!");
      }
    }

    var person  = new Person();
    var student = new Student();

    person.speak();
    student.speak();
    person.walk();
    student.walk();

Run js2 in the same directory
    js2 compile

You should now see these files in that directory:
* foo.js2
* foo.js
* js2bootstrap.js

Include these js2bootstrap.js and foo.js (make sure js2bootstrap.js is included first) in your html page.
