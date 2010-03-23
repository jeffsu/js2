* [Features](http://code.google.com/p/js2lang/wiki/Features) (simple documentation)
* [Installation](http://code.google.com/p/js2lang/wiki/Installation)
* [Source Code](http://github.com/jeffsu/js2)

# OO Javascript

For every Javascript developer that has ever wanted to create a library for his/her project, there comes a time when an Object Oriented approach is necessary (or extremely desired). Fortunately, there are a plethora of options to choose from:

>     using prototype (not the framework) and hashes:
>       var MyClass = function () {
>         this.member1 = "member";
>       };
>       MyClass.prototype = {
>         method1: function () { alert('method1 called'); }
>       }
>     embedding functions right in the instantiator:
>       function MyClass () {
>         this.member1 = "member1";
>         function method1 () {
>            alert("method1 called");
>         }
>       }
>     using jQuery (or any of the js OO frameworks) by passing in hashes:
>       var MyClass = Class.create({
>           member1: "member1",
>           method1: function(){ alert("method1 called") },
>       });
Unfortunately, these solutions are dissimilar to Java, Ruby, and C-based languages.

# JS2 Solution

JS2 language that is a superset of Javascript and the problem it tries to solve is bringing "natural" OO syntax to Javascript by adding a compilation layer.

So in myClass.js2 one could write:

    class MyClass {
      var member1 = "member1";

      function method1 () {
         alert("method1 called");
      }
    }

And after compilation myClass.js (notice the .js extension vs the .js2) would be:

    var MyClass = function () { };
    MyClass.prototype = {
      member1: "member1",
      method1: function () { alert("method1 called"); }
    }

One of the nice things about this solution is that it allows us to "calculate" things like mixins and inheritance at compile time rather than runtime. This compilation layer opens the doors for features such as:

* Inheritance
* Mixins (Ruby's multiple inheritance solution)
* getters and setters
* IoC (Dependency Injection)
* AOP (Aspect Oriented Programming)
* foreach
* currying
* More Features

# Inspiration

HAML, SASS, Ruby, Perl, jQuery, Prototype.js
