[JS2](http://github.com/jeffsu/js2) - Javascript Syntactic Sugar
======================================================================

JS2 is a superset javascript.  It attempts to add common functionality to Javascript that was 
inspired by other languages (Java, Ruby, Perl).  Since JS2 is a superset of Javascript, Javascript 
remains fully compatible with JS2.  JS2 is available in 2 different flavors:
  * ruby gem (ruby & jruby)
  * nodejs

    class Car {
      function maxSpeed() {
        return 60;
      }
    }

    class SportsCar extends Car {
      function speed() {
        return this.$super() + 20;
      }
    }

    var ferrari = new SportsCar();

Quick Setup
===========

Nodejs (using Google Chrome's V8 engine)
----------------------------------------
    install node js  
    install npm
    npm install js2
   
Ruby
----
    gem install js2

    # for ruby mri
    gem install rubyracer

    # for jruby 
    gem install rubyrhino


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
    var message = "Welcome #{name}";
    var message = %{Welcome #{name}};

Heredocs
--------
    var string = <<END
    Random text with interpolated variable #{name}
    END

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

