[JS2](http://github.com/jeffsu/js2) - Javascript Syntactic Sugar
======================================================================

JS2 is syntactic sugar on top of Javascript.  It adds common programming functionality to Javascript that was 
inspired by other languages (Java, Ruby, Perl).  Since JS2 is a superset of Javascript, Javascript 
remains fully compatible with JS2.  JS2 is available in 4 different flavors and is written in Javascript:

  * ruby
  * nodejs
  * ringojs
  * browser

Example:

    class Vehicle {
      function move() {
        return "I move";
      }
    }

    class Car extends Vehicle {
      function move() {
        return "I roll";
      }
    }

    class SportsCar extends Car {
      function move() {
        return this.$super + ' quickly';
      }
    }

    var ferrari = new SportsCar();
    console.log(ferrari.move());

Installation
============
For more detailed instructions, go [here](|https://github.com/jeffsu/js2/wiki/Installation).

For Ruby (using Google Chrome's V8 engine)
------------------------------------------
    # for ruby mri
    gem install rubyracer
    gem install js2


For NodeJS
----------
This is the fastest implementation and is the preferred way to run compilations
First, install nodejs and npm (node's package manager)  

    npm install js2

For RingoJS
-----------
First, install ringo.

    ringo-admin install jeffsu/js2-ringo

Currently, there are no executables shipped with the ringo package, so follow the instructions here. 
  

Object Oriented Programming Sugar
=================================

Methods and Members
-------------------
    class Car {
      var nwheels    = 4;
      var ncylinders = 6;
    
      function go() {
        console.log('Vroom');
      }
    }

Inheritence
-----------
    class SportsCar extends Car {
      function go() {
        this.$super(); 
        console.log('Vroom Vroom');
      }
    }

Mixins
------
    module {
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
    var message = %{Welcome #{name}};

Heredocs
--------
    var string = <<END
      Random text with indentation
      interpolated variable #{name}
    END

Foreach
-------
    var things = [ 'hello', 'world' ];
    foreach (var thing in things) {
      alert(thing);
    }

Shorthand Functions
-------------------
    var say1 = #(arg){ alert(arg); }
    var say2 = #{ alert($1); }
    node.click(#{ alert('clicked'); })

Enumerable Extensions
---------------------
    var array = js2([ 'hello', 'world' ]);
    array.each(#{ alert($1) });
    array.reject(/hello/).each(#{ alert($1) });
    .. etc ..

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

Where do you go from here?
=====================

Well, you can visit the [wiki](https://github.com/jeffsu/js2/wiki/Getting-Started) on getting started.
