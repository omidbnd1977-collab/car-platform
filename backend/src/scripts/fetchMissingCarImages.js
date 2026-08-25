const db = require("../config/database");
const imageSearchService = require("../services/imageSearchService");


async function fetchMissingCarImages() {

    try {

        console.log("Searching cars without images...");


        const cars = await db.query(
            `
            SELECT
                cars.id,
                cars.brand,
                cars.model,
                cars.year

            FROM cars

            LEFT JOIN car_images

            ON cars.id = car_images.car_id

            WHERE cars.status='ACTIVE'

            GROUP BY cars.id

            HAVING COUNT(car_images.id)=0
            `
        );


        console.log(
            "Cars found:",
            cars.rows.length
        );



        for (const car of cars.rows) {


            console.log(
                "Searching:",
                car.brand,
                car.model,
                car.year
            );



            const images =
                await imageSearchService.searchCarImages(
                    car.brand,
                    car.model,
                    car.year
                );



            if (!images || images.length === 0) {

                console.log("No image found");

                continue;
            }



            for (const img of images) {


                await db.query(
                    `
                    INSERT INTO car_images
                    (
                        car_id,
                        image_url,
                        source_name,
                        source_url,
                        view_type,
                        approval_status,
                        ai_processed
                    )

                    VALUES
                    ($1,$2,$3,$4,$5,$6,$7)
                    `,
                    [
                        car.id,
                        img.image_url,
                        "Bing Auto Search",
                        img.source_url,
                        "MAIN",
                        "APPROVED",
                        true
                    ]
                );


            }



            console.log(
                "Saved:",
                images.length,
                "images"
            );


        }



        console.log("Finished");

        process.exit(0);



    } catch(error) {


        console.log(
            "ERROR:",
            error.message
        );


        process.exit(1);

    }

}



fetchMissingCarImages();