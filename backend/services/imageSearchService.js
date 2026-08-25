const axios = require("axios");
const cheerio = require("cheerio");


async function searchCarImage(brand, model, year) {

    try {

        const query = `${brand} ${model} ${year} car`;

        const url =
            "https://www.bing.com/images/search?q=" +
            encodeURIComponent(query);


        const response = await axios.get(url, {

            headers: {

                "User-Agent":
                "Mozilla/5.0"

            }

        });


        const $ = cheerio.load(response.data);


        let image = null;
        let source = null;


        $("a.iusc").each(function(){

            const data = $(this).attr("m");


            if(data && !image){

                const json = JSON.parse(data);

                image = json.murl;
                source = json.purl;

            }

        });



        if(!image){

            return null;

        }


        return {

            image_url:image,

            source_url:source

        };


    } catch(error){

        console.log(
            "Image search error:",
            error.message
        );


        return null;

    }

}



module.exports = {

    searchCarImage

};