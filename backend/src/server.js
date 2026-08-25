const catalogRoutes = require("./routes/catalogRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const dealershipRoutes = require("./routes/dealershipRoutes");
const carRoutes = require("./routes/carRoutes");
const imageRoutes = require("./routes/imageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");


const app = express();


app.use(cors());
app.use(express.json());
app.use(
    "/uploads",
    express.static("uploads")
);


// Routes

app.use("/api/auth", authRoutes);

app.use("/api/dealerships", dealershipRoutes);

app.use("/api/cars", carRoutes);

app.use("/api/images", imageRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/public", publicRoutes);

app.use("/api/purchases", purchaseRoutes);
app.use(
"/api/catalog",
catalogRoutes
);



// Test

app.get("/", (req, res) => {

    res.json({
        message: "Car Platform API is running"
    });

});



app.get("/test-db", async (req, res) => {

    try {

        const result = await db.query(
            "SELECT NOW()"
        );


        res.json({

            status:"database connected",

            time:result.rows[0]

        });


    } catch(error){


        res.status(500).json({

            error:error.message

        });


    }

});



const PORT = process.env.PORT || 5000;


app.listen(PORT,()=>{

    console.log(
        `Server running on port ${PORT}`
    );

});