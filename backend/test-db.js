require("dotenv").config({
    path:"./src/.env"
});

const db = require("./src/config/database");


async function test(){

    try{

        const result = await db.query(
            "SELECT NOW()"
        );

        console.log(
            "Database connected:",
            result.rows[0]
        );

    }catch(error){

        console.log(
            "Database error:",
            error.message
        );

    }finally{

        process.exit();

    }

}


test();