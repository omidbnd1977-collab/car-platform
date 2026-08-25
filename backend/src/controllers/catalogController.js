const db = require("../config/database");


// دریافت همه برندها
exports.getBrands = async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT id, name
            FROM car_brands
            ORDER BY name
            `
        );


        res.json({
            brands: result.rows
        });


    } catch(error){

        res.status(500).json({
            error:error.message
        });

    }

};



// دریافت مدل‌های یک برند
exports.getModelsByBrand = async (req,res)=>{

    try {


        const { brandId } = req.params;


        const result = await db.query(
            `
            SELECT id, name
            FROM car_models
            WHERE brand_id=$1
            ORDER BY name
            `,
            [brandId]
        );


        res.json({
            models: result.rows
        });



    } catch(error){

        res.status(500).json({
            error:error.message
        });

    }

};