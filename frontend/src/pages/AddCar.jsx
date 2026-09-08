import React, { useState } from "react";
const API = "https://car-platform-db.onrender.com/api";
export default function AddCar({ back }) {
    const [form, setForm] = useState({
        dealership_name: "",
        brand: "",
        model: "",
        year: "",
        country: "",
        price_aed: "",
        shipping_cost: "",
        customs_cost: "",
        description: ""
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const change = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const save = async () => {
        try {
            setSaving(true);
            setError("");

            const res = await fetch(
                `${API}/cars`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data?.error || "Failed to create car"
                );
            }

            alert("Car created");
            back();
        }
        catch (err) {
            console.log(err);
            setError(err?.message || "Failed to create car");
        }
        finally {
            setSaving(false);
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
                Add New Car
            </h2>

            {error && (
                <div
                style={{
                    padding: "12px 15px",
                    marginBottom: "15px",
                    background: "#ffebee",
                    color: "#c62828",
                    borderRadius: "8px",
                    maxWidth: "400px"
                }}
                >
                    {error}
                </div>
            )}

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
            disabled={saving}
            >
                {saving ? "Saving..." : "Create Car"}
            </button>
        </div>
    );
}