// This is a p5.js sketch that sets up a canvas and draws two graphs.

// Global variables for canvas dimensions
let canvasWidth = 1200;
let canvasHeight = 800;
let graphsWidth; // Width of the graphs area  (960px)
let sineWaveHeight = 50;
let nseSeed = 1234; // Seed for random number generation

let streamsPointCount; // Number of points for all Streams (array length of all streams)
// let streamAVals = []; // Array to store Stream A curve values
// let streamBVals = []; // Array to store Stream B curve values
// let streamCVals = []; // Array to store Stream C curve values
// Array to store all Stream values, Each stream will have its own array of values.
// elements represent streams A, B, and C respectively
let streamsVals = [[], [], []]; 
let streamsStartX = 50; // Starting horzizontal position for the streams

// declaring global variables for Stream A and Stream B label heights
// store last 5 frames of each label height
let streamLabelHeightsMax = 15; // Max number of heights to store for each stream
let streamALabelHeights = []; // Array to store heights of Stream A labels
let streamBLabelHeights = []; // Array to store heights of Stream B labels
let streamCLabelHeights = []; // Array to store heights of Stream C labels

function setup() {
  createCanvas(canvasWidth, 900);
  graphsWidth = floor(canvasWidth * 0.85); 
  streamsPointCount = graphsWidth; 
}

// define a custom ramp with 5 sampled values
let customRamp = [0, 0.15, 0.55, 1, 1, 1, 0.55, 0.15, 0];

// Function to interpolate between ramp values
function getRampValue(input) {
  let index = floor(input * (customRamp.length - 1)); // Get the base index
  let nextIndex = min(index + 1, customRamp.length - 1); // Ensure next index is within bounds
  let t = (input * (customRamp.length - 1)) % 1; // Fractional part for interpolation
  
  // Linear interpolation between the two sampled values
  return lerp(customRamp[index], customRamp[nextIndex], t);
}

function colourMult(inColor, mult) {
  // Function to multiply a color by a factor
  // inColor: p5.js color object
  // mult[]: int array with 4 elements [r, g, b, a] to multiply the color by
  // Extract RGB components and apply the multiplier
  let r = constrain(red(inColor) * mult[0], 0, 255);
  let g = constrain(green(inColor) * mult[1], 0, 255);
  let b = constrain(blue(inColor) * mult[2], 0, 255);
  let a = constrain(alpha(inColor) * mult[3], 0, 255);
  return color(r, g, b, a); // Return the new color
}

function colourOffset(inColor, offset) {
  // Function to offset a color by a value
  // inColor: p5.js color object
  // offset: int array with 4 elements [r, g, b, a] to offset the color by
  // Extract RGB components and apply the offset
  let r = constrain(red(inColor) + offset[0], 0, 255);
  let g = constrain(green(inColor) + offset[1], 0, 255);
  let b = constrain(blue(inColor) + offset[2], 0, 255);
  let a = constrain(alpha(inColor) + offset[3], 0, 255);
  return color(r, g, b, a); // Return the new color
}

// Function to draw graph axes
function drawAxes(startX, startY, endX, endY, clr, axisLabelsXY) {
  // This function draws the axes for the graph
  stroke(0); // Set stroke color to black
  line(startX, endY, endX, endY); // Draw X-axis
  line(startX, startY, startX, endY); // Draw Y-axis
  noStroke(); // Disable stroke for text
  fill(clr); // Set fill color for text
  textSize(16); // Set text size
  textAlign(CENTER, CENTER); // Center align text
  // Draw horizontal axis label
  text(axisLabelsXY[0], (startX + endX) / 2, endY + 20); // Draw X-axis label
  fill(0, 0, 0, 0); // Reset fill color for next drawing
  // Draw vertical axis label
  textAlign(LEFT, CENTER); // Right align text for Y-axis label
  fill(clr); // Set fill color for Y-axis label
  text(axisLabelsXY[1], startX + 10, startY); // Draw Y-axis label
  fill(0, 0, 0, 0); // Reset fill color for next drawing
}

// Function to draw Stream A graph
function drawStream(streamConfig, thisFrame, rampShift, sineWaveHeight, graphLabel) {
  // This function draws the Stream A graph based on the provided configuration
  // Destructure the streamAConfig object for easier access
  let {
    streamStartY,
    streamEndY,
    streamHeight,
    streamWidth,
    curveXOffset,
    wavefn,
    nseSeed,
    clr,
    curveLabelHeights
  } = streamConfig;

  // Draw axes for Stream A only
  if (graphLabel.includes("A")) {
    drawAxes(streamsStartX, streamStartY, 
    streamsStartX + streamWidth, streamEndY, 
    clr, [graphLabel, "Value"]); // Draw axes for Stream A
  }

  // Plot points for Stream A
  let numBgPts = 500; // Number of points to plot for Streams -- resolution of the graph
  let bgPtsInterval = streamWidth / numBgPts * 0.5;
  for (let i = 0; i < streamWidth; i++) {
    // make normalisedX wrap around 0-1
    let normalisedX = abs(i / streamWidth + rampShift) % 1.0; // Normalize x position
    // Set stroke color based on normalized x position
    stroke(red(clr), green(clr), blue(clr), map(getRampValue(normalisedX),0,1,0.15,1)*255*0.3); 
    ellipse(
      streamsStartX + bgPtsInterval * i,
      streamStartY + noise((thisFrame*0.15 + i*1) * 1.1 + nseSeed) * streamHeight,
      5, 5
    );
  }

  noiseSeed(nseSeed); // Set seed for noise function
  // Draw sine wave for Stream 
  stroke(clr); // Set the stroke colour for Stream
  noFill();
  let avgYStream; // average Y position for Stream label
  beginShape();
  // find out length of the respective streamsVals array for the current graph
  let streamsValsIndex = graphLabel.includes("A") ? 0 : 1; // Index for Stream A or B
  let streamsValsArray = streamsVals[streamsValsIndex]; // Get the respective streamsVals array
  // add 1 to the length of the array if it is less than streamsPointCount
  // this will be the newest point to plot this frame
  let streamLength = (streamsValsArray.length >= streamsPointCount) ? streamsPointCount 
                      : streamsValsArray.length + 1; 
  // loop through streamsVals array to plot the sine wave
  for (let i = 0; i < streamLength; i++) {
    // plot each point in the streamsVals array
    let x = i - frameCount; // X position based on index
    // vertex(streamsStartX + x, yVal); // plot the vertex
  }

  for (let x = 0; x < streamWidth; x++) {
    let sineValue; // Variable to hold sine value based on graph label
    sineValue = wavefn(curveXOffset, x); // Get sine wave value
    
    let y = streamStartY + (streamHeight * 0.5) + sineValue * sineWaveHeight;
    let nse = noise(thisFrame * 10 + x * 0.13) * 50; // Add noise to y position
    let yVal = y + nse; // Calculate the final y position with noise
    vertex(streamsStartX + x, yVal); // plot the vertex
    // append to global array for Stream B label heights
    curveLabelHeights.push(yVal);
    // Keep only the last 5 heights
    if (curveLabelHeights.length > streamLabelHeightsMax) {
      curveLabelHeights.shift(); // Remove the oldest height
    }
    // lerp the last 5 heights to get a stable label position
    avgYStream = curveLabelHeights.reduce((a, b) => a + b, 0) / curveLabelHeights.length;
    vertex(streamsStartX + x, yVal); // plot the vertex
  }
  endShape();
  // Add label for Stream 
  fill(clr); // color for the label
  noStroke();
  textAlign(LEFT, CENTER); // Right align text for Y-axis label
  text(`${graphLabel} Curve`, streamsStartX + streamWidth + 10, avgYStream);
  fill (0, 0, 0, 0); // reset fill color for next drawing
} // end of drawStreamA function


function draw() {
  background(140); // Set background color
  let thisFrame = frameCount * 0.013; // frameCount multiplier for animation
  let rampShift = frameCount * 0.0011; // background noise points shift speed
  
  // Draw axes for Stream A (top graph)
  let streamAStartY = 40;
  let streamAEndY = streamAStartY + canvasHeight * 0.4;
  let streamAHeight = streamAEndY - streamAStartY;
  let streamAWidth = graphsWidth; // Width of Stream A graph
  // stream A Config
  let streamAConfig = {
    streamStartY: streamAStartY,
    streamEndY: streamAEndY,
    streamHeight: streamAHeight,
    streamWidth: streamAWidth,
    curveXOffset: 0, // Offset for curve X position
    wavefn: (offset, time) => sin(thisFrame + offset + time * 0.02), // Sine wave function for Stream A
    nseSeed: nseSeed,
    clr: color(140, 30, 30, 255),  // dark red for Stream A
    curveLabelHeights: streamALabelHeights
  }
  drawStream(streamAConfig, thisFrame, rampShift, sineWaveHeight, "Stream A");

  // Draw axes for Stream B (bottom graph)
  let streamBStartY = streamAStartY;
  let streamBEndY = streamBStartY + canvasHeight * 0.4;
  let streamBHeight = streamBEndY - streamBStartY;
  let streamBWidth = graphsWidth; // Width of Stream B graph

  let streamBConfig = {
    streamStartY: streamBStartY,
    streamEndY: streamBEndY,
    streamHeight: streamBHeight,
    streamWidth: streamBWidth,
    curveXOffset: 23+88.834, // Offset for curve X position
    wavefn: (offset, time) => sin(-thisFrame - offset + time * 0.015), // Sine wave function for Stream A
    nseSeed: -12 * noise(nseSeed + 88.834),
    clr: color(30, 30, 180, 255), // dark blue for Stream B
    curveLabelHeights: streamBLabelHeights
  }
  drawStream(streamBConfig, thisFrame, rampShift, sineWaveHeight, "Stream B");

  /*
  // Stream C 
  let streamCStartY = canvasHeight * 0.55 - 20;
  let streamCEndY = streamCStartY + canvasHeight * 0.4;
  let streamCHeight = streamCEndY - streamCStartY;
  let streamCWidth = graphsWidth; // Width of Stream C graph;
  stroke(0);
  line(streamsStartX, streamCEndY, streamCWidth, streamCEndY); // X-axis
  line(streamsStartX, streamCStartY, streamsStartX, streamCEndY); // Y-axis
  noStroke();
  fill(0, 50, 0, 255);
  text("Stream C", 50, streamCStartY - 10);
  fill(0, 0, 0, 0); // reset fill color for next drawing
  // Plot points for Stream C
  stroke(0, 15, 0, 255);
  for (let i = 0; i < streamCWidth; i++) {
    // make normalisedX wrap around 0-1
    let normalisedX = abs(i / streamCWidth + rampShift) % 1.0; // Normalize x position
    // Set stroke color based on normalized x position
    stroke(0, 15, 0, map(getRampValue(normalisedX),0,1,0.15,1)*255*0.3); 
    ellipse(
      streamsStartX + bgPtsInterval * i,
      streamCStartY + noise((thisFrame*0.15 + i*1) * 1.1 + nseSeed) * streamCHeight,
      5, 5
    );
  }
  noiseSeed(nseSeed+88.834); // Set seed for noise function
  // Draw decision curve wave for Stream C
  stroke(0, 50, 0, 255); // Green for Stream C
  noFill();
  beginShape();
  let avgYStreamC; // average Y position for Stream C label
  let streamChooser = 0; // Variable to choose between Stream A and Stream B
  
  for (let x = 0; x < streamCWidth; x++) {
    let y = streamCStartY + (streamCHeight * 0.5) +
      sin(thisFrame + x * 0.02) * sineWaveHeight;
    let nse = noise(thisFrame*10 + x * 0.13) * 50; // Add noise to y position
    let yVal = y + nse; // Calculate the final y position with noise
    if (x === streamCWidth - 1) {
      lastYStreamC = yVal; // Store the last Y position
    }
    // append to global array for Stream C label heights
    streamCLabelHeights.push(yVal);
    // Keep only the last 5 heights
    if (streamCLabelHeights.length > streamLabelHeightsMax) {
      streamCLabelHeights.shift(); // Remove the oldest height
    }
    // lerp the last 5 heights to get a stable label position
    avgYStreamC = streamCLabelHeights.reduce((a, b) => a + b, 0) / streamCLabelHeights.length;
    vertex(streamsStartX + x, yVal); // plot the vertex
  }
  endShape();
  // Add label for Stream C
  fill(0, 50, 0, 255); // Green color for the label
  noStroke();
  text("Stream C Curve", streamsStartX + streamCWidth + 10, avgYStreamC);
  fill (0, 0, 0, 0); // reset fill color for next drawing
  */
} // end of draw function
