// ColoredPoints.js
// Vertex shader program
var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform float u_Size;
void main() {
    gl_Position = a_Position;    
    //gl_PointSize = 20.0;
    gl_PointSize = u_Size;
}`

// Fragment shader program
var FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main() {
    gl_FragColor = u_FragColor;
}`

//Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL(){
    //Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    //Get the rendering context for WebGL
    gl = canvas.getContext("webgl",{ preserveDrawingBuffer: true});
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return;
    }    
}

function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    // Get the storage location of a_Position variable
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0){
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the  storage location of u_FragColor variable
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if(!u_FragColor){
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    //Get the storage location of u_Size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if(!u_Size){
        console.log('Failed to get the storage location of u_Size');
        return;
    }
}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_size=5;
let g_selectedType=POINT;
let g_segment=10;

//Set up actions for the HTML UI elements
function addActionsForHtmlUI(){

    //Button Events (Shape Type)
    document.getElementById('green').onclick = function() { g_selectedColor = [0.0,1.0,0.0,1.0];};
    document.getElementById('red').onclick = function() { g_selectedColor = [1.0,0.0,0.0,1.0];};
    document.getElementById('clearButton').onclick = function() {g_shapesList=[]; renderAllShapes();};

    document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
    document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
    document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};

    //Slider Events
    document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100;});
    document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100;});
    document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100;});
    document.getElementById('alphaSlide').addEventListener('mouseup', function() {g_selectedColor[3] = this.value/100;});

    //Size Slider Events
    document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_size = this.value;});
    document.getElementById('segSlide').addEventListener('mouseup', function() { g_segment = this.value;});


    document.getElementById('pictureButton').onclick = function() {drawPicture();};
}

function main() {

    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) {if(ev.buttons == 1){click(ev);}};

    //Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

// var g_points = [];  // The array for a mouse press
// var g_colors = [];  // The array to store the color of a point 
// var g_sizes = [];
function click(ev) { 

    //Extract the event click and return it to WebGL coordinates
    let [x,y] = convertCoordinatesEventToGL(ev);

    //Create and store the new point
    let point;
    if(g_selectedType==POINT){
        point = new Point();
    }else if(g_selectedType==TRIANGLE){
        point = new Triangle();
    }else{
        point = new Circle();
        point.segments=g_segment;
    }
    point.position=[x,y];
    point.color=g_selectedColor.slice();
    point.size=g_size;
    g_shapesList.push(point);

    // Store the coordinates to g_points array
    //g_points.push([x, y]);

    // Store the color to g_colors array
    //g_colors.push(g_selectedColor.slice());

    //Store the size to the g_sizes array
    //g_sizes.push(g_size);

    // if(x >= 0.0 && y >= 0.0) {            // First quadrant
    //     g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red 
    // } else if(x < 0.0 && y < 0.0) {         // Third quadrant
    //     g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green 
    // } else {                        // Others 
    //     g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White 
    // }

    //Draw every shape that is supposed to be in the canvas
    renderAllShapes();
}

function convertCoordinatesEventToGL(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x,y]);
}

function renderAllShapes(){
    //Check the time at the start of this function
    var startTime = performance.now();

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    //var len = g_points.length;
    var len = g_shapesList.length;
    for(var i = 0; i < len; i++) {
        
        g_shapesList[i].render();
        
    }

    //Check the time at the end of the function, and show on web page
    var duration = performance.now() - startTime;
    sendTextToHTML("numdot: " + len + "ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

//Set the text of a HTML element
function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm){
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

function drawPicture(){
    gl.uniform4f(u_FragColor, 0.0,1.0,0.0,1.0); 

    // Draw a point
    var d = 50/200.0;
    drawTriangle( [0.0, 0.3, 0.0+d, 0.3, 0.0, 0.3+d]);
    drawTriangle( [0.0, 0.3, -0.501+d, 0.3, 0.0, 0.3+d]);
    d = 75/200.0;
    drawTriangle( [0.0, 0.0, 0.0+d, 0.0, 0.0, 0.0+d]);
    drawTriangle( [0.0, 0.0, -0.701+d, 0.0, 0.0, 0.0+d]);
    d = 100/200.0;
    drawTriangle( [0.0, -0.4, 0.0+d, -0.4, 0.0, -0.4+d]);
    drawTriangle( [0.0, -0.4, -0.92+d, -0.4, 0.0, -0.4+d]);

    d = 50/200.0;
    gl.uniform4f(u_FragColor, 0.6,0.3,0.1,1.0); 
    drawTriangle( [0.15, -0.4, -0.35+d, -0.4, 0.15, -0.9+d]);
    drawTriangle( [-0.1, -0.65, -0.1+d, -0.65, -0.1, -0.65+d]);

    d = 75/200.0;
    gl.uniform4f(u_FragColor, 1.0,1.0,0.0,1.0); 
    drawTriangle( [0.125, 0.55, -0.375+d, 0.55, 0.125, 0.05+d]);
    drawTriangle( [-0.125, 0.55, -0.375+d, 0.55, -0.125, 0.05+d]);
    drawTriangle( [-0.125, 0.675, -0.625+d, 0.675, -0.125, 0.175+d]);
    drawTriangle( [0.125, 0.675, -0.125+d, 0.675, 0.125, 0.175+d]);
    drawTriangle( [0.0, 0.675, -0.25+d, 0.675, 0.0, 0.425+d]);
    drawTriangle( [0.0, 0.675, -0.5+d, 0.675, 0.0, 0.425+d]);
    drawTriangle( [-0.125, 0.55, -0.25+d, 0.55, -0.125, 0.3+d]);
    drawTriangle( [0.125, 0.675, -0.55+d, 0.675, 0.125, 0.175+d]);

    d = 25/200.0;
    gl.uniform4f(u_FragColor, 1.0,0.0,0.0,1.0);
    drawTriangle( [-0.1, -0.25, -0.1+d, -0.25, -0.1, -0.25+d]);
    drawTriangle( [-0.1+d, -0.125, -0.1, -0.125, -0.1+d, -0.375+d]);

    gl.uniform4f(u_FragColor, 1.0,0.0,1.0,1.0);
    drawTriangle( [0.1, -0.35, 0.1+d, -0.35, 0.1, -0.35+d]);
    drawTriangle( [0.1+d, -0.225, 0.1, -0.225, 0.1+d, -0.475+d]);

    gl.uniform4f(u_FragColor, 0.0,0.0,1.0,1.0);
    drawTriangle( [0.1, 0.0, 0.1+d, 0.0, 0.1, 0.0+d]);
    drawTriangle( [0.1+d, 0.125, 0.1, 0.125, 0.1+d, -0.125+d]);

    gl.uniform4f(u_FragColor, 0.0,1.0,1.0,1.0);
    drawTriangle( [-0.15, 0.075, -0.15+d, 0.075, -0.15, 0.075+d]);
    drawTriangle( [-0.15+d, 0.2, -0.15, 0.2, -0.15+d, -0.05+d]);

    gl.uniform4f(u_FragColor, 0.6,0.2,0.8,1.0);
    drawTriangle( [-0.05, 0.275, -0.05+d, 0.275, -0.05, 0.275+d]);
    drawTriangle( [-0.05+d, 0.4, -0.05, 0.4, -0.05+d, 0.15+d]);
}