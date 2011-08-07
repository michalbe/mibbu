/*global document, setInterval, setTimeout, Image, clearTimeout*/

/**
* 
* mibbu - javascript canvas/DOM game framework
* by Michal Budzynski
* http://michalbe.blogspot.com
* http://twitter.com/michalbe
* http://mibbu.eu
* http://onGameStart.com
* 
*/

var mibbu = function(Cwidth, Cheight, _parent){
    var MB_usingCanvas = true, //use canvas or DOM?
        MB_usingCSSAnimations = false,
        document = window['document'], //document declaration for Closure Compiler
        MB_elements = [], //all drawable elements
        MB_parentElement = _parent ? document.getElementById(_parent) : document.body, //parent element the canvas will be appended to
        MB_mainCanvas, 
        MB_mainContext,
        MB_mainCanvasWidth = Cwidth || 400,
        MB_mainCanvasHeight = Cheight || 300,
        MB_addedLoops=[], //functions added to each loop frame
        MB_drawLoop, //main loop
        MB_preClear,
        MB_lastTime = new Date(), //time for FPS counter
        MB_fpsMeasure=false,
        MB_ftpsDiv,
        MB_collides=[], //array with references to objects with enabled collisions
        MB_fixedIndexColl = [], //workaround for collisions
        MB_Animate,
        MB_mainCanvasStyle,
        MB_prefixCSS,
        MB_prefixJS; 
    /**
    * Older browser's fixes
    */
    // Fallback for Array#indexOf, where the implementation does not support it
    // natively
    //  
    // Follows the algorithm described in ES-262 15.4.4.14
    //
    /*
    //MDC spec-like implementation
    Array.prototype.indexOf = Array.prototype.indexOf
    || function (value, start) {
        var key;
        var obj = Object(this);
        var len = obj.length >>> 0;

        start = +start || 0;
        if (!len || start >= len){
            return -1;
        }
        if (start < 0){
            start = Math.max(0, len - Math.abs(start));
        }

        for (key = start; key < len; ++key){
            if (key in obj && obj[key] === value){
                return key;
            }
        }
        return -1;
    }
    */
    // lastIndexOf implementation by Andrea Giammarchi
    // form Falsy Values conference
    // http://webreflection.blogspot.com
    Array.prototype.i = Array.prototype.indexOf ||
    function(value){
        for (var i = this.length; i-- && this[i]!== value;) {}
        return i;
    };

    //and custom remove() method
    var rm = function(value, array) {
        if (array.i(value)!==-1) {
            array.splice(array.i(value), 1);
            return true;
        } else {
            return false;
        }
    } ;

        
    /**
    * DEBUG FUNCTIONS
    **/
    
    var frameCount=0;
    var fps = 0;
    var MeasureFPS = function(){
        var newTime = +(new Date());
        var diffTime = ~~((newTime - MB_lastTime));
        
        if (diffTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            MB_lastTime = newTime;
        }
        var stringFps = 'FPS: ' + fps;
        if (MB_usingCanvas) {
            //MB_mainContext.fillStyle = "#fff";
            //MB_mainContext.font = "12px Arial";
            MB_mainContext.fillText(stringFps, 4, 15);
        } else {
            if (MB_ftpsDiv) {
                MB_ftpsDiv.innerHTML = stringFps;
            }
        }
        frameCount++;
    };
    
    /**
    * end of debug functions
    *
    * Start/Stop functions
    **/
    
    var calculateSpeed = function(speed, frames) {
        return (~~((1/(60/speed))*100)/100)*(frames+1);
    };
    //main drawing function
    var DrawAll = function(){
        
        MB_preClear();
        
        //draw all element
        var loopIndex = MB_elements.length;
        while (loopIndex--) {
            MB_elements[loopIndex].draw();
        }
        
        //run other functions
        loopIndex = MB_addedLoops.length;
        while (loopIndex--) {
            MB_addedLoops[loopIndex]();
        }
        
        if (MB_fpsMeasure) {
            MeasureFPS();
        }
                
    };
    //check if it is possible to use canvas
    var MB_detectCanvas = function() {
        if(!document.createElement('canvas').getContext) {
            MB_usingCanvas = false;
        }
    };
    
    var MB_InitCore = function() {
    //common part of both modes
        
        MB_preClear = MB_usingCanvas ? function(){MB_mainContext.clearRect(0, 0, MB_mainCanvasWidth, MB_mainCanvasHeight);} : function(){};
        
        if (MB_fpsMeasure) {
            MB_lastTime = new Date();
        }
        
        //use requestAnimationFrame() if possible
        //inspired by Paul Irish Blog
        //http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        //support only for moz & webkit now - Opera or IE are no 
        //interested in it so far.
        MB_Animate = (function(){
            return  window['webkitRequestAnimationFrame'] || 
                    window['mozRequestAnimationFrame']    || 
                    function(/* function */ callback, /* DOMElement */ element){
                        setTimeout(callback, 1000 / 60);
                    };
        })();
        
        //inline styling, not using setAttribute() 
        //because of IE7 & IE8 bugs
        MB_mainCanvasStyle = MB_mainCanvas.style;
        MB_mainCanvas.width = MB_mainCanvasWidth;
        MB_mainCanvas.height = MB_mainCanvasHeight;
        MB_mainCanvasStyle.width = MB_mainCanvasWidth+'px';
        MB_mainCanvasStyle.height =MB_mainCanvasHeight+'px';
        MB_mainCanvasStyle.position ='absolute';
        MB_mainCanvasStyle.overflow = 'hidden';
        
        MB_parentElement.appendChild(MB_mainCanvas);
        
    };    
    
    var MB_InitCanvas = function() {
        MB_mainCanvas = document.createElement('canvas');
        
        MB_mainContext = MB_mainCanvas.getContext('2d');
        MB_mainContext.i = MB_mainContext.drawImage;  
        
        //sorting all elements is like Z-Index for canvas
        MB_elements.sort(function(a,b){return a.zOrder - b.zOrder;});

    };    
    
    var MB_InitDOM = function() {
                    
        MB_mainCanvas = document.createElement('div');
        
        //MB_mainCanvas.style.overflow = 'hidden';
        
        if (MB_fpsMeasure) {
            
            MB_ftpsDiv = document.createElement('div');
            MB_mainCanvas.appendChild(MB_ftpsDiv);
            
        }
        
    };
    
    //initiation of main loop
    var running = true,
        MB_Start = function() {
        DrawAll();
        
        if(running)
        MB_drawLoop = MB_Animate(MB_Start, MB_mainCanvas);
    };
    
    var MB_Stop = function() {
        clearTimeout(MB_drawLoop);
        running=false;
    };
    
    /**
    * End of Start/Stop functions
    **/
    //collisions
    var MB_checkCollides = function() {
        var loopIndex =  MB_collides.length, 
            element,
            p1, p2,
            p1Top, p1Bottom, p1Left, p1Right,
            p2Top, p2Bottom, p2Left, p2Right;
        
        while(loopIndex--) {
            p1 = MB_collides[loopIndex];
            p1Top = p1.posY + p1.cZ.t;
            p1Bottom = p1.posY + p1.height - p1.cZ.b;
            p1Left = p1.posX + p1.cZ.l;
            p1Right = p1.posX + p1.width - p1.cZ.r;
            
            //UNCOMMENT THSE TWO BLOCKS FOR COLLISION BOXES.
            //IN CANVAS MODE ONLY!
            /*
            MB_mainContext.moveTo(p1Right, p1Top);
            
            MB_mainContext.lineTo(p1Right, p1Bottom);
            MB_mainContext.lineTo(p1Left, p1Bottom);
            MB_mainContext.lineTo(p1Left, p1Top);
            MB_mainContext.lineTo(p1Right, p1Top);
            */
        for(element in MB_collides[loopIndex].hits){
                p2 = MB_fixedIndexColl[element];
                p2Top = p2.posY + p2.cZ.t;
                p2Bottom = p2.posY + p2.height - p2.cZ.b;
                p2Left = p2.posX + p2.cZ.l;
                p2Right = p2.posX + p2.width - p2.cZ.r;
        /*
            MB_mainContext.moveTo(p2Right, p2Top);
            
            MB_mainContext.lineTo(p2Right, p2Bottom);
            MB_mainContext.lineTo(p2Left, p2Bottom);
            MB_mainContext.lineTo(p2Left, p2Top);
            MB_mainContext.lineTo(p2Right, p2Top);
            MB_mainContext.stroke();
            */
                if (!(
                    (p1Top     > p2Bottom) ||   
                    (p1Bottom  < p2Top)    ||   
                    (p1Left    > p2Right)  ||   
                    (p1Right   < p2Left)
                )){
                        //console.dir(MB_collides[loopIndex].hits)
                        MB_collides[loopIndex].hits[element]();
                } 
        }
        
        }
    };
        
    /**
    * SPRITES
    **/
    
    var MB_Sprite = function(_image, _width, _height, _frames, _animations) {
        
        var draw = MB_usingCanvas ? function(){
                //draw canvas
                try {
                    MB_mainContext.i(t.image, 
                                    t.iWidth * t.animation, 
                                    t.iHeight * t.f, 
                                    t.iWidth, 
                                    t.iHeight, 
                                    t.posX, 
                                    t.posY, 
                                    t.width, 
                                    t.height);
                    } catch(e) {
                        //if image is not ready yet try to display it on another frame
                        //delete this and build preLoader
                    }
            } : MB_usingCSSAnimations ? function(){ /*css animations*/ } : function(){
            //draw DOM
                t.si.top = t.height * t.f*-1+'px';
                t.si.left = t.width * t.animation*-1+'px';
            },
            t = {},
            //prepare class for CSS animation
            constructAnimationClass = function(){
                var animationClass = "@" + MB_prefixCSS + "keyframes s"+t.id+" {\n",
                    step = 100/(t.fs+1),
                    str = "% { " + MB_prefixCSS + "transform: translate(";
                for (var q = 0; q < t.fs+1; q++) {
                    animationClass += ~~((step*q)*100)/100+ str +t.animation*t.width*-1+'px,'+q*t.height*-1+'px); }\n';
                    animationClass += ~~((step*(q+1)-0.01)*100)/100+ str +t.animation*t.width*-1+'px,'+q*t.height*-1+'px); }\n';
                }
                
                return animationClass += '100'+ str +t.animation*t.width+'px, 0px); }\n}';
                
            };
            
        
        t.id = MB_elements.length;
                
        t.image = new Image();
        t.image.src = _image;
    
        t.speed = 1;
        t.width =  _width;
        t.iWidth = _width;
        t.height = _height;
        t.iHeight = _height;
        t.fs = _frames;
        t.animations = _animations;
        t.colllides = false;
        t.hits = {};
                
        t.f = 0;
        t.animation = 0;
        t.speed = 1;
        t.interval = 0;
    
        t.posX = 0;
        t.posY = 0;
    
        t.zOrder = 1;
        
        t.callback = null;
        t.callIters=0;
        t.callMaxIters=0;
        
        //collision zones
        t.cZ = {
            t: 0,
            l: 0,
            b:0,
            r: 0
        }
            
        if (!MB_usingCanvas) { 
            //document.createElement('img') not allowed in IE6
            t.div = document.createElement('div');
            t.s = t.div.style;
            
            t.s.overflow = 'hidden';
            t.s.width = _width+'px';
            t.s.height = _height+'px';
            t.s.position = 'absolute';
            t.s.zIndex = t.zOrder;
            
            t.si = t.image.style;
            
            t.si.position="absolute";
            
            if (MB_usingCSSAnimations) {
            //calculate keyframes for CSS animation
                
                
                //append keyframe class to the document
                t.animStyle = document.createElement('style');
                t.animStyle.innerHTML = constructAnimationClass();
                //document.getElementsByTagName('head')[0]
                document.body.appendChild(t.animStyle);
                
                //additional style attribute for the image,
                t.si[ MB_prefixJS + "Animation" ] = "s"+t.id+" "+calculateSpeed(t.speed, t.fs)+"s linear 0s infinite";

                
            }
            
            t.div.appendChild(t.image);            
            
            MB_mainCanvas.appendChild(t.div);
        }

        t.id = MB_elements.push(t)-1;
        MB_fixedIndexColl.push(t); //for collisions, temporary
                
        var setPosition = function(x, y, z) {
            //there is at least one argument,
            //set position and return 'this' for chaining
            if (x !== undefined) {
                t.posX = x || t.posX;
                t.posY = y || t.posY;
                t.zOrder = z || t.zOrder;
                
                if (MB_usingCanvas) {
                    if (z) {
                        MB_elements.sort(function(a, b){
                        
                            return b.zOrder - a.zOrder;
                        }                    
                        );
    
                    }
                } else {
                    t.s.left = x+'px';
                    t.s.top = y+'px';
                    t.s.zIndex = z || t.zOrder;
                }   
                return this;
            } else {
                //method called without parameters, return 
                //actual position
                return {x:t.posX, y:t.posY, z:t.zOrder}
            }
        },
        
        setCollide = function(e) {
            if (e && MB_collides.i(t) === -1) {
                MB_collides.push(t);
            } else if (!e && MB_collides.i(t) !== -1){
                rm(t, MB_collides);
            }
        },
        
        onHit = function (object, callback) {
            setCollide(true);
            t.hits[object.id()] = callback;
            if (MB_collides.i(t) === -1) {
                MB_collides.push(t);
            }
            return this;
        };        
        
        t.draw = function() {
            
            if (t.fs > 0) {
                if (t.interval == t.speed && t.speed !== 0) {
                    if (t.f == t.fs) {
                        t.f = 0;
                        
                        if (typeof t.callback === "function") {
                            t.callIters++;
                            if (t.callIters === t.callMaxIters) {
                                t.callback();
                                t.callIters = 0;    
                            }
                            
                        }
                        
                    }
                    else {
                        t.f++;
                    }
                    t.interval = 0;
                }
                if (t.speed !== 0) {
                    t.interval++;
                }
                
                draw();    
                
            }
        }; 
        var reSize = function(w, h){
            //there are some arguments
            //so change size of the sprite
            //and return 'this' for chaining
            if (w !== undefined) {
                if (!MB_usingCanvas){
                    
                    t.s.width = w+'px';
                    t.s.height = h+'px';
                    
                    t.si.width = w*(t.animations+1)+'px';
                    t.si.height = h*(t.fs+1)+'px';
                                        
                }
                t.width = w;
                t.height = h;
                if (MB_usingCSSAnimations) {
                    //any smarter way to refresh cssAnimation than clearing the name of it?
                    t.si[ MB_prefixJS+ "AnimationName" ] = '';
                    t.animStyle.innerHTML = constructAnimationClass();
                    t.si[ MB_prefixJS+ "AnimationName" ] = 's'+t.id;
    
                };
                
                return this;
                
            } else {
                
                return {width:t.width,height:t.height};
            }
        };
        
        return {
            'position':setPosition,
            'hit':onHit,
            'zone': function(top, right, bottom, left) {
                if (top !== undefined) {
                    t.cZ.l = left;
                    t.cZ.t = top;
                    t.cZ.r = right;
                    t.cZ.b = bottom;
                    
                    return this;
                } else {
                    return t.cZ;
                }
            },
            'noHits':function() {
                t.hits = {};
                return this;
            },
            'callback':function(fn, iteration) {
                t.callback = fn;
                t.callMaxIters = iteration;
                return this;
            },
            'change': function(image, width, height, frames, animation) {
                t.image.src = image;
                t.width = width;
                t.height = height;
                t.iWidth = width;
                t.iHeight = height;
                t.fs = frames;
                t.animation = animation;
                t.interval = 0;
                t.f = 0;
                t.callback = null;
                t.callIters=0;
                t.callMaxIters=0;
                
                if (!MB_usingCanvas) {
                    t.si.width = width*(t.animation+1)+'px';
                    t.si.height = height*(t.fs+1)+'px';
                    t.s.width = width+'px';
                    t.s.height = height+'px';
                    if (MB_usingCSSAnimations) {
                    //any smarter way to refresh cssAnimation than clearing it's name?
                        t.si[ MB_prefixJS+ "AnimationName" ] = '';
                        t.animStyle.innerHTML = constructAnimationClass(); 
                        t.si[ MB_prefixJS+ "AnimationName" ] = 's'+t.id;
                    }
                }
                
                t.cZ = {
                    t: 0,
                    l: 0,
                    b: 0,
                    r: 0
                }
                
                return this;
            },
            
            'size':reSize,
            'speed':function(e) { 
                if (e !== undefined) { 
                    t.speed=e; 
                    t.interval=0; 
                    if (MB_usingCSSAnimations){
                        t.si[ MB_prefixJS+ "AnimationDuration" ] = calculateSpeed(e, t.fs)+'s';
                    } 
                    
                    return this;
                } else {
                    return t.speed;
                }
            },
            'animation':function(e) { 
                if (e !== undefined) { 
                
                    t.animation=e;  
                    
                    if (MB_usingCSSAnimations) {
                    //any smarter way to refresh cssAnimation than clearing the name of it?
                        t.si[ MB_prefixJS+ "AnimationName" ] = '';
                        t.animStyle.innerHTML = constructAnimationClass(); 
                        t.si[ MB_prefixJS+ "AnimationName" ] = 's'+t.id;
                    }
                    
                    return this;
                } else {
                    return t.animation;
                }
            },
            'frame':function(e) { 
                if (e !== undefined) {
                    t.f=e; 
                    return this;
                } else {
                    return t.f;
                }
            },
            'id': function() { return t.id; }
        };
    };

    /** 
    * SPRITES END
    **/
    
    /**
    * START BACKGROUNDS
    **/
    var MB_Background = function(image, speed, direction, options) {
        
        var draw = MB_usingCanvas ? function(){
            //draw Canvas
                try {
					var posX = t.posX % t.image.width,
					posY = t.posY % t.image.height;
                    
					for (var x = posX-t.image.width; x < MB_mainCanvas.width; x += t.image.width) {
						for (var y = posY-t.image.height; y < MB_mainCanvas.height; y += t.image.height) {
							MB_mainContext.i(t.image, x, y);
						}
					}
                    
                } catch(e) {};

                if (t.dX < 0) {
                    if (t.posX < (t.image.width*-1)) {
                        t.posX = 0;
                    }
                } else if (t.dX > 0) {
                    if (t.posX > (t.image.width)) {
                        t.posX = 0;
                    }
                } 
				if (t.dY < 0) {
                    if (t.posY < (t.image.height*-1)) {
                        t.posY = 0;
                    }
                } else if (t.dY > 0) {
                    if (t.posY > (t.image.height)) {
                        t.posY = 0;
                    }
                }
            } : function(){
                //draw DOM
                // If the values are too close to 0 JS will print them as exponentials
                // which won't work on the DOM. There's probably a more efficient way to
                // do this.
                var posX = t.posX,
                    posY = t.posY;
                
                if (posX.toString().indexOf('e') != -1) posX = 0;
                if (posY.toString().indexOf('e') != -1) posY = 0;
                MB_mainCanvas.style.backgroundPosition = posX +"px "+posY+"px";    
            },
            t = this;
        
        var setImage = function(img) {
	        if (MB_usingCanvas) {
	            t.image = new Image();
	            t.image.src = img;
	        } else {
	            MB_mainCanvas.style.backgroundImage = 'url('+img+')';
	        }
        };
        setImage(image);
        
        t.speed = speed || 3;
		
		var radsPerDegree = Math.PI / 180,       
        direcionFromParameter = function(dir){
            t.dX = 0;
            t.dY = 0;
            if (typeof dir === "string") {
                switch (dir) {
                    case 'N':
                        t.dX = 0;
                        t.dY = -1;
                        break;    
                    case 'W':
                        t.dX = -1;
                        t.dY = 0;
                        break;
                    case 'S':
                        t.dX = 0;
                        t.dY = 1;
                        break;
                    case 'E':
                        t.dX = 1;
                        t.dY = 0;
                        break;                
                    default:
                        break;
                }
            }
            else if (typeof dir === "number") {
                dir =  radsPerDegree * dir; // convert from degrees to radians
                t.dX = Math.cos(dir);
                t.dY = Math.sin(dir);
            }
        }
        
        direcionFromParameter(direction);
        
        t.zOrder = options['z'] || 0;
        t.posX = options['x'] || 0;
        t.posY = options['y'] || 0;
        
        t.id = MB_elements.push(t);        
        t.moving = 0;

        var setPosition = function(x, y) {
            if (x !== undefined) {
                t.posX = x || t.posX;
                t.posY = y || t.posY; 
                
                return this;
            } else {
                return {x:t.posX, y:t.posY}
            }
        };
        
        t.draw = function() {
                t.posX += t.speed*t.dX*t.moving;
                t.posY += t.speed*t.dY*t.moving;
                
                draw();
        }
        
        return {
            'on': function() { t.moving = 1; return this;},
            'off': function() { t.moving = 0; return this;},
            'dir': function(direction) { direcionFromParameter(direction); return this;},
            'speed':function(e) { if (e !== undefined) { t.speed=e; return this;} else return t.speed;},
            'img': function(img) { if (img !== undefined) { setImage(img); return this;} else return image;},
            'position':setPosition
        }
        
    }

    
    /**
    * Constructor functions
    */
    MB_detectCanvas();
    
    
    return {
        //config
        'fps': function() {MB_fpsMeasure=true; return this;},
        'init': function() { MB_usingCanvas ? MB_InitCanvas() : MB_InitDOM(); MB_InitCore(); return this;},     
        'on': function() { 
            running=true; 
            MB_Start();
            if (MB_usingCSSAnimations){
            //this solution is really stupid and temporary ( I hope )
            //unfortunatelly any other didn't really work
                var i = MB_elements.length;
                for (;i--;){
                    if (MB_elements[i].image) 
                        MB_elements[i].image.style[ MB_prefixJS+ "AnimationDuration" ] = calculateSpeed(MB_elements[i].speed, MB_elements[i].fs)+'s';
                }
            }
            return this;
        },
        'off': function(){ 
            MB_Stop();
            if (MB_usingCSSAnimations){
            //this solution is really stupid and temporary ( I hope )
            //unfortunatelly any other didn't really work            
                var i = MB_elements.length;
                for (;i--;){
                    if (MB_elements[i].image) 
                        MB_elements[i].image.style[ MB_prefixJS+ "AnimationDuration" ] = 0;
                }
            }
            return this;
        },
        'canvas': function(){ return MB_mainCanvas; },
        'ctx': function() {return MB_mainContext; },
        'canvasOff': function() {
            
            MB_usingCanvas=false;
            
            
            if (typeof MB_parentElement.style.WebkitAnimation !== "undefined") {
               
                //we have webkit CSS3 animation support 
                MB_prefixCSS = "-webkit-";
                MB_prefixJS = "Webkit"; 
                MB_usingCSSAnimations = true;
                  
            } else if (typeof MB_parentElement.style['MozAnimation'] !== "undefined") {
            //stupid Closure Compiler don't understand style.MozAnimation so I had to use brackets here
            
                //and in Firefox
                MB_prefixCSS = "-moz-";
                MB_prefixJS = "Moz";
                MB_usingCSSAnimations = true;
            }
            return this;
        },
        
        'cssAnimationOff': function() {
            MB_usingCSSAnimations=false; 
            return this;
        },
        
        'hitsOn': function() {
            if (MB_addedLoops.i(MB_checkCollides) === -1) 
                MB_addedLoops.push(MB_checkCollides); 
            return this;
        },
        
        'hitsOff': function() { 
            rm(MB_checkCollides, MB_addedLoops); 
            return this;
        },
        
        //elements
        'spr':MB_Sprite,
        'bg': MB_Background,
        
        //loops
        'hook': function(e){
            MB_addedLoops.push(e); 
            return this;
        },
        
        'unhook': function(e){
            rm(e, MB_addedLoops);
            return this;
        }
        
    };
};
//declaration of mibbu object for Closure Compiler
window['mibbu'] = mibbu;
