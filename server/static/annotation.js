const countRequirement = 3;

const sendMessagePath = "http://52.91.59.168:42069/send_message";
const getKeyPath = "http://52.91.59.168:42069/get_key";

var brushFeature = ['body', 'orifice', 'erase'];

var submissionLock;
var gui;

var imgURLs;
var isFinished;

var usedImgs = [];
var currentCount = 0;
var urlIdx;

var instructionRes = [800, 640];
var screenRes = [512, 512];

var promptText;
var instructionsText;

var referenceImgs;
var curImg;
var curMap;
var BrushPreview;
var nextButton;
var resetButton;
var myCanvas;

var brushSize;
var maxBrushSize = 25;
var minBrushSize = 0.5;

var brushColor;
var curURL;

var finalKey = "";

function loadReferenceImgs()
{
  referenceImgs = [];
  var i = 0;
  while(i < countRequirement)
  {
    var nuURL;
    do
    {
      urlIdx = Math.floor(Math.random() * imgURLs.length);
      nuURL  = imgURLs[urlIdx];
    }
    while(usedImgs.includes(nuURL));
    var nuImg = loadImage('images/' + nuURL);
    usedImgs.push(nuURL);
    referenceImgs.push(nuImg);
    i++;
  }
}

function preload()
{
  imgURLs = loadStrings("filenames.santorum", loadReferenceImgs);
}

function mousePressed()
{
  brushstroke();
}

function mouseDragged()
{
  brushstroke();
}

/*function keyPressed()
{
  if(key == 'z' || key == 'Z')
    brushSize -= brushChangeRate;
  if(key == 'x' || key == 'X')
    brushSize += brushChangeRate;
  if(key == 'r' || key == 'R')
    brushColor = color(255, 0, 0);
  if(key == 'e' || key == 'E')
    brushColor = color(0);
  if(key == 't' || key == 'T')
    brushColor = color(0, 0, 255);
  curMap.fill(brushColor);
}*/

function brushstroke()
{
  curMap.ellipse(mouseX, mouseY, brushSize, brushSize);
}

function drawBrushPreview()
{
  BrushPreview.clear();
  BrushPreview.ellipse(mouseX, mouseY, brushSize, brushSize);
  image(BrushPreview, 0, 0);
}

function setup()
{
  noCursor();
  pixelDensity(1);
  isFinished = false;
  submissionLock = false;
  brushSize = 15;
  brushColor = color(255, 0, 0);
  myCanvas = createCanvas(screenRes[0] + 400, screenRes[1]);

  curImg = referenceImgs[currentCount];
  curURL = usedImgs[currentCount];

  curMap = createGraphics(screenRes[0], screenRes[1]);
  curMap.noStroke();
  curMap.pixelDensity(1);
  curMap.fill(brushColor);

  BrushPreview = createGraphics(screenRes[0], screenRes[1]);
  BrushPreview.noFill();
  BrushPreview.stroke(color(255));
  BrushPreview.strokeWeight(0.5);

  resetButton = createButton('Reset');
  resetButton.position(screenRes[0] + 15, instructionRes[1] + screenRes[1] - 35);
  resetButton.size(145, 27);

  acceptButton = createButton('Submit');
  acceptButton.position(screenRes[0] + 180, instructionRes[1] + screenRes[1] - 35);
  acceptButton.size(145, 27);

  resetButton.mousePressed(
    function()
    {
      curMap.clear();
    }
  );
  acceptButton.mousePressed(sendImg);

  //sliderRange(0.5, 25);

  gui = createGui('brush settings', screenRes[0] + 15, instructionRes[1] + 15);
  gui.addGlobals('brushSize', 'brushErase', 'brushFeature');
}

function encodeMap()
{
  curMap.loadPixels();
  var result = "";
  for(var i = 0; i < curMap.height; i++)
  {
    for(var j = 0; j < curMap.width; j++)
    {
      var idx = i * curMap.width + j;
      var thisVal = curMap.pixels[idx * 4];
      result += " " + str(thisVal)
    }
  }
  return
}

function sendImg()
{
  if(isFinished || submissionLock) 
  	return;
  submissionLock = true;
  var imgName = curURL.split(".")[0];
  var mapData = {width:curMap.width, height:curMap.height, urlIndex:imgName};
  curMap.loadPixels();
  var pixelEncoding = "";
  for(var i = 0; i < mapData.height; i++)
  {
    for(var j = 0; j < mapData.width; j++)
    {
      var idx = i * mapData.width + j;
      var thisRed = curMap.pixels[idx * 4];
      var thisBlu = curMap.pixels[idx * 4 + 2];
      pixelEncoding += " " + str(thisRed) + " " + str(thisBlu);
    }
  }
  mapData.enc = pixelEncoding;
  var dataType = "json";
  httpPost(
    sendMessagePath,
    dataType,
    mapData,
    finishFn,
    errorFn
  );
}

function finishFn(result)
{
  if(currentCount >= countRequirement - 1)
  {
    trueFinish();
  }
  else
  {
    currentCount++;
    curImg = referenceImgs[currentCount];
    curMap.remove();
    curMap = createGraphics(curImg.width, curImg.height)
    curMap.noStroke();
  	curMap.pixelDensity(1);
  	curMap.fill(brushColor);
    curMap.clear();
    curURL = usedImgs[currentCount];
  }
  submissionLock = false;
}

function trueFinish()
{
  isFinished = true;
  httpPost(
  	getKeyPath,
  	'text',
  	'userID',
  	function(result)
  	{
  		finalKey = result;
  	},
  	errorFn
  );
}

function errorFn(error)
{
  console.log("error: " + error);
}


function drawInstructions()
{
	var baseX = screenRes[0] + 5;
	textSize(18);
	fill(255);
	var baseY = 25;
	var lineOffset = 24;
	text("", baseX, baseY);
}

function draw()
{
  if(!isFinished)
  {
    switch(brushFeature)
    {
      case('body'):
        brushColor = color(255, 0, 0);
        break;
      case('orifice'):
        brushColor = color(0, 0, 255);
        break;
      case('erase'):
        brushColor = color(0);
        break;
    }
    curMap.fill(brushColor);
  	background(0);
  	var imgW = Math.min(screenRes[0], curImg.width);
  	var imgH = Math.min(screenRes[1], curImg.height);
    image(curImg, 0, 0, imgW, imgH, 0, 0, imgW, imgH);
    blendMode(SCREEN);
    image(curMap, 0, 0);
    blendMode(DIFFERENCE);
    drawBrushPreview();
    blendMode(NORMAL);
  }
  else
  {
  	background(0);
  	textSize(24);
  	text("congratulations! Your key is " + finalKey, 10, screenRes[1] / 2);
  }
  drawInstructions();
}
