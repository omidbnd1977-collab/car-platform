const db = require("../config/database");
const storageService = require("../services/storageService");
const { resolveBrandAndModel } = require("../services/catalogService");




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

} = req.body || {};



await client.query("BEGIN");



// ============================
// BRAND
// ============================
console.log("BRAND RECEIVED:", brand);

// اگر برند/مدل در کاتالوگ نباشد ساخته می‌شوند (find-or-create) تا
// ثبت خودروی تازه هیچ‌وقت به خاطر «Brand not found» گیر نکند.
const { brandRow, modelRow } = await resolveBrandAndModel(client, {
    brand,
    model,
});

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



// delete physical file (local disk or S3/R2)

if(imageUrl){

storageService.deleteFile(imageUrl)
.catch(function (deleteError) {

    console.log(
        "IMAGE FILE DELETE ERROR:",
        deleteError.message
    );

});

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
} = req.body || {};



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



LEFT JOIN car_brands

ON cars.brand_id = car_brands.id



LEFT JOIN car_models

ON cars.model_id = car_models.id



LEFT JOIN dealerships

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
// GET SOLD CARS - خودروهای فروخته شده
// =================================================
exports.getSoldCars = async(req,res)=>{

try{
try{ await db.query("ALTER TABLE cars ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ"); }catch(e){}

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

cars.sold_at,
cars.created_at,

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



LEFT JOIN car_brands

ON cars.brand_id = car_brands.id



LEFT JOIN car_models

ON cars.model_id = car_models.id



LEFT JOIN dealerships

ON cars.dealership_id = dealerships.id



LEFT JOIN car_images

ON cars.id = car_images.car_id

AND car_images.approval_status='APPROVED'



WHERE cars.status='SOLD'



GROUP BY

cars.id,

car_brands.name,

car_models.name,

dealerships.name,

dealerships.city



ORDER BY COALESCE(cars.sold_at, cars.created_at) DESC


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



LEFT JOIN car_brands

ON cars.brand_id = car_brands.id



LEFT JOIN car_models

ON cars.model_id = car_models.id



LEFT JOIN dealerships

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

const { images } = req.body || {};

// اگر بدنه‌ی JSON نرسیده باشد (یا آرایه نباشد) ۴۰۰ می‌دهیم، نه ۵۰۰
if (!Array.isArray(images)) {
return res.status(400).json({
error: "آرایه‌ی images لازم است (و هدر Content-Type: application/json)."
});
}

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

// ============================================================
// UPDATE CAR   PUT /api/cars/:id
// ============================================================
// قبلاً فقط year/country/price/shipping/customs/description ویرایش
// می‌شدند و brand/model در فرم ادمین فقط تزئینی بود. حالا:
//  • brand/model (find-or-create در کاتالوگ)
//  • dealership_name  (برای «بدون نمایندگی» رشته‌ی خالی بفرستید)
//  • status  (ACTIVE / HIDDEN / …)
// فیلدهای ارسال‌نشده دست‌نخورده می‌مانند (COALESCE).
// ============================================================

const UPDATABLE_STATUSES = [
    "ACTIVE",
    "HIDDEN",
    "SOLD",
    "PENDING",
    "APPROVED",
    "REJECTED",
];

function numOrNothing(value) {
    const raw = String(value == null ? "" : value)
        .trim()
        .replace(/[,_\s]/g, "");

    if (raw === "") {
        return null;
    }

    const num = Number(raw);

    return Number.isFinite(num) ? num : null;
}

exports.updateCar = async (req, res) => {

const client = await db.connect();

try {

    const carId = req.params.id;
    const body = req.body || {};

    try{ await client.query("ALTER TABLE cars ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ"); }catch(e){}
    await client.query("BEGIN");

    const current = await client.query(
        "SELECT id, brand_id, model_id, dealership_id FROM cars WHERE id = $1",
        [carId]
    );

    if (!current.rows.length) {

        await client.query("ROLLBACK");

        return res.status(404).json({
            error: "خودرو پیدا نشد (id: " + carId + ").",
        });
    }

    const brandName = String(body.brand || "").trim();
    const modelName = String(body.model || "").trim();

    let brandRow = null;
    let modelRow = null;

    if (brandName || modelName) {

        // اگر فقط مدل عوض شده باشد، برند فعلی خودرو نگه داشته می‌شود
        if (!brandName) {

            const currentBrand = await client.query(
                "SELECT id, name FROM car_brands WHERE id = $1",
                [current.rows[0].brand_id]
            );

            brandRow = currentBrand.rows[0] || null;
        }

        const resolved = await resolveBrandAndModel(client, {
            brand: brandName,
            model: modelName,
            brandId: brandRow ? brandRow.id : null,
        });

        brandRow = resolved.brandRow;
        modelRow = resolved.modelRow;
    }

    // نمایندگی: ارسال‌نشده = دست نزن، رشته‌ی خالی = حذف شد
    let dealershipValue = null;

    if (body.dealership_name !== undefined) {

        const name = String(body.dealership_name || "").trim();

        if (name) {

            const dealership = await client.query(
                `
                SELECT id
                FROM dealerships
                WHERE LOWER(TRIM(name)) = LOWER($1)
                LIMIT 1
                `,
                [name]
            );

            dealershipValue = dealership.rows.length
                ? dealership.rows[0].id
                : current.rows[0].dealership_id;
        } else {

            dealershipValue = -1; // sentinel → NULL
        }
    }

    const statusValue = String(body.status || "").trim().toUpperCase();
    const badStatus = statusValue && !UPDATABLE_STATUSES.includes(statusValue);

    if (badStatus) {

        await client.query("ROLLBACK");

        return res.status(400).json({
            error: "وضعیت نامعتبر است. مجاز: " + UPDATABLE_STATUSES.join(" / "),
        });
    }

    const result = await client.query(
        `
        UPDATE cars
        SET
            year = COALESCE($1, year),
            country = COALESCE($2, country),
            price_aed = COALESCE($3, price_aed),
            shipping_cost = COALESCE($4, shipping_cost),
            customs_cost = COALESCE($5, customs_cost),
            description = COALESCE($6, description),
            brand = COALESCE($7, brand),
            brand_id = COALESCE($8, brand_id),
            model = COALESCE($9, model),
            model_id = COALESCE($10, model_id),
            dealership_id = CASE
                WHEN $11::int = -1 THEN NULL
                ELSE COALESCE($11, dealership_id)
            END,
            status = COALESCE($12, status),
            sold_at = CASE WHEN $12 = 'SOLD' THEN COALESCE(sold_at, NOW()) WHEN $12 = 'ACTIVE' THEN NULL ELSE sold_at END
        WHERE id = $13
        RETURNING *
        `,
        [
            numOrNothing(body.year),
            String(body.country || "").trim() || null,
            numOrNothing(body.price_aed),
            numOrNothing(body.shipping_cost),
            numOrNothing(body.customs_cost),
            body.description === undefined ? null : String(body.description),
            brandRow ? brandRow.name : null,
            brandRow ? brandRow.id : null,
            modelRow ? modelRow.name : null,
            modelRow ? modelRow.id : null,
            dealershipValue,
            statusValue || null,
            carId,
        ]
    );

    await client.query("COMMIT");

    if (!result.rows.length) {

        return res.status(404).json({
            error: "خودرو پیدا نشد (id: " + carId + ").",
        });
    }

    return res.json({
        message: "Car updated",
        car: result.rows[0],
        catalog: {
            brand_created: Boolean(brandRow && brandRow.created),
            model_created: Boolean(modelRow && modelRow.created),
        },
    });

} catch (error) {

    console.log("UPDATE ERROR:", error.message);

    try {

        await client.query("ROLLBACK");

    } catch (rollbackError) {

        console.log("UPDATE ROLLBACK ERROR:", rollbackError.message);
    }

    const status = Number(error.statusCode) || 500;

    return res.status(status).json({
        error: error.message,
    });

} finally {

    if (client) {

        client.release();
    }
}

};


// ============================================================
// DELETE CAR   DELETE /api/cars/:id
// ============================================================
// برای خودروهایی که اشتباهی ثبت شده‌اند. ترتیب کار:
//  ۱) رکوردهای car_images و فایل‌هایشان (فایل‌ها فقط بعد از COMMIT)
//  ۲) حذف خودِ خودرو
// اگر جدول دیگری (مثلاً purchase_requests) به این خودرو وابسته
// باشد، حذف فیزیکی ممکن نیست؛ در آن حالت خودرو «مخفی» می‌شود
// (status=HIDDEN) تا از سایت برود ولی سوابق فروش نپرد.
// ============================================================

exports.deleteCar = async (req, res) => {

const client = await db.connect();

try {

    const carId = req.params.id;

    await client.query("BEGIN");

    const car = await client.query(
        "SELECT id, brand, model, year, primary_image_id FROM cars WHERE id = $1",
        [carId]
    );

    if (!car.rows.length) {

        await client.query("ROLLBACK");

        return res.status(404).json({
            error: "خودرو پیدا نشد (id: " + carId + ").",
        });
    }

    const images = await client.query(
        "SELECT id, image_url FROM car_images WHERE car_id = $1",
        [carId]
    );

    const imageUrls = images.rows
        .map((image) => String(image.image_url || "").trim())
        .filter(Boolean);

    // primary_image_id به car_images ارجاع می‌دهد، پس اول آن را باز می‌کنیم
    await client.query(
        "UPDATE cars SET primary_image_id = NULL WHERE id = $1",
        [carId]
    );
    await client.query("DELETE FROM car_images WHERE car_id = $1", [carId]);

    let deletedRows = [];

    try {

        deletedRows = (
            await client.query("DELETE FROM cars WHERE id = $1 RETURNING id", [carId])
        ).rows;

        await client.query("COMMIT");
    } catch (deleteError) {

        // وابستگی از جای دیگر (فروش/پیشنهاد) → حذف نکن، مخفی کن
        if (deleteError && deleteError.code === "23503") {

            await client.query("ROLLBACK");
            await client.query("UPDATE cars SET status = 'HIDDEN' WHERE id = $1", [carId]);
            await client.query("COMMIT");

            return res.json({
                ok: true,
                id: Number(carId),
                deleted: false,
                soft_deleted: true,
                message:
                    "این خودرو به رکورد فروش وصل است و حذف فیزیکی نمی‌شود؛ " +
                    "از سایت مخفی‌اش کردم (status=HIDDEN).",
            });
        }

        throw deleteError;
    }

    // فایل‌ها best-effort (دیگر تراکنش تمام شده؛ خطایش حذف را برگرداندنی نیست)
    await Promise.all(
        imageUrls.map((url) =>
            storageService.deleteFile(url).catch((fileError) => {
                console.log("DELETE CAR FILE ERROR:", fileError.message);
            })
        )
    );

    const info = car.rows[0];

    console.log(
        "CAR DELETED:",
        carId,
        info.brand,
        info.model,
        info.year,
        "images:",
        imageUrls.length
    );

    return res.json({
        ok: true,
        id: Number(carId),
        deleted: deletedRows.length > 0,
        soft_deleted: false,
        images_removed: imageUrls.length,
        message: "خودرو حذف شد.",
    });

} catch (error) {

    console.log("DELETE CAR ERROR:", error.message);

    try {

        await client.query("ROLLBACK");
    } catch (rollbackError) {

        console.log("DELETE CAR ROLLBACK ERROR:", rollbackError.message);
    }

    return res.status(500).json({
        error: error.message,
    });

} finally {

    if (client) {

        client.release();
    }
}

};

// =================================================
// UPLOAD CAR IMAGE
// Supports: FRONT / REAR / INTERIOR
// =================================================

exports.uploadCarImage = async (req, res) => {
    let stored = null;
    let oldImageUrlToPurge = null;

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
            "INTERIOR",
            "SIDE",
            "MAIN"
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
        // ذخیره‌ی فایل توسط storageService
        // -----------------------------------------
        // چون multer با memoryStorage کار می‌کند، فایل هنوز
        // فقط در حافظه است. اول ذخیره می‌کنیم تا اگر استورج
        // (دیسک محلی یا S3/R2) خطا داد، رکورد قبلی از بین
        // نرود و پاسخ خطای واقعی به فرانت‌اند برگردد.
        // -----------------------------------------

        try {

            stored = await storageService.saveFile(
                req.file,
                {
                    folder: storageService.DEFAULT_FOLDER
                }
            );

        }
        catch (storageError) {

            console.log(
                "STORAGE SAVE ERROR:",
                storageError.message
            );

            return res.status(502).json({
                error:
                    "Could not save the image: " +
                    storageError.message
            });

        }


        const imageUrl =
            stored.url;


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

            // فایل نسخه‌ی قبلی فقط وقتی حذف می‌شود که
            // آپلود جدید با موفقیت در دیتابیس ثبت شود.
            oldImageUrlToPurge =
                existingImage.rows[0].image_url;


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
        // پاک‌سازی فایل نسخه‌ی قبلی
        // -----------------------------------------
        // حالا که رکورد جدید ثبت شده، فایل قدیمی (محلی یا
        // داخل باکت) حذف می‌شود تا فایل یتیم نماند.
        // -----------------------------------------

        if (
            oldImageUrlToPurge &&
            oldImageUrlToPurge !== imageUrl
        ) {

            await storageService.deleteFile(
                oldImageUrlToPurge
            );

        }


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

        // اگر فایل ذخیره شد ولی بعدش خطایی رخ داد،
        // فایل یتیم را پاک می‌کنیم.
        if (stored && stored.url) {

            await storageService.deleteFile(
                stored.url
            );

        }

        return res.status(
            error.status || 500
        ).json({

            error:
                error.message ||
                "Image upload failed"

        });

    }
};


// =================================================
// BACKFILL CATALOG IMAGES
// (برای ماشین‌های موجودی که بدون عکس ثبت شده‌اند)
// =================================================
// این تابع تمام ماشین‌هایی که هیچ عکسی ندارند را پیدا
// می‌کند و اگر برای همان برند+مدل (ترجیحاً همان سال،
// در غیر این صورت نزدیک‌ترین سال) عکس دستی‌آپلودشده‌ای
// در جای دیگری از سیستم موجود باشد، همان عکس‌ها را
// برای این ماشین‌ها هم کپی می‌کند.
// =================================================

exports.backfillCatalogImages = async (req, res) => {

    try {

        // ماشین‌هایی که هیچ عکسی ندارند
        const carsWithoutImages = await db.query(
            `
            SELECT
                cars.id,
                cars.brand_id,
                cars.model_id,
                cars.year
            FROM cars
            LEFT JOIN car_images
                ON car_images.car_id = cars.id
            WHERE car_images.id IS NULL
            `
        );

        const results = [];

        for (const car of carsWithoutImages.rows) {

            // ۱) دقیقاً همان برند + مدل + سال
            let reuseResult = await db.query(
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
                    car.brand_id,
                    car.model_id,
                    car.year,
                    car.id
                ]
            );

            // ۲) اگر نبود، همان برند+مدل با نزدیک‌ترین سال
            if (!reuseResult.rows.length) {

                reuseResult = await db.query(
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
                        car.brand_id,
                        car.model_id,
                        car.id,
                        car.year
                    ]
                );

            }

            if (!reuseResult.rows.length) {

                results.push({
                    car_id: car.id,
                    images_added: 0
                });

                continue;

            }

            let sortOrder = 1;
            let firstImageId = null;

            for (const img of reuseResult.rows) {

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

                if (!firstImageId) {
                    firstImageId = imageId;
                }

                sortOrder++;

            }

            await db.query(
                `
                UPDATE cars
                SET primary_image_id = $1
                WHERE id = $2
                `,
                [
                    firstImageId,
                    car.id
                ]
            );

            results.push({
                car_id: car.id,
                images_added: reuseResult.rows.length
            });

        }

        return res.json({

            message: "Backfill completed",

            total_cars_checked:
                carsWithoutImages.rows.length,

            results

        });

    }
    catch (error) {

        console.log(
            "BACKFILL ERROR:",
            error.message
        );

        return res.status(500).json({
            error: error.message
        });

    }

};
