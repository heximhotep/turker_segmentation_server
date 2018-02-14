const numDogs = 26;

const sendMessagePath = "http://52.91.59.168:42069/send_message";
const getKeyPath = "http://52.91.59.168:42069/get_key";

var imgURLs = [];
for(var i = 0; i < numDogs; i++)
{
  imgURLs.push("images/dog" + i + ".png");
}
var isFinished;

var usedImgs = [];
var currentCount = 0;
var countRequirement = 5;
var urlIdx;

var screenRes = [640, 480];

var promptText;
var instructionsText;

var referenceImgs;
var curImg;
var curMap;
var BrushPreview;
var acceptButton;
var resetButton;
var myCanvas;

var brushSize;
var maxBrushSize = 25;
var minBrushSize = 0.5;
var brushChangeRate = 2;

var curColor;
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
    var nuImg = loadImage(nuURL);
    usedImgs.push(nuURL);
    referenceImgs.push(nuImg);
    i++;
  }
}

function preload()
{
  loadReferenceImgs();
}

function mousePressed()
{
  brushstroke();
}

function mouseDragged()
{
  brushstroke();
}

function keyPressed()
{
  if(key == 'z' || key == 'Z')
    brushSize -= brushChangeRate;
  if(key == 'x' || key == 'X')
    brushSize += brushChangeRate;
  if(key == 'r' || key == 'R')
    curColor = color(255, 0, 0);
  if(key == 'e' || key == 'E')
    curColor = color(0);
  if(key == 't' || key == 'T')
    curColor = color(0, 0, 255);
  curMap.fill(curColor);
}

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
  brushSize = 15;
  curColor = color(255, 0, 0);
  myCanvas = createCanvas(screenRes[0] + 400, screenRes[1]);

  curMap = createGraphics(screenRes[0], screenRes[1]);
  curMap.noStroke();
  curMap.pixelDensity(1);
  curMap.fill(curColor);

  BrushPreview = createGraphics(screenRes[0], screenRes[1]);
  BrushPreview.noFill();
  BrushPreview.stroke(color(255));
  BrushPreview.strokeWeight(0.5);

  resetButton = createButton('Reset');
  resetButton.position(0, screenRes[1] + 5);
  resetButton.size(65, 19);

  acceptButton = createButton('Accept');
  acceptButton.position(75, screenRes[1] + 5);
  acceptButton.size(65, 19);

  resetButton.mousePressed(
    function()
    {
      curMap.clear();
    }
  );
  acceptButton.mousePressed(sendImg);

  curImg = referenceImgs[currentCount];
  curURL = usedImgs[currentCount];
}

function sendImg()
{
  if(isFinished) 
  	return;
  var imgName = (curURL.split("/")[1]).split(".")[0];
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
    curMap.clear();
    curImg = referenceImgs[currentCount];
    curURL = usedImgs[currentCount];
  }
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
	text("r: change color to red", baseX, baseY);
	text("t: change color to blue", baseX, baseY + lineOffset);
	text("e: change color to erase", baseX, baseY + lineOffset * 2);
	text("z: make brush smaller", baseX, baseY + lineOffset * 3);
	text("x: make brush bigger", baseX, baseY + lineOffset * 4);
}

function draw()
{
  if(!isFinished)
  {
  	background(0);
  	var imgW = Math.min(screenRes[0], curImg.width);
  	var imgH = Math.min(screenRes[1], curImg.height);
    image(curImg, 0, 0, imgW, imgH, 0, 0, imgW, imgH);
    blendMode(SCREEN);
    image(curMap, 0, 0);
    blendMode(NORMAL);
    drawBrushPreview();
  }
  else
  {
  	background(0);
  	textSize(24);
  	text("congratulations! Your key is " + finalKey, 10, screenRes[1] / 2);
  }
  drawInstructions();
}
