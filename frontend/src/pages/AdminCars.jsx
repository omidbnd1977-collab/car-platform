import React, { useEffect, useState } from "react";
import AdminCarImages from "../components/admin/AdminCarImages";
import EditCar from "./EditCar";
import { getImageUrl } from "../utils/imageUrl";
import CarDetails from "./CarDetails";
import dealerConfig from "../config/dealerConfig";

const API = "https://car-platform-db.onrender.com/api";

export default function AdminCars() {
const [cars, setCars] = useState([]);
const [loading, setLoading] = useState(false);
const [selectedCar, setSelectedCar] = useState(null);
const [editCar, setEditCar] = useState(null);
const [error, setError] = useState("");
const [detailsCar, setDetailsCar] = useState(null);

const loadCars = async () => {
    try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API}/cars`);

        if (!res.ok) {
            throw new Error(`Failed to load cars: ${res.status}`);
        }

        const data = await res.json();

        console.log("CARS:", data);

        setCars(Array.isArray(data?.cars) ? data.cars : []);
    } catch (err) {
        console.error("LOAD CARS ERROR:", err);
        setError(err?.message || "Failed to load cars.");
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    loadCars();
}, []);

const getCarImage = (car) => {
    const images = Array.isArray(car?.images)
        ? car.images
        : [];

    const front = images.find((img) => {
        return (
            String(img?.view_type || "").toUpperCase() === "FRONT" &&
            img?.image_url
        );
    });

    if (front?.image_url) {
        return getImageUrl(front.image_url);
    }

    const primary = images.find(
        (img) => img?.is_primary === true
    );

    if (primary?.image_url) {
        return getImageUrl(primary.image_url);
    }

    const uploaded = images.find((img) => {
        return String(img?.image_url || "").startsWith(
            "/uploads/cars/"
        );
    });

    if (uploaded?.image_url) {
        return getImageUrl(uploaded.image_url);
    }

    if (images[0]?.image_url) {
        return getImageUrl(images[0].image_url);
    }

    return "";
};

if (detailsCar) {
    return (
        <CarDetails
            car={detailsCar}
            onBack={() => {
                setDetailsCar(null);
                loadCars();
            }}
            onEdit={() => {
                setEditCar(detailsCar);
                setDetailsCar(null);
            }}
            onManageImages={() => {
                setSelectedCar(detailsCar);
                setDetailsCar(null);
            }}
        />
    );
}

if (selectedCar) {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f4f4f4",
                padding: "30px",
                boxSizing: "border-box",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <button
                type="button"
                onClick={() => {
                    setSelectedCar(null);
                    loadCars();
                }}
                style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "7px",
                    background: "#111",
                    color: "#fff",
                    cursor: "pointer",
                    marginBottom: "25px",
                }}
            >
                ← Back to Cars
            </button>

            <div
                style={{
                    background: "#fff",
                    padding: "25px",
                    borderRadius: "14px",
                    border: "1px solid #e5e5e5",
                }}
            >
                <p
                    style={{
                        margin: "0 0 8px",
                        color: "#999",
                        fontSize: "12px",
                        letterSpacing: "2px",
                    }}
                >
                    VEHICLE IMAGES
                </p>

                <h1
                    style={{
                        margin: "0 0 25px",
                        fontSize: "30px",
                    }}
                >
                    {selectedCar.brand_name || selectedCar.brand || ""}
                    {" "}
                    {selectedCar.model_name || selectedCar.model || ""}
                </h1>

                <AdminCarImages carId={selectedCar.id} />
            </div>
        </div>
    );
}

if (editCar) {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f4f4f4",
                padding: "30px",
                boxSizing: "border-box",
                fontFamily: "Arial, sans-serif",
            }}
        >

<button
    type="button"
    onClick={() => setDetailsCar(car)}
    style={{
        width: "100%",
        marginTop: "10px",
        padding: "11px",
        border: "1px solid #111",
        borderRadius: "7px",
        background: "#fff",
        color: "#111",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "12px",
    }}
>
    VIEW DETAILS
</button>
            <button
                type="button"
                onClick={() => {
                    setEditCar(null);
                    loadCars();
                }}
                style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "7px",
                    background: "#111",
                    color: "#fff",
                    cursor: "pointer",
                    marginBottom: "25px",
                }}
            >
                ← Back to Cars
            </button>

            <div
                style={{
                    background: "#fff",
                    borderRadius: "14px",
                    padding: "25px",
                    border: "1px solid #e5e5e5",
                }}
            >
                <EditCar
                    car={editCar}
                    back={() => {
                        setEditCar(null);
                        loadCars();
                    }}
                />
            </div>
        </div>
    );
}

return (
    <div
        style={{
            minHeight: "100vh",
            background: "#f4f4f4",
            padding: "35px",
            boxSizing: "border-box",
            fontFamily: "Arial, sans-serif",
        }}
    >
        <div
            style={{
                maxWidth: "1400px",
                margin: "0 auto",
            }}
        >
            <div
                style={{
                    background: "#111",
                    color: "#fff",
                    padding: "30px",
                    borderRadius: "16px",
                    marginBottom: "30px",
                }}
            >
                <p
                    style={{
                        margin: "0 0 8px",
                        color: "#aaa",
                        fontSize: "12px",
                        letterSpacing: "3px",
                    }}
                >
                    ADMIN PANEL
                </p>

                <h1
                    style={{
                        margin: 0,
                        fontSize: "36px",
                    }}
                >
                    Manage Cars
                </h1>

                <p
                    style={{
                        margin: "10px 0 0",
                        color: "#aaa",
                    }}
                >
                    Manage vehicles, images and listings.
                </p>
            </div>

            {error && (
                <div
                    style={{
                        padding: "14px 18px",
                        marginBottom: "25px",
                        background: "#ffebee",
                        color: "#c62828",
                        borderRadius: "9px",
                    }}
                >
                    {error}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "25px",
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "24px",
                        }}
                    >
                        Cars
                    </h2>

                    <p
                        style={{
                            margin: "6px 0 0",
                            color: "#888",
                            fontSize: "14px",
                        }}
                    >
                        {cars.length} vehicles
                    </p>
                </div>

                {loading && (
                    <span
                        style={{
                            color: "#777",
                            fontSize: "14px",
                        }}
                    >
                        Loading...
                    </span>
                )}
            </div>

            {!loading && cars.length === 0 && (
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "14px",
                        padding: "60px 20px",
                        textAlign: "center",
                        border: "1px solid #e5e5e5",
                    }}
                >
                    <h3>No cars found</h3>

                    <p
                        style={{
                            color: "#888",
                        }}
                    >
                        Add a car to see it here.
                    </p>
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "25px",
                }}
            >
                {cars.map((car) => {
                    const imageUrl = getCarImage(car);

                    const brand =
                        car.brand_name ||
                        car.brand ||
                        "";

                    const model =
                        car.model_name ||
                        car.model ||
                        "";

                    const price = car.price_aed
                        ? Number(car.price_aed).toLocaleString(
                              "en-US"
                          )
                        : "N/A";

                    return (
                        <div
                            key={car.id}
                            style={{
                                background: "#fff",
                                borderRadius: "14px",
                                overflow: "hidden",
                                border:
                                    "1px solid #e1e1e1",
                                boxShadow:
                                    "0 6px 20px rgba(0,0,0,0.06)",
                            }}
                        >
                            <div
                                style={{
                                    height: "210px",
                                    background: "#e9e9e9",
                                    overflow: "hidden",
                                }}
                            >
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={`${brand} ${model}`}
                                        onError={(event) => {
                                            event.currentTarget.style.display =
                                                "none";
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#999",
                                        }}
                                    >
                                        No Image
                                    </div>
                                )}
                            </div>

                            <div
                                style={{
                                    padding: "20px",
                                }}
                            >
                                <h3
                                    style={{
                                        margin:
                                            "0 0 8px",
                                        fontSize: "21px",
                                    }}
                                >
                                    {brand} {model}
                                </h3>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "1fr 1fr",
                                        gap: "12px",
                                        padding:
                                            "14px 0",
                                        borderTop:
                                            "1px solid #eee",
                                        borderBottom:
                                            "1px solid #eee",
                                    }}
                                >
                                    <div>
                                        <small
                                            style={{
                                                color: "#999",
                                            }}
                                        >
                                            YEAR
                                        </small>

                                        <div
                                            style={{
                                                fontWeight:
                                                    "600",
                                                marginTop:
                                                    "4px",
                                            }}
                                        >
                                            {car.year ||
                                                "-"}
                                        </div>
                                    </div>

                                    <div>
                                        <small
                                            style={{
                                                color: "#999",
                                            }}
                                        >
                                            PRICE
                                        </small>

                                        <div
                                            style={{
                                                fontWeight:
                                                    "700",
                                                marginTop:
                                                    "4px",
                                            }}
                                        >
                                            {price} {dealerConfig.currency}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                        marginTop: "18px",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedCar(
                                                car
                                            )
                                        }
                                        style={{
                                            flex: 1,
                                            padding:
                                                "11px 8px",
                                            border: "none",
                                            borderRadius:
                                                "7px",
                                            background:
                                                "#111",
                                            color: "#fff",
                                            cursor:
                                                "pointer",
                                            fontWeight:
                                                "600",
                                            fontSize:
                                                "12px",
                                        }}
                                    >
                                        MANAGE IMAGES
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditCar(
                                                car
                                            )
                                        }
                                        style={{
                                            flex: 1,
                                            padding:
                                                "11px 8px",
                                            border:
                                                "1px solid #ccc",
                                            borderRadius:
                                                "7px",
                                            background:
                                                "#fff",
                                            color:
                                                "#111",
                                            cursor:
                                                "pointer",
                                            fontWeight:
                                                "600",
                                            fontSize:
                                                "12px",
                                        }}
                                    >
                                        EDIT CAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);

}
