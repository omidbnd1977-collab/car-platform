const db = require("../config/database");


// ===============================
// لیست تصاویر یک خودرو
// ===============================

exports.getCarImages = async(req,res)=>{

    try{

        const result = await db.query(
            `
            SELECT *
            FROM car_images
            WHERE car_id=$1
            ORDER BY created_at DESC
            `,
            [
                req.params.carId
            ]
        );


        res.json({
            images: result.rows
        });


    }catch(error){

        res.status(500).json({
            error:error.message
        });

    }

};





// ===============================
// تایید تصویر
// ===============================

exports.approveImage = async(req,res)=>{

    try{


        const result = await db.query(
            `
            UPDATE car_images
            SET approval_status='APPROVED'
            WHERE id=$1
            RETURNING *
            `,
            [
                req.params.id
            ]
        );


        if(!result.rows.length){

            return res.status(404).json({
                message:"Image not found"
            });

        }



        res.json({

            message:"Image approved",

            image:result.rows[0]

        });



    }catch(error){

        res.status(500).json({
            error:error.message
        });

    }

};






// ===============================
// رد کردن تصویر
// ===============================

exports.rejectImage = async(req,res)=>{


    try{


        const result = await db.query(
            `
            UPDATE car_images
            SET approval_status='REJECTED'
            WHERE id=$1
            RETURNING *
            `,
            [
                req.params.id
            ]
        );



        res.json({

            message:"Image rejected",

            image:result.rows[0]

        });



    }catch(error){

        res.status(500).json({
            error:error.message
        });

    }

};






// ===============================
// حذف تصویر
// ===============================

exports.deleteImage = async(req,res)=>{


    try{


        await db.query(
            `
            DELETE FROM car_images
            WHERE id=$1
            `,
            [
                req.params.id
            ]
        );



        res.json({

            message:"Image deleted"

        });



    }catch(error){

        res.status(500).json({
            error:error.message
        });

    }

};





// ===============================
// تعیین عکس اصلی
// ===============================

exports.setMainImage = async(req,res)=>{


    const client = await db.connect();


    try{


        await client.query("BEGIN");



        // حذف MAIN قبلی

        await client.query(
            `
            UPDATE car_images
            SET view_type='OTHER'
            WHERE car_id=$1
            `,
            [
                req.body.car_id
            ]
        );



        // قرار دادن عکس جدید

        const result =
        await client.query(
            `
            UPDATE car_images

            SET
            view_type='MAIN',
            approval_status='APPROVED'

            WHERE id=$1

            RETURNING *
            `,
            [
                req.params.id
            ]
        );



        await client.query("COMMIT");



        res.json({

            message:"Main image changed",

            image:result.rows[0]

        });



    }catch(error){


        await client.query("ROLLBACK");


        res.status(500).json({
            error:error.message
        });


    }finally{

        client.release();

    }

};