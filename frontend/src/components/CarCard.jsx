import React from "react";
import { getImageUrl } from "../utils/imageUrl";
import dealerConfig from "../config/dealerConfig";

function CarCard({
    car,
    onViewDetails,
    onContactRequest,
}) {
    const image =
        car?.images?.length > 0 &&
        car.images[0]?.image_url
            ? getImageUrl(car.images[0].image_url)
            : "/car-placeholder.jpg";

    const brand =
        car?.brand_name ||
        car?.brand ||
        "";

    const model =
        car?.model_name ||
        car?.model ||
        "";

    const price = car?.price_aed
        ? Number(car.price_aed).toLocaleString("en-US")
        : "N/A";

    const location =
    car?.city ||
    dealerConfig.city;

    const handleContactRequest = () => {
        if (onContactRequest) {
            onContactRequest(car);
            return;
        }

        alert("درخواست تماس / بازدید شما ثبت خواهد شد.");
    };

    return (
        <div
            style={{
                width: "100%",
                minWidth: 0,

                background:
                    "linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)",

                borderRadius: "20px",
                overflow: "hidden",

                border:
                    "1px solid rgba(255,255,255,0.75)",

                boxShadow:
                    "0 10px 35px rgba(0,0,0,0.08)",

                transition:
                    "transform 0.45s cubic-bezier(.22,1,.36,1), box-shadow 0.45s cubic-bezier(.22,1,.36,1)",

                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",

                animation:
                    "carCardReveal 0.7s cubic-bezier(.22,1,.36,1) both",

                position: "relative",
            }}

            onMouseEnter={(event) => {
                event.currentTarget.style.transform =
                    "translateY(-10px) scale(1.012)";

                event.currentTarget.style.boxShadow =
                    "0 24px 55px rgba(0,0,0,0.18)";
            }}

            onMouseLeave={(event) => {
                event.currentTarget.style.transform =
                    "translateY(0) scale(1)";

                event.currentTarget.style.boxShadow =
                    "0 10px 35px rgba(0,0,0,0.08)";
            }}
        >
            {/* IMAGE */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "245px",
                    background: "#eeeeee",
                    overflow: "hidden",
                }}
            >
                <img
                    src={image}
                    alt={`${brand} ${model}`}

                    onError={(event) => {
                        event.currentTarget.src =
                            "/car-placeholder.jpg";
                    }}

                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",

                        transition:
                            "transform 0.8s cubic-bezier(.22,1,.36,1), filter 0.8s ease",
                    }}

                    onMouseEnter={(event) => {
                        event.currentTarget.style.transform =
                            "scale(1.055)";

                        event.currentTarget.style.filter =
                            "brightness(1.04) contrast(1.02)";
                    }}

                    onMouseLeave={(event) => {
                        event.currentTarget.style.transform =
                            "scale(1)";

                        event.currentTarget.style.filter =
                            "brightness(1) contrast(1)";
                    }}
                />

                {/* SUBTLE LIGHT */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",

                        background:
                            "linear-gradient(120deg, rgba(255,255,255,0.14), transparent 35%, transparent 70%, rgba(255,255,255,0.06))",

                        opacity: 0.7,
                    }}
                />

                {/* DARK IMAGE GRADIENT */}
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "35%",

                        background:
                            "linear-gradient(to top, rgba(0,0,0,0.42), transparent)",

                        pointerEvents: "none",
                    }}
                />

                {/* YEAR */}
                {car?.year && (
                    <div
                        style={{
                            position: "absolute",
                            top: "16px",
                            left: "16px",

                            background:
                                "rgba(0,0,0,0.72)",

                            color: "#fff",

                            padding: "7px 12px",
                            borderRadius: "20px",

                            fontSize: "12px",
                            fontWeight: "700",
                            letterSpacing: "0.5px",

                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",

                            border:
                                "1px solid rgba(255,255,255,0.16)",
                        }}
                    >
                        {car.year}
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <div
                style={{
                    padding: "24px",
                }}
            >
                {/* PREMIUM LABEL */}
                <div
                    style={{
                        color: "#999",
                        fontSize: "10px",
                        fontWeight: "800",
                        letterSpacing: "2.2px",
                        marginBottom: "8px",
                    }}
                >
                    PREMIUM VEHICLE
                </div>

                {/* TITLE */}
                <h2
                    style={{
                        margin: "0 0 14px",
                        fontSize: "24px",
                        lineHeight: "1.2",
                        color: "#111",
                        fontWeight: "750",
                    }}
                >
                    {brand} {model}
                </h2>

                {/* PRICE */}
                <div
                    style={{
                        marginBottom: "20px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "10px",
                            color: "#999",
                            letterSpacing: "1.7px",
                            marginBottom: "5px",
                            fontWeight: "700",
                        }}
                    >
                        PRICE
                    </div>

                    <div
                        style={{
                            fontSize: "24px",
                            fontWeight: "850",
                            color: "#111",
                            letterSpacing: "-0.4px",
                        }}
                    >
                        {price} {dealerConfig.currency}
                    </div>
                    <div
    style={{
        marginTop: "7px",
        color: "#888",
        fontSize: "9px",
        fontWeight: 500,
        letterSpacing: "0.3px",
        lineHeight: 1.5,
        whiteSpace: "nowrap",
    }}
>
    قیمت شامل هزینه لندیکرافت از مبدأ می‌باشد
</div>
                </div>

                {/* DETAILS */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",

                        paddingTop: "16px",

                        borderTop:
                            "1px solid #e9e9e9",
                    }}
                >
                    {/* LOCATION */}
                    <div
                        style={{
                            color: "#555",
                            fontSize: "14px",
                        }}
                    >
                        📍 {location}
                    </div>

                    {/* DEALERSHIP */}
                    <div
                        style={{
                            color: "#555",
                            fontSize: "14px",
                        }}
                    >
                        🏢 {dealerConfig.name}
                    </div>
                </div>

                {/* ACTIONS */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "9px",
                        marginTop: "22px",
                    }}
                >
                    {/* VIEW DETAILS */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onViewDetails) {
                                onViewDetails(car);
                            }
                        }}

                        style={{
                            width: "100%",

                            padding: "14px",

                            border:
                                "1px solid #111",

                            borderRadius: "10px",

                            background: "#111",
                            color: "#fff",

                            fontSize: "12px",
                            fontWeight: "800",
                            letterSpacing: "1.3px",

                            cursor: "pointer",

                            transition:
                                "background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
                        }}

                        onMouseEnter={(event) => {
                            event.currentTarget.style.background =
                                "#222";

                            event.currentTarget.style.transform =
                                "translateY(-2px)";

                            event.currentTarget.style.boxShadow =
                                "0 8px 22px rgba(0,0,0,0.18)";
                        }}

                        onMouseLeave={(event) => {
                            event.currentTarget.style.background =
                                "#111";

                            event.currentTarget.style.transform =
                                "translateY(0)";

                            event.currentTarget.style.boxShadow =
                                "none";
                        }}
                    >
                        VIEW DETAILS
                    </button>

                    {/* CONTACT / VISIT */}
                    <button
                        type="button"
                        onClick={handleContactRequest}

                        style={{
                            width: "100%",

                            padding: "13px 14px",

                            border:
                                "1px solid #c9a45c",

                            borderRadius: "10px",

                            background:
                                "linear-gradient(135deg, #c9a45c, #a9823f)",

                            color: "#fff",

                            fontSize: "12px",
                            fontWeight: "800",
                            letterSpacing: "1px",

                            cursor: "pointer",

                            transition:
                                "transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease",
                        }}

                        onMouseEnter={(event) => {
                            event.currentTarget.style.transform =
                                "translateY(-2px)";

                            event.currentTarget.style.boxShadow =
                                "0 9px 25px rgba(169,130,63,0.28)";

                            event.currentTarget.style.filter =
                                "brightness(1.06)";
                        }}

                        onMouseLeave={(event) => {
                            event.currentTarget.style.transform =
                                "translateY(0)";

                            event.currentTarget.style.boxShadow =
                                "none";

                            event.currentTarget.style.filter =
                                "brightness(1)";
                        }}
                    >
                        تماس / درخواست بازدید
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CarCard;
