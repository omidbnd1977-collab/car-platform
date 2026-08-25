const axios = require("axios");


async function getCarImage(carName) {

    try {

        const response = await axios.get(
            "https://commons.wikimedia.org/w/api.php",
            {
                params: {
                    action: "query",
                    format: "json",
                    generator: "search",
                    gsrsearch: carName + " car",
                    gsrlimit: 1,
                    prop: "imageinfo",
                    iiprop: "url"
                }
            }
        );


        const pages =
            response.data.query?.pages;


        if (!pages) {
            return null;
        }


        const firstImage =
            Object.values(pages)[0];


        return firstImage.imageinfo?.[0]?.url || null;


    } catch (error) {

        console.log(
            "IMAGE SEARCH ERROR:",
            error.message
        );

        return null;
    }

}


module.exports = getCarImage;