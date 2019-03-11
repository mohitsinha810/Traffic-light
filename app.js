var express  = require('express');
var fs = require('fs'),
    PNG = require('pngjs').PNG,
    pixelmatch = require('pixelmatch');
var app = express();
var bodyParser  = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use('/exported-images', express.static('static'));
app.set("view engine","ejs");

var Jimp = require('jimp');

//database
var difference_of_img=[
    10367,
    49951,
    78140,
    174706,
];

var sampleImage = [
    "static/exported-images/front.png",
    "static/exported-images/frontCopy.png",
    "static/exported-images/left.png",
    "static/exported-images/leftCopy.png",
    "static/exported-images/rear.png",
    "static/exported-images/rearCopy.png",
    "static/exported-images/right.png",
    "static/exported-images/rightCopy.png",
]
var tArray = [];
var SignalPercentage = [];
var totalDiff = 0;
var T = 4;
//algorithm

//1. Total Time allocated to a 4 way traffic light signal T    //min:T=2   //max:T=6
// var T = 4;

//2. Total density of vehicles at particular T time-period
// var totalDiff = 0;
function transOpt(){
    
    tArray = [];
    SignalPercentage = [];
    totalDiff = 0;
    difference_of_img.forEach((e)=>{
        totalDiff += e;
    });
    //console.log(totalDiff);

    //3. Percentage allocation to each signal {front->left->rear->right}
    // var SignalPercentage = [];
    difference_of_img.forEach((e)=>{
        SignalPercentage.push(e/totalDiff);
    });
    //console.log(SignalPercentage);

    // [32,16,25,55]

    //2. time alloted to particular side of traffic signal 
    //      t = SignalPercentage[i] * T
    // tArray = [];
    SignalPercentage.forEach((e)=>{
        tArray.push(e*T);
    });
}

transOpt();


//grayscale and black&white conversion
sampleImage.forEach((img)=>{
    Jimp.read(img, (err, lenna) => {
        if (err) throw err;
        lenna
          // .resize(256, 256)
          .quality(100) 
          .greyscale() 
          .contrast(1)
          .posterize(2)
          .write(img); // save
      });
})

var divided = [0,0,0,0];

//taking difference
var img1 = fs.createReadStream("static/exported-images/front.png").pipe(new PNG()).on('parsed', doneReading1),
    img2 = fs.createReadStream("static/exported-images/frontCopy.png").pipe(new PNG()).on('parsed', doneReading1),
    filesRead = 0;

var img3 = fs.createReadStream("static/exported-images/right.png").pipe(new PNG()).on('parsed', doneReading2),
    img4 = fs.createReadStream("static/exported-images/rightCopy.png").pipe(new PNG()).on('parsed', doneReading2),
    filesRead2 = 0;

var img5 = fs.createReadStream("static/exported-images/rear.png").pipe(new PNG()).on('parsed', doneReading3),
    img6 = fs.createReadStream("static/exported-images/rearCopy.png").pipe(new PNG()).on('parsed', doneReading3),
    filesRead3 = 0;

var img7 = fs.createReadStream("static/exported-images/left.png").pipe(new PNG()).on('parsed', doneReading4),
    img8 = fs.createReadStream("static/exported-images/leftCopy.png").pipe(new PNG()).on('parsed', doneReading4),
    filesRead4 = 0;

    

function doneReading1() {
    if (++filesRead < 2) return;
    var diff = new PNG({width: img1.width, height: img1.height});
    var diffPixel=pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {threshold: 0.1});
    divided[0] = diffPixel;
    // console.log(diffPixel);
    diff.pack().pipe(fs.createWriteStream("static/exported-images/difffront.png"));
}

function doneReading2() {
    if (++filesRead2 < 2) return;
    var diff = new PNG({width: img3.width, height: img3.height});

    var diffPixel=pixelmatch(img3.data, img4.data, diff.data, img3.width, img3.height, {threshold: 0.1});
    divided[1] = diffPixel;
    // console.log(diffPixel);
    diff.pack().pipe(fs.createWriteStream("static/exported-images/diffright.png"));
}

function doneReading3() {
    if (++filesRead3 < 2) return;
    var diff = new PNG({width: img5.width, height: img5.height});

    var diffPixel=pixelmatch(img5.data, img6.data, diff.data, img5.width, img5.height, {threshold: 0.1});
    divided[2] = diffPixel;
    // console.log(diffPixel);
    diff.pack().pipe(fs.createWriteStream("static/exported-images/diffrear.png"));
}

function doneReading4() {
    if (++filesRead4 < 2) return;
    var diff = new PNG({width: img7.width, height: img7.height});

    var diffPixel=pixelmatch(img7.data, img8.data, diff.data, img7.width, img7.height, {threshold: 0.1});
    divided[3] = diffPixel;
    // console.log(diffPixel);
    diff.pack().pipe(fs.createWriteStream("static/exported-images/diffleft.png"));
}

function show(){
    console.log("Difference: [" + divided+"]");
    let total = 0;
    divided.forEach((item)=>total+=item);
    let newArray = divided.map((item)=>Math.round(item/total*100));
    console.log("Time ratio: [" + newArray+"]");
}

app.get("/result",function(req,res){
    res.json(divided);
})


//running the server
app.listen(3001,()=>{
    console.log("Server running at port 3001");
setTimeout(show,1000);

})