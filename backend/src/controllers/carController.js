const db = require("../config/database");




// =================================================
// CREATE CAR
// =================================================

exports.createCar = async (req,res)=>{
console.log("=================================");
console.log("CREATE CAR CALLED");
console.log("TIME:", new Date().toISOString());
console.log("METHOD:", req.method);
console.log("URL:", req.originalUrl);
console.log("BODY:", JSON.stringify(req.body, null, 2));
console.log("=================================");


let client;


try{


client = await db.connect();


const {

dealership_name,
brand,
model,
year,
country,
price_aed,
shipping_cost,
customs_cost,
description

}=req.body;



await client.query("BEGIN");



// ============================
// BRAND
// ============================
console.log("BRAND RECEIVED:", brand);

const brandResult = await client.query(
`
SELECT id,name
FROM car_brands
WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
`,
[
    brand
]
);


if(!brandResult.rows.length){

    throw new Error(
        "Brand not found: " + brand
    );

}


const brandRow = brandResult.rows[0];



// ============================
// MODEL
// ============================


const modelResult = await client.query(
`
SELECT id,name,brand_id
FROM car_models
WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
AND brand_id=$2
`,
[
    model,
    brandRow.id
]
);


if(!modelResult.rows.length){

    throw new Error(
        "Model not found: " + model
    );

}


const modelRow = modelResult.rows[0];

// ============================
// DEALERSHIP
// ============================

let dealershipId = null;


if(dealership_name){

    const dealershipResult = await client.query(
    `
    SELECT id
    FROM dealerships
    WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
    LIMIT 1
    `,
    [
        dealership_name
    ]
    );


    if(dealershipResult.rows.length){

        dealershipId =
        dealershipResult.rows[0].id;

    }

}


// ============================
// INSERT CAR
// ============================

const carResult = await client.query(
`
INSERT INTO cars
(
    dealership_id,
    brand,
    model,
    brand_id,
    model_id,
    year,
    country,
    price_aed,
    shipping_cost,
    customs_cost,
    description,
    status
)

VALUES
(
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    'ACTIVE'
)

RETURNING *
`,
[
    dealershipId,

    brandRow.name,

    modelRow.name,

    brandRow.id,

    modelRow.id,

    year,

    country,

    price_aed,

    shipping_cost,

    customs_cost,

    description
]
);


const car = carResult.rows[0];
console.log("CAR CREATED ID:", car.id);

console.log("BEFORE IMAGE PROCESS");

await client.query("COMMIT");
// =================================================
// IMAGE REUSE FROM CATALOG (AFTER CAR SAVED)
// =================================================
// به‌جای جستجوی خودکار عکس از گوگل/بینگ (که نتایج
// بی‌ربط برمی‌گرداند)، اگر این مدل قبلاً با عکس‌های
// دستی‌آپلودشده ثبت شده باشد، همان عکس‌ها برای خودرو
// جدید استفاده مجدد می‌شوند. در غیر این صورت، خودرو
// بدون عکس ذخیره می‌شود تا بعداً دستی آپلود شود.
// =================================================

try {

    console.log("IMAGE REUSE PROCESS STARTED");
    console.log(
        "SEARCHING CATALOG FOR:",
        brandRow.name,
        modelRow.name,
        year
    );


    // ۱) اول دنبال دقیقاً همان برند + مدل + سال بگرد
    let reuseResult = await client.query(
        `
        SELECT
            ci.image_url,
            ci.view_type,
            ci.sort_order
        FROM car_images ci
        JOIN cars c ON c.id = ci.car_id
        WHERE c.brand_id = $1
        AND c.model_id = $2
        AND c.year = $3
        AND c.id != $4
        AND ci.source_name = 'Admin Upload'
        ORDER BY ci.sort_order ASC
        `,
        [
            brandRow.id,
            modelRow.id,
            year,
            car.id
        ]
    );


    // ۲) اگر برای همان سال چیزی پیدا نشد، همان
    // برند + مدل را با نزدیک‌ترین سال موجود امتحان کن
    if (!reuseResult.rows.length) {

        console.log(
            "NO EXACT YEAR MATCH - TRYING SAME MODEL, ANY YEAR"
        );

        reuseResult = await client.query(
            `
            SELECT
                ci.image_url,
                ci.view_type,
                ci.sort_order
            FROM car_images ci
            JOIN cars c ON c.id = ci.car_id
            WHERE c.brand_id = $1
            AND c.model_id = $2
            AND c.id != $3
            AND ci.source_name = 'Admin Upload'
            ORDER BY ABS(c.year - $4) ASC, ci.sort_order ASC
            `,
            [
                brandRow.id,
                modelRow.id,
                car.id,
                year
            ]
        );

    }


    if (reuseResult.rows.length) {

        let sortOrder = 1;

        for (const img of reuseResult.rows) {

            const imageResult = await client.query(
                `
                INSERT INTO car_images
                (
                    car_id,
                    image_url,
                    source_name,
                    view_type,
                    approval_status,
                    ai_processed,
                    sort_order
                )
                VALUES
                ($1,$2,$3,$4,'APPROVED',false,$5)
                RETURNING id
                `,
                [
                    car.id,
                    img.image_url,
                    "Reused From Catalog",
                    img.view_type || "MAIN",
                    sortOrder
                ]
            );

            const imageId = imageResult.rows[0].id;

            console.log(
                "IMAGE REUSED:",
                imageId,
                "FROM:",
                img.image_url
            );

            // اولین عکس = عکس اصلی
            if (!car.primary_image_id) {

                await client.query(
                    `
                    UPDATE cars
                    SET primary_image_id=$1
                    WHERE id=$2
                    `,
                    [
                        imageId,
                        car.id
                    ]
                );

                car.primary_image_id = imageId;

                console.log(
                    "PRIMARY IMAGE SET:",
                    imageId
                );

            }

            sortOrder++;

        }

        console.log(
            "TOTAL IMAGES REUSED:",
            reuseResult.rows.length
        );

    }
    else {

        console.log(
            "NO CATALOG IMAGES FOUND - car saved without images. Please upload manually."
        );

    }

}
catch(imageError){

    console.log(
        "IMAGE REUSE ERROR:",
        imageError.message
    );

}


// ============================
// RESPONSE
// ============================

return res.json({

    message:
    "Car created successfully",

    car

});


}
catch(error){


    if(client){

        await client.query(
            "ROLLBACK"
        );

    }


    res.status(400).json({

        error:error.message

    });


}
finally{


    if(client){

        client.release();

    }


}


};

// =================================================
// SET PRIMARY IMAGE
// =================================================

exports.setPrimaryImage = async(req,res)=>{

try{

const {
    carId,
    imageId
}=req.params;


const check =
await db.query(
`
SELECT id
FROM car_images
WHERE id=$1
AND car_id=$2
`,
[
    imageId,
    carId
]
);


if(!check.rows.length){

return res.status(404).json({

message:"Image not found"

});

}



await db.query(
`
UPDATE cars
SET primary_image_id=$1
WHERE id=$2
`,
[
    imageId,
    carId
]
);



res.json({

message:"Primary image updated",

primary_image_id:imageId

});


}

catch(error){

res.status(500).json({

error:error.message

});

}

};



// =================================================
// DELETE CAR IMAGE
// =================================================

exports.deleteCarImage = async(req,res)=>{

const client = await db.connect();

try{

await client.query("BEGIN");


const {
    carId,
    imageId
}=req.params;



// get image info

const image =
await client.query(
`
SELECT id,image_url
FROM car_images
WHERE id=$1
AND car_id=$2
`,
[
    imageId,
    carId
]
);



if(!image.rows.length){

await client.query("ROLLBACK");

return res.status(404).json({

message:"Image not found"

});

}



const imageUrl =
image.rows[0].image_url;



// check primary

const car =
await client.query(
`
SELECT primary_image_id
FROM cars
WHERE id=$1
`,
[
    carId
]
);



const wasPrimary =
String(car.rows[0].primary_image_id)
===
String(imageId);





// delete database record

await client.query(
`
DELETE FROM car_images
WHERE id=$1
AND car_id=$2
`,
[
    imageId,
    carId
]
);





// if primary deleted select next image

if(wasPrimary){


const nextImage =
await client.query(
`
SELECT id
FROM car_images
WHERE car_id=$1
ORDER BY sort_order ASC
LIMIT 1
`,
[
    carId
]
);



if(nextImage.rows.length){


await client.query(
`
UPDATE cars
SET primary_image_id=$1
WHERE id=$2
`,
[
    nextImage.rows[0].id,
    carId
]
);


}
else{


await client.query(
`
UPDATE cars
SET primary_image_id=NULL
WHERE id=$1
`,
[
    carId
]
);


}


}




// reorder images

await client.query(
`
WITH ordered AS (

SELECT
id,
ROW_NUMBER()
OVER(
ORDER BY sort_order ASC,id ASC
) AS new_order

FROM car_images

WHERE car_id=$1

)

UPDATE car_images

SET sort_order=ordered.new_order

FROM ordered

WHERE car_images.id=ordered.id

`,
[
    carId
]
);



await client.query("COMMIT");



// delete physical file

if(
imageUrl &&
imageUrl.startsWith("/uploads/")
){

const fs = require("fs");
const path = require("path");


const filePath =
path.join(
process.cwd(),
imageUrl
);



if(fs.existsSync(filePath)){

fs.unlinkSync(filePath);

}


}

// Recalculate image order after delete

await db.query(
`
WITH ordered AS (

    SELECT
        id,
        ROW_NUMBER()
        OVER(
            ORDER BY sort_order ASC, id ASC
        ) AS new_order

    FROM car_images

    WHERE car_id=$1

)

UPDATE car_images

SET sort_order = ordered.new_order

FROM ordered

WHERE car_images.id = ordered.id;

`,
[
    carId
]
);

res.json({

message:"Image deleted successfully"

});


}



catch(error){

await client.query("ROLLBACK");


res.status(500).json({

error:error.message

});


}



finally{

client.release();

}


};

// =================================================
// ADD MANUAL CAR IMAGE
// =================================================

exports.addCarImage = async(req,res)=>{

try{


const carId = req.params.carId;


const {
    image_url,
    source_name
} = req.body;



if(!image_url){

return res.status(400).json({

error:"image_url is required"

});

}



// بررسی تکراری بودن عکس

const exists = await db.query(
`
SELECT id
FROM car_images
WHERE car_id=$1
AND image_url=$2
LIMIT 1
`,
[
    carId,
    image_url
]);


if(exists.rows.length){

return res.status(400).json({

error:"Image already exists"

});

}



// گرفتن آخرین ترتیب عکس

const orderResult = await db.query(
`
SELECT COALESCE(MAX(sort_order),0)+1 AS next_order
FROM car_images
WHERE car_id=$1
`,
[
    carId
]);



const sortOrder =
orderResult.rows[0].next_order;



// ذخیره عکس

const imageResult = await db.query(
`
INSERT INTO car_images
(
 car_id,
 image_url,
 source_name,
 view_type,
 approval_status,
 ai_processed,
 sort_order
)

VALUES
(
 $1,
 $2,
 $3,
 'MAIN',
 'APPROVED',
 false,
 $4
)

RETURNING id
`,
[
 carId,
 image_url,
 source_name || "Admin Added",
 sortOrder
]);



const imageId =
imageResult.rows[0].id;



// اگر خودرو عکس اصلی ندارد

const carResult = await db.query(
`
SELECT primary_image_id
FROM cars
WHERE id=$1
`,
[
 carId
]);



if(!carResult.rows[0].primary_image_id){


await db.query(
`
UPDATE cars
SET primary_image_id=$1
WHERE id=$2
`,
[
 imageId,
 carId
]);


}



res.json({

message:"Image added successfully",

image_id:imageId

});



}
catch(error){

res.status(500).json({

error:error.message

});

}


};
// =================================================
// GET CARS
// =================================================

exports.getCars = async(req,res)=>{

try{


const result =
await db.query(

`

SELECT

cars.id,

cars.primary_image_id,

cars.year,

cars.country,

cars.price_aed,

cars.shipping_cost,

cars.customs_cost,

cars.description,

cars.status,


car_brands.name AS brand,


car_models.name AS model,


dealerships.name AS dealership_name,


dealerships.city,



COALESCE(

    json_agg(

        json_build_object(

            'id',
            car_images.id,

            'image_url',
            car_images.image_url,

            'source_name',
            car_images.source_name,

            'view_type',
            car_images.view_type,

            'sort_order',
            car_images.sort_order,

            'is_primary',
            (
                cars.primary_image_id = car_images.id
            )

        )

        ORDER BY car_images.sort_order ASC

    )

    FILTER(
        WHERE car_images.id IS NOT NULL
    ),

    '[]'

)

AS images



FROM cars



JOIN car_brands

ON cars.brand_id = car_brands.id



JOIN car_models

ON cars.model_id = car_models.id



JOIN dealerships

ON cars.dealership_id = dealerships.id



LEFT JOIN car_images

ON cars.id = car_images.car_id

AND car_images.approval_status='APPROVED'



WHERE cars.status='ACTIVE'



GROUP BY

cars.id,

car_brands.name,

car_models.name,

dealerships.name,

dealerships.city



ORDER BY cars.created_at DESC


`

);



res.json({

cars:result.rows

});


}


catch(error){


res.status(500).json({

error:error.message

});


}


};






// =================================================
// GET CAR BY ID
// =================================================

exports.getCarById = async(req,res)=>{

try{


const result =
await db.query(

`

SELECT


cars.*,


car_brands.name AS brand_name,


car_models.name AS model_name,


dealerships.name AS dealership_name,

dealerships.city,

dealerships.phone,

dealerships.address,



COALESCE(
json_agg(
json_build_object(

'id',
car_images.id,

'image_url',
car_images.image_url,

'source_name',
car_images.source_name,

'view_type',
car_images.view_type,

'sort_order',
car_images.sort_order,

'is_primary',
(
 cars.primary_image_id = car_images.id
)

)
ORDER BY car_images.sort_order ASC
)
FILTER(
WHERE car_images.id IS NOT NULL
),
'[]'
)
AS images



FROM cars



JOIN car_brands

ON cars.brand_id = car_brands.id



JOIN car_models

ON cars.model_id = car_models.id



JOIN dealerships

ON cars.dealership_id = dealerships.id



LEFT JOIN car_images

ON cars.id = car_images.car_id

AND car_images.approval_status='APPROVED'



WHERE cars.id=$1



GROUP BY

cars.id,

car_brands.name,

car_models.name,

dealerships.name,

dealerships.city,

dealerships.phone,

dealerships.address


`,

[
req.params.id
]


);



if(!result.rows.length){


return res.status(404).json({

message:
"Car not found"

});


}



res.json({

car:result.rows[0]

});


}



catch(error){


res.status(500).json({

error:error.message

});


}


};

// =================================================
// REORDER IMAGES  <-- این قسمت جدید است
// =================================================

exports.reorderCarImages = async(req,res)=>{

try{

const { images } = req.body;

const carId = req.params.carId;


for(const img of images){

    await db.query(
    `
    UPDATE car_images
    SET sort_order=$1
    WHERE id=$2
    AND car_id=$3
    `,
    [
        img.sort_order,
        img.id,
        carId
    ]);

}





res.json({

message:"Images reordered successfully"

});


}
catch(error){

res.status(500).json({

error:error.message

});

}

};

// =================================================
// UPDATE CAR
// =================================================

exports.updateCar = async(req,res)=>{

try{

const carId = req.params.id;

const {
year,
country,
price_aed,
shipping_cost,
customs_cost,
description
}=req.body;


const result = await db.query(
`
UPDATE cars
SET
year = COALESCE($1,year),
country = COALESCE($2,country),
price_aed = COALESCE($3,price_aed),
shipping_cost = COALESCE($4,shipping_cost),
customs_cost = COALESCE($5,customs_cost),
description = COALESCE($6,description)

WHERE id=$7

RETURNING *
`,
[
year || null,
country || null,
price_aed || null,
shipping_cost || null,
customs_cost || null,
description || null,
carId
]
);


if(result.rows.length===0){

return res.status(404).json({
message:"Car not found"
});

}


res.json({

message:"Car updated",

car:result.rows[0]

});


}
catch(error){

console.log(
"UPDATE ERROR:",
error.message
);


res.status(500).json({

error:error.message

});

}

};

// =================================================
// UPLOAD CAR IMAGE
// Supports: FRONT / REAR / INTERIOR
// =================================================

exports.uploadCarImage = async (req, res) => {
    try {

        const carId = req.params.carId;

        const viewType = String(
            req.body.view_type || ""
        ).trim().toUpperCase();


        // -----------------------------------------
        // Validate image
        // -----------------------------------------

        if (!req.file) {

            return res.status(400).json({
                message: "No image uploaded"
            });

        }


        // -----------------------------------------
        // Validate view type
        // -----------------------------------------

        const allowedTypes = [
            "FRONT",
            "REAR",
            "INTERIOR"
        ];

        if (!allowedTypes.includes(viewType)) {

            return res.status(400).json({
                message:
                    "Invalid view_type. Use FRONT, REAR or INTERIOR."
            });

        }


        // -----------------------------------------
        // Check car exists
        // -----------------------------------------

        const carCheck = await db.query(
            `
            SELECT id, primary_image_id
            FROM cars
            WHERE id = $1
            `,
            [carId]
        );


        if (!carCheck.rows.length) {

            return res.status(404).json({
                message: "Car not found"
            });

        }


        const currentPrimaryImageId =
            carCheck.rows[0].primary_image_id;


        // -----------------------------------------
        // Check if this view already exists
        // -----------------------------------------

        const existingImage = await db.query(
            `
            SELECT id, image_url
            FROM car_images
            WHERE car_id = $1
            AND view_type = $2
            ORDER BY id DESC
            LIMIT 1
            `,
            [
                carId,
                viewType
            ]
        );


        // -----------------------------------------
        // Delete old image record if exists
        // -----------------------------------------

        if (existingImage.rows.length) {

            const oldImageId =
                existingImage.rows[0].id;


            await db.query(
                `
                DELETE FROM car_images
                WHERE id = $1
                `,
                [oldImageId]
            );


            // If old image was primary,
            // clear primary_image_id for now.
            if (
                currentPrimaryImageId &&
                Number(currentPrimaryImageId) ===
                Number(oldImageId)
            ) {

                await db.query(
                    `
                    UPDATE cars
                    SET primary_image_id = NULL
                    WHERE id = $1
                    `,
                    [carId]
                );

            }

        }


        // -----------------------------------------
        // Get next sort order
        // -----------------------------------------

        const sortResult = await db.query(
            `
            SELECT
                COALESCE(MAX(sort_order), 0) + 1
                AS next_order
            FROM car_images
            WHERE car_id = $1
            `,
            [carId]
        );


        const sortOrder =
            sortResult.rows[0].next_order;


        // -----------------------------------------
        // Image URL
        // -----------------------------------------

        const imageUrl =
            `/uploads/cars/${req.file.filename}`;


        // -----------------------------------------
        // Insert new image
        // -----------------------------------------

        const imageResult = await db.query(
            `
            INSERT INTO car_images
            (
                car_id,
                image_url,
                source_name,
                view_type,
                approval_status,
                ai_processed,
                sort_order
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                'APPROVED',
                false,
                $5
            )
            RETURNING id
            `,
            [
                carId,
                imageUrl,
                "Admin Upload",
                viewType,
                sortOrder
            ]
        );


        const imageId =
            imageResult.rows[0].id;


        // -----------------------------------------
        // FRONT becomes primary image
        // -----------------------------------------

        if (viewType === "FRONT") {

            await db.query(
                `
                UPDATE cars
                SET primary_image_id = $1
                WHERE id = $2
                `,
                [
                    imageId,
                    carId
                ]
            );

        }


        // -----------------------------------------
        // If car has no primary image,
        // use this image as primary.
        // -----------------------------------------

        else if (!currentPrimaryImageId) {

            await db.query(
                `
                UPDATE cars
                SET primary_image_id = $1
                WHERE id = $2
                `,
                [
                    imageId,
                    carId
                ]
            );

        }


        // -----------------------------------------
        // Response
        // -----------------------------------------

        return res.json({

            message:
                "Image uploaded successfully",

            image_id:
                imageId,

            image_url:
                imageUrl,

            view_type:
                viewType,

            sort_order:
                sortOrder

        });


    }
    catch (error) {

        console.log(
            "UPLOAD IMAGE ERROR:",
            error.message
        );


        return res.status(500).json({

            error:
                error.message

        });

    }
};
