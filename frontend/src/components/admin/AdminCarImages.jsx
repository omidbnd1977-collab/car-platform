import React, { useEffect, useState } from "react";
import { getImageUrl } from "../../utils/imageUrl";
import { adminHeaders } from "../../utils/adminAuth";

const API =
    import.meta.env.VITE_API_URL ||
    "https://car-platform-db.onrender.com/api";

// ------------------------------------------------------------
// خواندن پیام واقعی خطا از پاسخ سرور
// ------------------------------------------------------------
// بک‌اند همه‌ی خطاها را به‌صورت JSON و با کلید "error"
// برمی‌گرداند (مثلاً «File too large» یا «Only image files
// are allowed»). اگر هم پاسخ JSON نباشد (خطای ۵۰۲ پراکسی یا
// صفحه‌ی HTML) همان متن/کد وضعیت را نشان می‌دهیم تا اپراتور
// واقعاً بداند چه شده است.
// ------------------------------------------------------------
async function readResponseError(res, preReadText, preParsed) {
    let text = preReadText;

    if (text === undefined) {
        try {
            text = await res.text();
        } catch {
            text = "";
        }
    }

    if (preParsed && typeof preParsed === "object") {
        const early = preParsed.error || preParsed.message;

        if (early) {
            return String(early);
        }
    }

    let parsed = null;

    if (text) {
        try {
            parsed = JSON.parse(text);
        } catch {
            parsed = null;
        }
    }

    if (parsed && typeof parsed === "object") {
        const serverMessage =
            parsed.error ||
            parsed.message ||
            parsed.details ||
            (typeof parsed.error === "object"
                ? parsed.error.message
                : "");

        if (serverMessage) {
            return String(serverMessage);
        }
    }

    const looksLikeHtml = /<\s*(html|body|!doctype)/i.test(text);

    if (text && !looksLikeHtml) {
        return text.trim().slice(0, 300);
    }

    if (res.status === 413) {
        return "حجم فایل بیش از حد مجاز سرور است (۱۵ مگابایت).";
    }

    return `خطای سرور با کد ${res.status}`;
}

export default function AdminCarImages({ carId }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    // پیام سبز برای موفقیت و قرمز برای خطا
    const showMessage = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);
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
                    await readResponseError(res)
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

            showMessage(
                "خطا در دریافت تصاویر: " +
                    (error?.message || "خطای نامشخص"),
                "error"
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
                    // اگر ADMIN_API_KEY روی سرور ست شده باشد، آپلود
                    // بدون این هدر با ۴۰۱ رد می‌شود.
                    headers: adminHeaders(),
                    body: formData,
                }
            );

            // مهم: پاسخ ممکن است JSON نباشد، پس اول متن خام
            // را می‌خوانیم و بعد تلاش می‌کنیم پارسش کنیم.
            const rawText = await res.text();
            let data = null;

            try {
                data = rawText ? JSON.parse(rawText) : null;
            } catch {
                data = null;
            }

            console.log(
                "UPLOAD:",
                res.status,
                data || rawText
            );

            if (!res.ok) {
                throw new Error(
                    await readResponseError(res, rawText, data)
                );
            }

            showMessage(
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

            // خطای شبکه (سرور بالا نیست / CORS / قطع اینترنت)
            // با خطای پاسخ سرور فرق دارد:
            const reason =
                error instanceof TypeError
                    ? "سرور پاسخ نداد (خطای شبکه)"
                    : error?.message || "خطای نامشخص";

            showMessage(
                "آپلود تصویر ناموفق بود: " + reason,
                "error"
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
                    headers: adminHeaders(),
                }
            );

            if (!res.ok) {
                throw new Error(
                    "Delete failed: " +
                        (await readResponseError(res))
                );
            }

            showMessage(
                "تصویر حذف شد"
            );

            await loadImages();

        } catch (error) {
            console.error(
                "DELETE ERROR:",
                error
            );

            showMessage(
                "حذف تصویر ناموفق بود: " +
                    (error?.message || "خطای نامشخص"),
                "error"
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
                    <div
                        style={{
                            fontSize:
                                "11px",
                            color:
                                "#666",
                            marginBottom:
                                "6px",
                        }}
                    >
                        حداکثر ۱۵ مگابایت — jpg, png, webp, gif
                    </div>

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
                    role={
                        messageType === "error"
                            ? "alert"
                            : "status"
                    }
                    style={{
                        marginBottom:
                            "20px",
                        padding:
                            "12px 15px",
                        borderRadius:
                            "8px",
                        whiteSpace:
                            "pre-wrap",
                        wordBreak:
                            "break-word",
                        background:
                            messageType === "error"
                                ? "#fdecec"
                                : "#eef7ee",
                        border:
                            messageType === "error"
                                ? "1px solid #e5b4b4"
                                : "1px solid #b8d8b8",
                        color:
                            messageType === "error"
                                ? "#8a1f1f"
                                : "#1f5c25",
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
