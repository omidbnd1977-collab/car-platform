import React, { useMemo, useState } from "react";
import { getImageUrl } from "../utils/imageUrl";
import dealerConfig from "../config/dealerConfig";

const PLACEHOLDER_IMAGE =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E";

function CarDetails({ car, onBack }) {
    const [language, setLanguage] = useState("fa");

    const isFa = language === "fa";

    const labels = isFa
        ? {
              back: "← بازگشت به خودروها",
              premium: "خودروی ویژه",
              year: "سال",
              gallery: "گالری خودرو",
              front: "جلو",
              side: "بغل",
              rear: "عقب",
              interior: "داخل کابین",
              price: "قیمت",
              location: "موقعیت",
              dealer: "نمایندگی / فروشنده",
              status: "وضعیت",
              brand: "برند",
              model: "مدل",
              shipping: "هزینه حمل",
              customs: "هزینه گمرک",
              customsBuyer: "بعهده خریدار",
              description: "توضیحات",
              information: "اطلاعات خودرو",
              vehicleId: "شناسه خودرو",
              photoCategories: "دسته‌بندی تصاویر",
              noImage: "تصویری موجود نیست",
              active: "فعال",
             
              english: "English",
              persian: "فارسی",
          }
        : {
              back: "← BACK TO VEHICLES",
              premium: "PREMIUM VEHICLE",
              year: "YEAR",
              gallery: "VEHICLE GALLERY",
              front: "FRONT",
              side: "SIDE",
              rear: "REAR",
              interior: "INTERIOR",
              price: "PRICE",
              location: "LOCATION",
              dealer: "DEALER",
              status: "STATUS",
              brand: "BRAND",
              model: "MODEL",
              shipping: "SHIPPING COST",
              customs: "CUSTOMS COST",
              customsBuyer: "Buyer responsibility",
              description: "DESCRIPTION",
              information: "VEHICLE INFORMATION",
              vehicleId: "VEHICLE ID",
              photoCategories: "PHOTO CATEGORIES",
              noImage: "NO IMAGE",
              active: "ACTIVE",
             
              english: "English",
              persian: "فارسی",
          };

    const images = Array.isArray(car?.images)
        ? car.images
        : [];

    const gallery = useMemo(
        () => {
            const sortedImages = images
    .filter((img) => {
        const imageUrl = String(img?.image_url || "").trim();
        return imageUrl.length > 0;
    })
    .sort((a, b) => {
                    const aPrimary =
                        String(a?.id) === String(car?.primary_image_id);
                    const bPrimary =
                        String(b?.id) === String(car?.primary_image_id);

                    if (aPrimary && !bPrimary) return -1;
                    if (!aPrimary && bPrimary) return 1;

                    return (
                        Number(a?.sort_order || 0) -
                        Number(b?.sort_order || 0)
                    );
                });

            return sortedImages.map((img, index) => {
                const viewType =
                    String(img?.view_type || "").toUpperCase();

                let label;

                if (viewType === "INTERIOR") {
                    label = labels.interior;
                } else if (
                    String(img?.id) ===
                    String(car?.primary_image_id)
                ) {
                    label = isFa ? "تصویر اصلی" : "MAIN IMAGE";
                } else if (viewType === "FRONT") {
                    label = labels.front;
                } else if (viewType === "SIDE") {
                    label = labels.side;
                } else if (viewType === "REAR") {
                    label = labels.rear;
                } else {
                    label = isFa
                        ? "تصویر" 
                        : "IMAGE";
                }

                return {
                    key: String(img.id),
                    label,
                    image: getImageUrl(img.image_url),
                };
            });
        },
        [
            images,
            car?.primary_image_id,
            isFa,
            labels.front,
            labels.side,
            labels.rear,
            labels.interior,
        ]
    );

    const primaryImage =
    images.find(
        (img) =>
            String(img?.id) ===
            String(car?.primary_image_id) &&
            img?.image_url
    )?.image_url;

const firstImage =
    (primaryImage && getImageUrl(primaryImage)) ||
    gallery.find((item) => item.image)?.image ||
    PLACEHOLDER_IMAGE;

const [activeImage, setActiveImage] =
    useState(firstImage);
    const brand =
        car?.brand_name ||
        car?.brand ||
        "-";

    const model =
        car?.model_name ||
        car?.model ||
        "-";

    const year =
        car?.year ||
        "-";

    const price = car?.price_aed
        ? Number(car.price_aed).toLocaleString("en-US")
        : "N/A";

    const shippingCost = car?.shipping_cost
        ? Number(car.shipping_cost).toLocaleString("en-US")
        : "0";

    const description =
        car?.description ||
        (isFa
            ? "توضیحاتی برای این خودرو ثبت نشده است."
            : "No description available for this vehicle.");

    const status =
        String(car?.status || "").toUpperCase() === "ACTIVE"
            ? labels.active
            : car?.status || "-";

    const direction = isFa ? "rtl" : "ltr";

    return (
        <div
            dir={direction}
            style={{
                minHeight: "100vh",
                background:
                    "linear-gradient(180deg, #050505 0%, #0b0b0b 100%)",
                color: "#fff",
                fontFamily: isFa
                    ? "Tahoma, Arial, sans-serif"
                    : "Arial, Helvetica, sans-serif",
                padding: "24px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    maxWidth: "1250px",
                    margin: "0 auto",
                }}
            >
                {/* TOP BAR */}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "15px",
                        marginBottom: "25px",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            if (onBack) {
                                onBack();
                            } else {
                                window.history.back();
                            }
                        }}
                        style={{
                            padding: "13px 20px",
                            border: "1px solid rgba(255,255,255,0.16)",
                            borderRadius: "10px",
                            background: "#fff",
                            color: "#050505",
                            cursor: "pointer",
                            fontSize: isFa ? "15px" : "14px",
                            fontWeight: 800,
                            fontFamily: isFa
                                ? "Tahoma, Arial, sans-serif"
                                : "Arial, Helvetica, sans-serif",
                        }}
                    >
                        {labels.back}
                    </button>

                    <div
                        style={{
                            display: "flex",
                            gap: "6px",
                            padding: "4px",
                            background: "#151515",
                            border: "1px solid #292929",
                            borderRadius: "10px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setLanguage("fa")}
                            style={{
                                border: "none",
                                borderRadius: "7px",
                                padding: "8px 13px",
                                cursor: "pointer",
                                background:
                                    language === "fa"
                                        ? "#d4af37"
                                        : "transparent",
                                color:
                                    language === "fa"
                                        ? "#050505"
                                        : "#aaa",
                                fontWeight: 800,
                                fontSize: "12px",
                            }}
                        >
                            {labels.persian}
                        </button>

                        <button
                            type="button"
                            onClick={() => setLanguage("en")}
                            style={{
                                border: "none",
                                borderRadius: "7px",
                                padding: "8px 13px",
                                cursor: "pointer",
                                background:
                                    language === "en"
                                        ? "#d4af37"
                                        : "transparent",
                                color:
                                    language === "en"
                                        ? "#050505"
                                        : "#aaa",
                                fontWeight: 800,
                                fontSize: "12px",
                            }}
                        >
                            {labels.english}
                        </button>
                    </div>
                </div>

                {/* HEADER */}

                <section
                    style={{
                        background:
                            "linear-gradient(135deg, #111 0%, #090909 100%)",
                        border:
                            "1px solid rgba(212,175,55,0.18)",
                        borderRadius: "22px",
                        padding: "28px",
                        marginBottom: "22px",
                        boxShadow:
                            "0 20px 60px rgba(0,0,0,0.35)",
                    }}
                >
                    <div
                        style={{
                            color: "#d4af37",
                            fontSize: isFa ? "14px" : "11px",
                            fontWeight: 900,
                            letterSpacing: isFa ? "0" : "2px",
                            marginBottom: "10px",
                        }}
                    >
                        {labels.premium}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: "12px",
                            flexWrap: "wrap",
                        }}
                    >
                        <h1
                            style={{
                                margin: 0,
                                fontSize: isFa ? "36px" : "42px",
                                lineHeight: 1,
                                fontWeight: 900,
                            }}
                        >
                            {brand}
                        </h1>

                        <span
                            style={{
                                color: "#777",
                                fontSize: "28px",
                            }}
                        >
                            /
                        </span>

                        <h2
                            style={{
                                margin: 0,
                                fontSize: isFa ? "30px" : "36px",
                                lineHeight: 1,
                                fontWeight: 800,
                            }}
                        >
                            {model}
                        </h2>

                        <div
                            style={{
                                marginLeft: isFa ? "0" : "auto",
                                marginRight: isFa ? "auto" : "0",
                                padding: "9px 13px",
                                borderRadius: "8px",
                                background: "#d4af37",
                                color: "#050505",
                                fontSize: "14px",
                                fontWeight: 900,
                            }}
                        >
                            {year}
                        </div>
                    </div>
                </section>

                {/* GALLERY */}

                <section
                    style={{
                        background: "#0d0d0d",
                        border:
                            "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "22px",
                        padding: "22px",
                        marginBottom: "22px",
                    }}
                >
                    <div
                        style={{
                            fontSize: isFa ? "17px" : "12px",
                            fontWeight: 900,
                            letterSpacing: isFa ? "0" : "2px",
                            color: "#aaa",
                            marginBottom: "15px",
                        }}
                    >
                        {labels.gallery}
                    </div>

                    <div
    style={{
        width: "100%",
        height: "clamp(280px, 60vw, 500px)",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#050505",
        marginBottom: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }}
>
                        <img
                            src={activeImage}
                            alt={`${brand} ${model}`}
                            onError={(e) => {
                                if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
                                    e.currentTarget.src =
                                        PLACEHOLDER_IMAGE;
                                }
                            }}
                            style={{
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
}}
                        />
                    </div>

                    <div
    style={{
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "10px",
        width: "100%",
    }}
>
                        {gallery.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                    if (item.image) {
                                        setActiveImage(item.image);
                                    }
                                }}
                                style={{
                                    position: "relative",
                                    height: "clamp(85px, 18vw, 110px)",
                                    border:
                                        activeImage === item.image
                                            ? "2px solid #d4af37"
                                            : "1px solid #292929",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    padding: 0,
                                    background: "#111",
                                    cursor: item.image
                                        ? "pointer"
                                        : "default",
                                }}
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                "none";
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : null}

                                

                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        padding: "8px",
                                        background:
                                            "linear-gradient(transparent, rgba(0,0,0,.85))",
                                        color: "#fff",
                                        fontSize: isFa
                                            ? "13px"
                                            : "11px",
                                        fontWeight: 800,
                                    }}
                                >
                                    {item.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* INFORMATION */}

                <section
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(0, 1fr) minmax(280px, 360px)",
                        gap: "22px",
                        alignItems: "start",
                    }}
                >
                    <div
                        style={{
                            background: "#0d0d0d",
                            border:
                                "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "22px",
                            padding: "25px",
                        }}
                    >
                        {/* PRICE */}

                        <div
                            style={{
                                paddingBottom: "22px",
                                marginBottom: "22px",
                                borderBottom:
                                    "1px solid #252525",
                            }}
                        >
                            <div
                                style={{
                                    color: "#777",
                                    fontSize: isFa ? "14px" : "11px",
                                    fontWeight: 800,
                                    letterSpacing: isFa ? "0" : "2px",
                                    marginBottom: "7px",
                                }}
                            >
                                {labels.price}
                            </div>

                            <div
                                style={{
                                    fontSize: isFa ? "32px" : "34px",
                                    fontWeight: 900,
                                    color: "#fff",
                                }}
                            >
                                {price}

                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "#888",
                                        marginLeft: "7px",
                                    }}
                                >
                                    {dealerConfig.currency}
                                </span>
                            </div>
                        </div>

                        {/* BASIC INFO */}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(2, minmax(0, 1fr))",
                                gap: "18px",
                            }}
                        >
                            <Info
                                label={labels.location}
                               value={
    isFa
        ? `${dealerConfig.cityFa}, ${dealerConfig.countryFa}`
        : `${dealerConfig.cityEn}, ${dealerConfig.countryEn}`
}
                                isFa={isFa}
                            />

                            <Info
                                label={labels.dealer}
                                value={dealerConfig.name}
                                isFa={isFa}
                            />

                            <Info
                                label={labels.status}
                                value={status}
                                isFa={isFa}
                            />

                            <Info
                                label={labels.year}
                                value={year}
                                isFa={isFa}
                            />

                            <Info
                                label={labels.brand}
                                value={brand}
                                isFa={isFa}
                            />

                            <Info
                                label={labels.model}
                                value={model}
                                isFa={isFa}
                            />

                            <Info
                                label={labels.vehicleId}
                                value={car?.id ?? "-"}
                                isFa={isFa}
                            />
                        </div>

                        {/* DESCRIPTION */}

                        <div
                            style={{
                                marginTop: "25px",
                                paddingTop: "22px",
                                borderTop:
                                    "1px solid #252525",
                            }}
                        >
                            <div
                                style={{
                                    color: "#777",
                                    fontSize: isFa ? "14px" : "11px",
                                    fontWeight: 800,
                                    letterSpacing: isFa ? "0" : "2px",
                                    marginBottom: "10px",
                                }}
                            >
                                {labels.description}
                            </div>

                            <div
                                style={{
                                    color: "#ddd",
                                    fontSize: isFa ? "17px" : "15px",
                                    lineHeight: 1.9,
                                }}
                            >
                                {description}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT INFORMATION */}

                    <aside
                        style={{
                            background: "#0d0d0d",
                            border:
                                "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "22px",
                            padding: "25px",
                        }}
                    >
                        <div
                            style={{
                                fontSize: isFa ? "18px" : "13px",
                                fontWeight: 900,
                                letterSpacing: isFa ? "0" : "2px",
                                marginBottom: "20px",
                                color: "#fff",
                            }}
                        >
                            {labels.information}
                        </div>

                        <DetailRow
                            label={labels.brand}
                            value={brand}
                            isFa={isFa}
                        />

                        <DetailRow
                            label={labels.model}
                            value={model}
                            isFa={isFa}
                        />

                        <DetailRow
                            label={labels.year}
                            value={year}
                            isFa={isFa}
                        />

                        <DetailRow
                            label={labels.location}
                          value={
    isFa
        ? `${dealerConfig.cityFa}, ${dealerConfig.countryFa}`
        : `${dealerConfig.cityEn}, ${dealerConfig.countryEn}`
}
                            isFa={isFa}
                        />

                        <DetailRow
                            label={labels.dealer}
                            value={dealerConfig.name}
                            isFa={isFa}
                        />

                        <DetailRow
                            label={labels.status}
                            value={status}
                            isFa={isFa}
                        />

                        <DetailRow
                            label={labels.price}
                            value={`${price} ${dealerConfig.currency}`}
                            isFa={isFa}
                        />

                        <DetailRow
                            label={labels.vehicleId}
                            value={car?.id ?? "-"}
                            isFa={isFa}
                        />

                        <DetailRow
                            label={labels.shipping}
                            value={`${shippingCost} ${dealerConfig.currency}`}
                            isFa={isFa}
                        />

                        <DetailRow
                            label={labels.customs}
                            value={labels.customsBuyer}
                            isFa={isFa}
                        />
                    </aside>
                </section>

                {/* PHOTO CATEGORIES */}

                <section
                    style={{
                        marginTop: "22px",
                        background: "#0d0d0d",
                        border:
                            "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "22px",
                        padding: "25px",
                    }}
                >
                    <div
                        style={{
                            color: "#777",
                            fontSize: isFa ? "15px" : "11px",
                            fontWeight: 900,
                            letterSpacing: isFa ? "0" : "2px",
                            marginBottom: "16px",
                        }}
                    >
                        {labels.photoCategories}
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(4, minmax(0, 1fr))",
                            gap: "12px",
                        }}
                    >
                        {gallery.map((item) => (
                            <div
                                key={`category-${item.key}`}
                                style={{
                                    padding: "15px",
                                    border:
                                        "1px solid #252525",
                                    borderRadius: "12px",
                                    background: "#111",
                                }}
                            >
                                <div
                                    style={{
                                        color: "#d4af37",
                                        fontSize: isFa
                                            ? "15px"
                                            : "11px",
                                        fontWeight: 900,
                                        marginBottom: "7px",
                                    }}
                                >
                                    {item.label}
                                </div>

                                <div
                                    style={{
                                        color: item.image
                                            ? "#ddd"
                                            : "#666",
                                        fontSize: isFa
                                            ? "14px"
                                            : "12px",
                                    }}
                                >
                                    {item.image
                                        ? isFa
                                            ? "تصویر موجود است"
                                            : "IMAGE AVAILABLE"
                                        : labels.noImage}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function Info({ label, value, isFa }) {
    return (
        <div style={{ minWidth: 0 }}>
            <div
                style={{
                    color: "#777",
                    fontSize: isFa ? "13px" : "10px",
                    fontWeight: 800,
                    letterSpacing: isFa ? "0" : "1.5px",
                    marginBottom: "6px",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    color: "#eee",
                    fontSize: isFa ? "17px" : "14px",
                    fontWeight: 700,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                }}
            >
                {value}
            </div>
        </div>
    );
}

function DetailRow({ label, value, isFa }) {
    return (
        <div
            style={{
                padding: "13px 0",
                borderBottom: "1px solid #222",
            }}
        >
            <div
                style={{
                    color: "#777",
                    fontSize: isFa ? "13px" : "10px",
                    fontWeight: 800,
                    letterSpacing: isFa ? "0" : "1.4px",
                    marginBottom: "5px",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    color: "#eee",
                    fontSize: isFa ? "16px" : "13px",
                    fontWeight: 700,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                }}
            >
                {value}
            </div>
        </div>
    );
}

export default CarDetails;

