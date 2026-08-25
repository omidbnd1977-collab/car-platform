const axios = require("axios");


// پیدا کردن عکس خودرو
exports.findCarImage = async (brand, model) => {

    try {

        const query = `${brand} ${model} car`;

        const response = await axios.get(
            "https://api.unsplash.com/search/photos",
            {
                params: {
                    query: query,
                    per_page: 1
                },

                headers: {
                    Authorization:
                    `Client-ID YOUR_UNSPLASH_KEY`
                }
            }
        );


        if (
            response.data.results &&
            response.data.results.length > 0
        ) {


            return {

                image_url:
                response.data.results[0]
                .urls.regular,


                source_name:
                "Unsplash",


                source_url:
                response.data.results[0]
                .links.html

            };


        }


        return null;


    } catch(error){

        console.log(
            "IMAGE SERVICE ERROR:",
            error.message
        );


        return null;

    }

};