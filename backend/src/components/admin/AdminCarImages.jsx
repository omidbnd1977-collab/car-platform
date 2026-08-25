```jsx
import React, { useEffect, useState } from "react";

const API = "http://localhost:5000/api";
const SERVER = "http://localhost:5000";

const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "";

    if (
        imageUrl.startsWith("http://") ||
        imageUrl.startsWith("https://")
    ) {
        return imageUrl;
    }

    return `${SERVER}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};
const SERVER = "http://localhost:5000";

export default function AdminCarImages({ carId }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState("");
    const [message, setMessage] = useState("");

    // ---------------------------------------
    // ساخت URL صحیح برای عکس
    // ---------------------------------------
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) {
            return "";
        }

        const value = String(imageUrl).trim();

        // عکس‌های خارجی
        if (
            value.startsWith("http://") ||
            value.startsWith("https://")
        ) {
            return value;
        }

        // عکس‌های آپلود شده روی Backend
        if (value.startsWith("/uploads/")) {
            return `${SERVER}${value}`;
        }

        if (value.startsWith("uploads/")) {
            return `${SERVER}/${value}`;
        }

        return `${SERVER}/${value}`;
    };

    // ---------------------------------------
    // دریافت تصاویر
    // ---------------------------------------
    const loadImages = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                `${API}/cars/${carId}`
            );

            if (!res.ok) {
                throw new Error(
                    `HTTP ${res.status}`
                );
            }

            const data = await res.json();

            console.log(
                "CAR IMAGES:",
                data.car?.images
            );

            setImages(
                data.car?.images || []
            );
        } catch (error) {
            console.error(
                "LOAD IMAGES ERROR:",
                error
            );

            setMessage(
                "خطا در دریافت تصاویر"
            );
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------
    // Load هنگام باز شدن صفحه
    // ---------------------------------------
    useEffect(() => {
        if (carId) {
            loadImages();
        }
    }, [carId]);

    // ---------------------------------------
    // پیدا کردن تصویر
    // ---------------------------------------
    const getImage = (type) => {
        return images.find(
            (img) =>
                String(img.view_type || "")
                    .toUpperCase() === type
        );
    };

    // ---------------------------------------
    // آپلود تصویر
    // ---------------------------------------
    const uploadImage = async (type, event) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            setUploading(type);
            setMessage("");

            const formData = new FormData();

            formData.append(
                "image",
                file
            );

            formData.append(
                "view_type",
                type
            );

            console.log(
                "UPLOADING FILE:",
                file.name,
                file.type,
                file.size
            );

            const res = await fetch(
                `${API}/cars/${carId}/images/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await res.json();

            console.log(
                "UPLOAD:",
                data
            );

            if (!res.ok) {
                throw new Error(
                    data.message ||
                    "Upload failed"
                );
            }

            setMessage(
                "تصویر با موفقیت آپلود شد"
            );

            // بسیار مهم:
            // تصاویر را دوباره از Backend بخوان
            await loadImages();

        } catch (error) {
            console.error(
                "UPLOAD ERROR:",
                error
            );

            setMessage(
                "آپلود تصویر ناموفق بود"
            );
        } finally {
            setUploading("");

            // اجازه انتخاب دوباره همان فایل
            event.target.value = "";
        }
    };

    // ---------------------------------------
    // حذف تصویر
    // ---------------------------------------
    const deleteImage = async (imageId) => {
        if (
            !window.confirm(
                "Delete image?"
            )
        ) {
            return;
        }

        try {
            setMessage("");

            const res = await fetch(
                `${API}/cars/${carId}/images/${imageId}`,
                {
                    method: "DELETE",
                }
            );

            if (!res.ok) {
                throw new Error(
                    `Delete failed: ${res.status}`
                );
            }

            setMessage(
                "تصویر حذف شد"
            );

            await loadImages();

        } catch (error) {
            console.error(
                "DELETE ERROR:",
                error
            );

            setMessage(
                "حذف تصویر ناموفق بود"
            );
        }
    };

    // ---------------------------------------
    // Image Box
    // ---------------------------------------
    const ImageBox = ({
        title,
        type,
    }) => {
        const img = getImage(type);

        const imageUrl = img
            ? getImageUrl(
                img.image_url
            )
            : "";

        return (
            <div
                style={{
                    width: "340px",
                    minHeight: "350px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    padding: "15px",
                    textAlign: "center",
                    background: "#fff",
                    boxSizing: "border-box",
                }}
            >
                <h3>
                    {title}
                </h3>

                {img ? (
                    <>
                        {/* --------------------------------
                            کادر عکس
                        -------------------------------- */}
                        <div
                            style={{
                                width: "300px",
                                height: "220px",
                                margin: "0 auto 15px",
                                background:
                                    "#f1f1f1",
                                border:
                                    "1px solid #ccc",
                                borderRadius:
                                    "10px",
                                overflow:
                                    "hidden",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                            }}
                        >
                            <img
    key={img.id}
    src={getImageUrl(img.image_url)}
    alt={img.view_type || "Car image"}
    style={{
        display: "block",
        width: "260px",
        height: "180px",
        objectFit: "contain",
        background: "#eee",
        borderRadius: "10px",
        margin: "0 auto",
    }}
                                onLoad={(e) => {
                                    console.log(
                                        "IMAGE LOADED:",
                                        {
                                            src:
                                                e
                                                    .currentTarget
                                                    .src,
                                            width:
                                                e
                                                    .currentTarget
                                                    .naturalWidth,
                                            height:
                                                e
                                                    .currentTarget
                                                    .naturalHeight,
                                        }
                                    );
                                }}
                                onError={(e) => {
    console.error(
        "IMAGE ERROR:",
        e.currentTarget.src
    );

    e.currentTarget.style.display = "block";
    e.currentTarget.style.background = "#ffdddd";
}}
                            />
                        </div>

                        <p>
                            <strong>
                                {img.view_type}
                            </strong>
                        </p>

                        {/* نمایش URL برای اطمینان */}
                        <div
                            style={{
                                fontSize:
                                    "11px",
                                color:
                                    "#666",
                                wordBreak:
                                    "break-all",
                                margin:
                                    "10px 0",
                            }}
                        >
                            {imageUrl}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                deleteImage(
                                    img.id
                                )
                            }
                            style={{
                                padding:
                                    "8px 16px",
                                cursor:
                                    "pointer",
                            }}
                        >
                            Delete
                        </button>
                    </>
                ) : (
                    <div
                        style={{
                            width: "300px",
                            height: "220px",
                            margin:
                                "0 auto 15px",
                            background:
                                "#f1f1f1",
                            border:
                                "1px solid #ccc",
                            borderRadius:
                                "10px",
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                        }}
                    >
                        <p>
                            No Image
                        </p>
                    </div>
                )}

                <div
                    style={{
                        marginTop:
                            "15px",
                    }}
                >
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={
                            uploading ===
                            type
                        }
                        onChange={(e) =>
                            uploadImage(
                                type,
                                e
                            )
                        }
                    />
                </div>

                {uploading === type && (
                    <p>
                        Uploading...
                    </p>
                )}
            </div>
        );
    };

    // ---------------------------------------
    // Render
    // ---------------------------------------
    return (
        <div
            style={{
                padding: "30px",
                width: "100%",
                boxSizing:
                    "border-box",
            }}
        >
            <h2>
                Car Images Manager
            </h2>

            {message && (
                <div
                    style={{
                        marginBottom:
                            "20px",
                        padding:
                            "12px 15px",
                        borderRadius:
                            "8px",
                        background:
                            "#eef7ee",
                        border:
                            "1px solid #b8d8b8",
                    }}
                >
                    {message}
                </div>
            )}

            {loading && (
                <p>
                    Loading images...
                </p>
            )}

            <div
                style={{
                    display:
                        "flex",
                    gap: "20px",
                    flexWrap:
                        "wrap",
                    alignItems:
                        "flex-start",
                }}
            >
                <ImageBox
                    title="Front View"
                    type="FRONT"
                />

                <ImageBox
                    title="Rear View"
                    type="REAR"
                />

                <ImageBox
                    title="Interior"
                    type="INTERIOR"
                />

                <ImageBox
                    title="Side View"
                    type="SIDE"
                />

                <ImageBox
                    title="Main View"
                    type="MAIN"
                />
            </div>
        </div>
    );
}
```
