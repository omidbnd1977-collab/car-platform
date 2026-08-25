import React, {useEffect, useState} from "react";


const API = "http://localhost:5000/api";


export default function EditCar({car, back}){


    const [form,setForm] = useState({

        brand:"",
        model:"",
        year:"",
        country:"",
        price_aed:"",
        shipping_cost:"",
        customs_cost:"",
        description:""

    });



    useEffect(()=>{


        if(car){

            setForm({

                brand: car.brand_name || "",
                model: car.model_name || "",
                year: car.year || "",
                country: car.country || "",
                price_aed: car.price_aed || "",
                shipping_cost: car.shipping_cost || "",
                customs_cost: car.customs_cost || "",
                description: car.description || ""

            });

        }


    },[car]);





    const change = (e)=>{


        setForm({

            ...form,

            [e.target.name]:e.target.value

        });


    };





    const save = async()=>{


        try{


            await fetch(

                `${API}/cars/${car.id}`,

                {

                    method:"PUT",

                    headers:{
                        "Content-Type":"application/json"
                    },


                    body:JSON.stringify(form)

                }

            );



            alert("Car updated");

            back();


        }
        catch(err){

            console.log(err);

        }


    };







    return (

        <div
        style={{
            padding:"30px"
        }}
        >


            <button onClick={back}>
                ← Back
            </button>


            <h2>
                Edit Car
            </h2>



            {
                Object.keys(form).map(key=>(


                    <div
                    key={key}
                    style={{
                        marginBottom:"15px"
                    }}
                    >


                    <label>
                        {key}
                    </label>


                    <br/>


                    {
                        key==="description"

                        ?

                        <textarea
                        name={key}
                        value={form[key]}
                        onChange={change}
                        style={{
                            width:"400px",
                            height:"100px"
                        }}
                        />


                        :


                        <input
                        name={key}
                        value={form[key]}
                        onChange={change}
                        style={{
                            width:"400px"
                        }}
                        />


                    }


                    </div>


                ))
            }



            <button
            onClick={save}
            >
                Save Changes
            </button>



        </div>

    );


}