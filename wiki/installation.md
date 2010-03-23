## Basic Installation and Usage

>     gem install js2
>     js2 --help
>
>     js2 --out-dir=/dir/to/write/js /dir/with/js2

## For Rails

This really depends on where you're writing your js2 files. Its recommended that you put it in app/js2, but its really up to you.

From the rails root directory

>     js2 --out-dir=./public/javascripts ./app/js2

To daemonize it and have it routinely check for changes (every 0.5 secs):

>     js2 -d --out-dir=./public/javascripts ./app/js2

## Quick Tutorial

In a new directory, do this:

> mkdir js2
> mkdir js

Now create some js2 classes: vi js2/base.js2

>     class My.Base {
>       function sayHi () {
>         alert("hi");
>       }
>     }

vi js2/concrete.js2

>     class My.Concrete {
>       function sayHello () {
>         alert("hello");
>       }
>     }

compile:

>     js2 --out-dir=./js ./js2

Be sure to include js/classes.js, js/base.js, and concrete.js (order matters as far as classes is concerned) in your browser.

Now you can run this in javascript:

>     var obj = new My.Concrete();
>     obj.sayHi();
>     obj.sayHello();
