## Object Oriented

### Class Definition

>     class Foo {
>       function method () {
>       }
>     }

### Inheritance

>     class Vehicle {
>       function drive () {
>         alert('drive');
>       }
>     }
>
>     class Car extends Vehicle {
>     }

### Getters and Setters

>     class Duck {
>       property color; // adds getColor() and setColor()
>     }

### Mixins (Ruby's multiple inheritance solution)

>     module Flyable {
>       function fly () {
>         alert('Flying!');
>       }
>     }
>
>     class Duck {
>       include Flyable;
>     }

### AOP (Aspect Oriented Programming)

>     var me = new Human();
>     me.addListener('walk', function () { alert('walking') });

### Static Methods

>     class Human {
>       static function getCount () {
>         return this.count;
>       }
>       static function create () {
>         if (this.count) {
>           this.count++;
>         } else {
>           this.count = 1;
>         }
>         return new this();
>       }
>     }

## Syntactic Sugar

### Currying

>     var nonScoped = [ ... lots of data .. ];
>     var submitBtn = new Button();
>     var ele = document.getElementById('submitBtn'); 
>     ele.onClick = curry (evt) with (submitBtn) {
>       submitBtn.click();
>     };

### Foreach

>     foreach (var item in array) alert(item);
>     foreach (var item:i in array) alert(i + ' is ' + item);
>     curry (arg1, arg2) with (scopeVar1, scopeVar2) { };

##Other Features

### Templating in HAML/SASS (useful for ajax applications)

>     //--- in uiBuilder.js2.haml
>     UIBuilder
>       button(name)
>         %div.button= "#name#"
>
>     //--- in uiBuilder.js2
>     class UIBuilder {
>       function getButton (name) {
>         this.htmlCache.button(name);
>       }
>     }
>
>     //--- in page.html
>     var ui  = new UIBuilder();
>     var ele = document.getElementById('buttonContainer');
>     ele.innerHTML = ui.button('my button');

### Selenium Testing Integration

... Coming soon ...

This is a little bit harder to explain, and is only for Ruby Selenium RC developers. The idea is that complex javascript applications usually reference most important DOM elements in javascript for things such as altering html or adding event handlers. What selenium integration in js2 means is that one can use annotations in his/her code to "mark" DOM elements instead of using xpaths.

One of the pain points in Selenium testing is that the xpaths are always changing with each iteration of the view layer. In a complex javascript application, one has to maintain the references to DOM objects in javascript anyway, so this would be an easier way to maintain the Selenium references to the DOM.

While this is available, its not quite ready for public consumption.
