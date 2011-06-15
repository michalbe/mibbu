Mibbu
========

#### First Javascript Game MicroFramework ####

Mibbu gives you everything you need for fast prototyping your Javascript game in less than 2.5KB of gzipped code. Games created with Mibbu can be displayed using Canvas or DOM mode (you can change it with one single function, or use feature detection to use DOM where it is no canvas, like in IE family). Mibbu supports also CSS animations in Webkit ([blogpost](http://michalbe.blogspot.com/2011/05/css3-animations-in-mibbu.html)) and in Firefox BETA (5.0).


[Documentation](http://mibbu.eu)


### Features of Mibbu ###
* Rendering game using both - Canvas or DOM
* Animation of the sprites (using Canvas, DOM or CSS Animation in Webkit & Firefox 5+)
* Collisions detection with collision zones
* Simple background manager
* Callbacks after given number of frames
* Method's chaining
* Check [example](https://github.com/michalbe/mibbu/tree/master/example) for more

### Change Log ###

2011 06 12 - **0.3/arkansas** (5.89 KB, gzip 2.37 KB)

* every method now return itself when you call it with parameters (like .speed(3)) so it's possile to connect multiple methods into one chain (like background.speed(4).direction(-20)). Methods called without arguments returns value of given metod (like background.speed() return the speed of the background) 

2011 06 12 - **0.2.4/annefrank** (5.57 KB, gzip 2.30 KB) by [MartinDoms](https://github.com/MartinDoms)

* background direction could be now specified in both, strings ("N", "S", "E", "W") and numbers (radians)
* it is possible to change background direction 'on the fly' without resetting the background position

2011 06 11 - **0.2.3/kamehameha**  (5.42 KB, gzip 2.12 KB)

* FPS module optimization

2011 06 05 - **v0.2.2/blackwater** (5.43 KB, gzip 2.12 KB)

* Animation structure changed according to Marek Stepien's research on CSS Animations in Firefox [[blogpost](http://michalbe.blogspot.com/2011/06/css-animation-in-firefox.html#update)]

2011 06 04 - **v0.2.1/birthdayAfterparty** (5.46 KB, gzip 2.12 KB)

* CSS3 Animations support in Firefox (tested in 5.0/BETA) 
* .indexOf() name changed for minimization and compatibility with other solutions [[blogpost](http://michalbe.blogspot.com/2011/06/css-animation-in-firefox.html)]

2011 05 23 - **v0.2/suiko** (5.54 KB, gzip 2.13 KB) [[blogpost](http://michalbe.blogspot.com/2011/05/css3-animations-in-mibbu.html)]

* CSS3 Animations support in Webkit browsers (tested on Chrome 11 & Safari 5.03) 
* .cssAnimationOff() function added (works the same as .canvasOff() but for CSS Animations)
* some major & minor bug fixes

2011 05 19 - **v0.1.2/guanabhadra** (4.36 KB, gzip: 1.81 KB)

* Changes in Array#indexOf - we don't need full spec implementation here. This one is faster and smaller.

2011 05 09 - **v0.1.1/atilla** (4.45 KB, gzip: 1.83 KB)

* Array#indexOf fix by [killdream](https://github.com/killdream)
* Proper declaration of MB_mainCanvasStyle variable
 
2011 05 05 - **v0.1/odoacer** (4.35 KB, gzip: 1.81 KB)

* First release

----

### License ###

####The MIT License####

Copyright (c) 2011 [Michal Budzynski](https://profiles.google.com/michal.budzynski.js/about). All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
