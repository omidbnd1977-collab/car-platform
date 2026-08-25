exports.validateImage = async (
    imageUrl,
    brand,
    model,
    year
)=>{


try{


const url =
imageUrl.toLowerCase();


const brandName =
brand.toLowerCase();


const modelName =
model.toLowerCase();



// =================================
// BLOCKED CONTENT
// =================================


const blockedWords = [


"wedding",
"bridal",
"dress",
"fashion",

"person",
"people",
"woman",
"women",
"man",
"girl",
"boy",


"logo",
"icon",
"badge",
"wallpaper",
"vector",
"clipart",
"illustration",
"render",


"motorcycle",
"bike",
"bicycle",

"truck",
"bus",


"interior",
"dashboard",
"engine",
"seat",
"steering",
"wheel"

];




for(const word of blockedWords){


if(url.includes(word)){


return {

valid:false,

reason:
"Blocked keyword: "+word,

score:0

};


}


}





// =================================
// FILE CHECK
// =================================


if(
url.includes(".png") ||
url.includes("transparent")
){


return {

valid:false,

reason:"PNG or transparent image",

score:0

};


}





// =================================
// THUMBNAIL CHECK
// =================================


if(

url.includes("150x") ||
url.includes("200x") ||
url.includes("300x") ||
url.includes("thumb") ||
url.includes("small")

){


return {

valid:false,

reason:"Thumbnail image",

score:0

};


}





// =================================
// WRONG MODEL DETECTION
// =================================


// مدل‌های مشابه BMW
// جلوگیری از X5 -> X1 / i3 / i5


const forbiddenModels = [

"i3",
"i4",
"i5",
"i7",
"x1",
"x2",
"x3",
"x4",
"x6",
"x7",
"m3",
"m4",

"camry",
"corolla",
"hilux",
"rav4"

];





for(const wrongModel of forbiddenModels){


if(

url.includes(wrongModel)

&&

!modelName.includes(wrongModel)

){


return {

valid:false,

reason:
"Different vehicle model detected: "+wrongModel,

score:0

};


}


}






// =================================
// SCORE SYSTEM
// =================================


let score = 0;




// brand match

if(
url.includes(brandName)
){

score +=30;

}





// model match

if(
url.includes(modelName)
){

score +=40;

}





// automotive source

if(

url.includes("car") ||

url.includes("auto") ||

url.includes("vehicle") ||

url.includes("motor")

){

score +=15;

}





// year

if(

url.includes(
String(year)
)

){

score +=10;

}





// jpg confidence

if(

url.includes(".jpg") ||

url.includes(".jpeg") ||

url.includes(".webp")

){

score +=5;

}







// =================================
// FINAL DECISION
// =================================


if(score < 50){


return {

valid:false,

reason:
"Low confidence image",

score

};


}





return {


valid:true,


reason:
"Vehicle image approved",


score


};



}



catch(error){



return {


valid:false,


reason:
error.message,


score:0


};



}


};