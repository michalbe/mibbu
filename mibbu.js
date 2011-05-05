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
        MB_Animate; 
    /**
     * Older browser's fixes
     */
    //IE fix Array.indexOf
    //from 
    //http://michalbe.blogspot.com/2010/04/removing-item-with-given-value-from.html
    if(!Array.indexOf){
        Array.prototype.indexOf = function(obj){
            var i;
            for(i=0; i<this.length; i++){
                if(this[i]===obj){
                    return i;
                }
            }
            return -1;
        };
    }
    
    //and custom remove() method
    var rm = function(value, array) {
        if (array.indexOf(value)!==-1) {
           array.splice(array.indexOf(value), 1);
           return true;
       } else {
          return false;
       };
    } 

        
    /**
    * DEBUG FUNCTIONS
    **/
    
    var frameCount=0;
    var fps = 0;
    var MeasureFPS = function(){
        var newTime = new Date();
        var diffTime = ~~((newTime.getTime() - MB_lastTime.getTime()));
        
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
        MB_mainCanvasStyle.position ='absolute'
        MB_mainCanvasStyle.overflow = 'hidden';
        
        MB_parentElement.appendChild(MB_mainCanvas);
        
    };    
    
    var MB_InitCanvas = function() {
        MB_mainCanvas = document.createElement('canvas');
        
        MB_InitCore();
        MB_mainContext = MB_mainCanvas.getContext('2d');
        MB_mainContext.i = MB_mainContext.drawImage;  
        
        //sorting all elements is like Z-Index for canvas
        MB_elements.sort(function(a,b){return a.zOrder - b.zOrder;});
  
    };    
    
    var MB_InitDOM = function() {
        
        MB_mainCanvas = document.createElement('div');
        
        //MB_mainCanvas.style.overflow = 'hidden';
        MB_InitCore();
        
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
                    (p1Top        > p2Bottom) ||   
                    (p1Bottom    < p2Top)     ||   
                    (p1Left        > p2Right)     ||   
                    (p1Right    < p2Left)
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
            } : function(){
            //draw DOM
                t.image.style.top = t.height * t.f*-1+'px';
                t.image.style.left = t.width * t.animation*-1+'px';
            },
            t = {};
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
            
            t.image.style.position="absolute";
            t.div.appendChild(t.image);            
            
            
            
            MB_mainCanvas.appendChild(t.div);
        }

        t.id = MB_elements.push(t)-1;
        MB_fixedIndexColl.push(t); //for collisions, temporary
                
        var setPosition = function(x, y, z) {
            t.posX = x || t.posX;
            t.posY = y || t.posY;
            t.zOrder = z || t.zOrder;
            
            if (MB_usingCanvas) {
                if (z) {
                    MB_elements.sort(function(a, b){
                        //return a.zOrder - b.zOrder;}
                        return b.zOrder - a.zOrder;
                    } //reversed becaouse of 'while' loop in DrawAll();                    
                    );

                }
            } else {
                t.s.left = x+'px';
                t.s.top = y+'px';
                t.s.zIndex = z || t.zOrder;
            }   
            return {x:t.posX, y:t.posY, z:t.zOrder}
        },
        
        setCollide = function(e) {
            if (e && MB_collides.indexOf(t) === -1) {
                MB_collides.push(t);
            } else if (!e && MB_collides.indexOf(t) !== -1){
                rm(t, MB_collides);
            }
        },
        
        onHit = function (object, callback) {
            setCollide(true);
            t.hits[object.id()] = callback;
            if (MB_collides.indexOf(t) === -1) {
                   MB_collides.push(t);
               }
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
            if (w !== undefined) {
                if (!MB_usingCanvas){
                    
                    t.s.width = w+'px';
                    t.s.height = h+'px';
                    
                    t.image.style.width = w*(t.animations+1)+'px';
                    t.image.style.height = h*(t.fs+1)+'px';
                    
                }
                t.width = w;
                t.height = h;
            }
            return {width:t.width,height:t.height};
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
                }
                return t.cZ;
            },
            'noHits':function() {
                t.hits = {};
            },
            'callback':function(fn, iteration) {
                t.callback = fn;
                t.callMaxIters = iteration;
            },
            'change': function(image, width, height, frames, animations) {
                t.image.src = image;
                t.width = width;
                t.height = height;
                t.iWidth = width;
                t.iHeight = height;
                t.fs = frames;
                t.animations = animations;
                t.interval = 0;
                t.f = 0;
                if (!MB_usingCanvas) {
                    t.image.style.width = width*(t.animations+1)+'px';
                    t.image.style.height = height*(t.fs+1)+'px';
                    t.s.width = width+'px';
                    t.s.height = height+'px';
                }
                
                t.cZ = {
                    t: 0,
                    l: 0,
                    b: 0,
                    r: 0
                }
            },
            
            'size':reSize,
            'speed':function(e) { if (e !== undefined) { t.speed=e; t.interval=0;} return t.speed;},
            'animation':function(e) { if (e !== undefined) t.animation=e; return t.animation;},
            'frame':function(e) { if (e !== undefined) t.f=e; return t.f;},
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
                    MB_mainContext.i(t.image, t.posX, t.posY);
                    MB_mainContext.i(t.image, t.posX + t.image.width * t.dX, t.posY + t.image.height * t.dY);
                    MB_mainContext.i(t.image, t.posX - t.image.width * t.dX, t.posY - t.image.height * t.dY);
                } catch(e) {};

                if (t.dX === -1) {
                    if (t.posX < (t.image.width*-1)) {
                        t.posX = 0;
                    }
                } else if (t.dX === 1) {
                    if (t.posX > (t.image.width)) {
                        t.posX = 0;
                    }
                } else if (t.dY === -1) {
                    if (t.posY < (t.image.height*-1)) {
                        t.posY = 0;
                    }
                } else if (t.dY === 1) {
                    if (t.posY > (t.image.height)) {
                        t.posY = 0;
                    }
                }
            } : function(){
                //draw DOM
                MB_mainCanvas.style.backgroundPosition = t.posX +"px "+t.posY+"px";    
            },
            t = this;
        
        if (MB_usingCanvas) {
            t.image = new Image();
            t.image.src = image;
        } else {
            MB_mainCanvas.style.backgroundImage = 'url('+image+')';
        }
        
        t.speed = speed || 3;
        
        var direcionFromString = function(dirString){
            switch (dirString) {
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
                    t.dX = 0;
                    t.dY = 0;
                    break;
            }
        }
        
        direcionFromString(direction);
        
        t.zOrder = options['z'] || 0;
        t.posX = options['x'] || 0;
        t.posY = options['y'] || 0;
        
        t.id = MB_elements.push(t);
        
        t.moving = 0;

        var setPosition = function(x, y) {
            t.posX = x || t.posX;
            t.posY = y || t.posY; 

            return {x:t.posX, y:t.posY}
        };
        
        t.draw = function() {
                t.posX += t.speed*t.dX*t.moving;
                t.posY += t.speed*t.dY*t.moving;
                
                draw();
        }
        
        return {
            'on': function() { t.moving = 1; },
            'off': function() { t.moving = 0; },
            'dir': function(direction) { t.posX = t.posY = 0; direcionFromString(direction); },
            'speed':function(e) { if (e !== undefined) { t.speed=e; } return t.speed;},
            'position':setPosition
        }
        
    }

    
    /**
     * Constructor functions
     */
    MB_detectCanvas();
    
    
    return {
        //config
        'fps': function() {MB_fpsMeasure=true;},
        'init': function() { MB_usingCanvas ? MB_InitCanvas() : MB_InitDOM(); },     
        'on': function() { running=true; MB_Start()},
        'off': MB_Stop,
        'canvas': function(){ return MB_mainCanvas; },
        'ctx': function() {return MB_mainContext; },
        'canvasOff': function() {MB_usingCanvas=false;},
        'hitsOn': function() { if(MB_addedLoops.indexOf(MB_checkCollides) === -1) MB_addedLoops.push(MB_checkCollides); },
        'hitsOff': function() { rm(MB_checkCollides, MB_addedLoops); },
        
        //elements
        'spr':MB_Sprite,
        'bg': MB_Background,
        
        //loops
        'hook': function(e){MB_addedLoops.push(e);},
        'unhook': function(e){rm(e, MB_addedLoops);}
        
    };
};
//declaration of mibbu object for Closure Compiler
window['mibbu'] = mibbu;