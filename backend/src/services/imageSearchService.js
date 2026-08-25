const axios = require("axios");


// =======================================
// Black List
// =======================================

const BAD_KEYWORDS = [

    // انسان
    "wedding",
    "bride",
    "dress",
    "fashion",
    "model",
    "woman",
    "man",
    "person",

    // غیر خودرو
    "house",
    "home",
    "property",
    "realestate",
    "phone",
    "watch",
    "food",
    "shoe",
    "jewelry",
    "ring",
    "makeup",

    // بازی و رسانه
    "game",
    "gaming",
    "marvel",
    "tokon",
    "playstation",
    "comic"

];




// =======================================
// Trusted Sources
// =======================================

const TRUSTED_SOURCES = [

    "bmw.com",
    "bmwblog.com",
    "motor1.com",
    "caranddriver.com",
    "autoblog.com",
    "carscoops.com",
    "carbuzz.com"

];




// =======================================
// Helpers
// =======================================


function hasBadKeyword(text){

    text = text.toLowerCase();

    return BAD_KEYWORDS.some(
        word => text.includes(word)
    );

}



function calculateScore(
    image,
    brand,
    model,
    year
){

    let score = 0;


    const text =
    JSON.stringify(image).toLowerCase();



    if(
        text.includes(
            brand.toLowerCase()
        )
    ){

        score +=30;

    }



    if(
        text.includes(
            model.toLowerCase()
        )
    ){

        score +=35;

    }



    if(
        text.includes(
            String(year)
        )
    ){

        score +=10;

    }



    if(
        TRUSTED_SOURCES.some(
            s => text.includes(s)
        )
    ){

        score +=20;

    }



    if(
        text.includes("car") ||
        text.includes("auto") ||
        text.includes("vehicle") ||
        text.includes("suv")
    ){

        score +=10;

    }



    return score;

}




// =======================================
// SearchAPI Google Image Search
// =======================================


async function searchCarImages(
    brand,
    model,
    year
){

try{


    console.log(
        "SEARCHAPI IMAGE SEARCH:",
        brand,
        model,
        year
    );



    const query =

    `${brand} ${model} ${year} official car exterior`;




    const response =

    await axios.get(

        "https://www.searchapi.io/api/v1/search",

        {

            params:{

                engine:
                "google_images",

                q:
                query,

                api_key:
                process.env.SEARCHAPI_KEY

            }

        }

    );




    const images =
    response.data.images || [];




    const results = [];




    for(const img of images){


      const url =
typeof img.original === "string"
    ? img.original
    : img.original?.link ||
      img.thumbnail;



        if(!url){

            continue;

        }



        const text =
        JSON.stringify(img)
        .toLowerCase();



        if(
            hasBadKeyword(text)
        ){

            console.log(
                "BAD IMAGE:",
                url
            );

            continue;

        }



        const score =

        calculateScore(
            img,
            brand,
            model,
            year
        );



        console.log(
            "IMAGE SCORE:",
            score,
            url
        );



        if(score < 50){

            continue;

        }



        results.push({

            image_url:url,

            source_name:
            "SearchAPI Google Images",

            source_url:
            img.source ||
            null,

            view_type:
            "MAIN",

            score

        });


    }





    const unique =

    results.filter(

        (item,index,self)=>

        index ===

        self.findIndex(

            x =>
            x.image_url === item.image_url

        )

    );





    console.log(
        "FINAL IMAGE RESULTS:",
        unique
    );





    return unique

    .sort(
        (a,b)=>
        b.score-a.score
    )

    .slice(0,5);



}
catch(error){


    console.log(
        "SEARCHAPI IMAGE ERROR:",
        error.message
    );


    console.log(
        error.response?.data
    );


    return [];

}


}




module.exports = {

    searchCarImages

};