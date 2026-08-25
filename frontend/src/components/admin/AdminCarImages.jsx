
import React, { useEffect, useState } from "react";
import { getImageUrl } from "../../utils/imageUrl";

const API = "http://localhost:5000/api";

const IMAGE_TYPES = [
    {
        type: "FRONT",
        title: "Front View",
    },
    {
        type: "REAR",
        title: "Rear View",
    },
    {
        type: "INTERIOR",
        title: "Interior",
    },
    {
        type: "MAIN",
        title: "Main Image",
    },
];

export default function AdminCarImages({ carId }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState("");
    const [error, setError] = useState("");

    const loadImages = async () => {
        if (!carId) return;

        try {
            setLoading(true);
            setError("");

            const res = await fetch(`${API}/cars/${carId}`);

            if (!res.ok) {
                throw new Error(
                    `Failed to load car images: ${res.status}`
                );
            }

            const data = await res.json();

            const carImages = data?.car?.images || [];

            console.log("CAR IMAGES:", carImages);

            setImages(carImages);
        } catch (err) {
            console.error("LOAD IMAGES ERROR:", err);
            setError("Failed to load car images.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadImages();
    }, [carId]);

    const getImage = (type) => {
        if (!images.length) return undefined;

        return images.find(
            (img) =>
                String(img?.view_type || "").toUpperCase() ===
                type.toUpperCase()
        );
    };

    const uploadImage = async (type, event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            setUploading(type);
            setError("");

            const formData = new FormData();

            formData.append("image", file);
            formData.append("view_type", type);

            const res = await fetch(
                `${API}/cars/${carId}/images/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await res.json();

            console.log("UPLOAD:", data);

            if (!res.ok) {
                throw new Error(
                    data?.message ||
                        `Upload failed: ${res.status}`
                );
            }

            /*
             * Immediately add the newly uploaded image to state.
             * This makes the image appear without depending only
             * on a second API request.
             */
            if (data?.image_id && data?.image_url) {
                const newImage = {
                    id: data.image_id,
                    image_url: data.image_url,
                    view_type: data.view_type || type,
                    sort_order: data.sort_order ?? 0,
                    is_primary: type === "FRONT",
                };

                setImages((current) => {
                    const filtered = current.filter(
                        (img) =>
                            !(
                                String(img?.view_type || "").toUpperCase() ===
                                    type.toUpperCase()
                            )
                    );

                    return [...filtered, newImage];
                });
            }

            /*
             * Reload from backend as well so the frontend state
             * remains synchronized with the database.
             */
            await loadImages();
        } catch (err) {
            console.error("UPLOAD ERROR:", err);
            setError(
                err?.message || "Image upload failed."
            );
        } finally {
            setUploading("");
            event.target.value = "";
        }
    };

    const deleteImage = async (imageId) => {
if (!imageId) return;

const confirmed = window.confirm(
    "Are you sure you want to delete this image?"
);

if (!confirmed) {
    return;
}

try {
    setError("");

    const res = await fetch(
        `${API}/cars/${carId}/images/${imageId}`,
        {
            method: "DELETE",
        }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(
            data?.message ||
                `Delete failed: ${res.status}`
        );
    }

    setImages((current) =>
        current.filter(
            (img) => String(img.id) !== String(imageId)
        )
    );

    await loadImages();
} catch (err) {
    console.error("DELETE IMAGE ERROR:", err);

    setError(
        err?.message || "Failed to delete image."
    );
}

};

const ImageBox = ({ title, type }) => {
const image = getImage(type);

const originalUrl = image?.image_url || "";

const imageUrl = originalUrl
    ? getImageUrl(originalUrl)
    : "";

console.log("IMAGE BOX:", {
    type,
    image,
    originalUrl,
    imageUrl,
});

return (
    <div
        style={{
            width: "300px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "15px",
            background: "#fff",
            boxSizing: "border-box",
        }}
    >
        <h3
            style={{
                marginTop: 0,
                marginBottom: "15px",
            }}
        >
            {title}
        </h3>
                <div
                    style={{
                        width: "100%",
                        height: "200px",
                        borderRadius: "10px",
                        background: "#f2f2f2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        marginBottom: "12px",
                    }}
                >
                    {imageUrl ? (
                        <img
                            key={`${image.id}-${imageUrl}`}
                            src={imageUrl}
                            alt={
                                image.view_type ||
                                `${type} car image`
                            }
                            style={{
                                display: "block",
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                            }}
                            onLoad={(event) => {
                                console.log(
                                    "IMAGE LOADED:",
                                    {
                                        type,
                                        src:
                                            event
                                                .currentTarget
                                                .src,
                                        width:
                                            event
                                                .currentTarget
                                                .naturalWidth,
                                        height:
                                            event
                                                .currentTarget
                                                .naturalHeight,
                                    }
                                );
                            }}
                            onError={(event) => {
                                console.error(
                                    "IMAGE ERROR:",
                                    {
                                        type,
                                        src:
                                            event
                                                .currentTarget
                                                .src,
                                    }
                                );

                                /*
                                 * Do not let a broken image
                                 * create a permanent broken-image
                                 * icon.
                                 */
                                event.currentTarget.style.display =
                                    "none";
                            }}
                        />
                    ) : (
                        <span
                            style={{
                                color: "#999",
                            }}
                        >
                            No Image
                        </span>
                    )}
                </div>

                {image && (
                    <>
                        <p
                            style={{
                                margin: "8px 0",
                            }}
                        >
                            <strong>
                                {image.view_type}
                            </strong>
                        </p>

                        <div
                            style={{
                                fontSize: "11px",
                                color: "#666",
                                wordBreak: "break-all",
                                marginBottom: "12px",
                            }}
                        >
                            {originalUrl}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                deleteImage(image.id)
                            }
                            style={{
                                padding:
                                    "8px 14px",
                                border: "none",
                                borderRadius: "6px",
                                background:
                                    "#d32f2f",
                                color: "#fff",
                                cursor: "pointer",
                                marginBottom:
                                    "15px",
                            }}
                        >
                            Delete
                        </button>
                    </>
                )}

                <div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                            uploadImage(
                                type,
                                event
                            )
                        }
                        disabled={
                            uploading === type
                        }
                    />
                </div>

                {uploading === type && (
                    <p
                        style={{
                            marginBottom: 0,
                            color: "#555",
                        }}
                    >
                        Uploading...
                    </p>
                )}
            </div>
        );
    };

    return (
        <div
            style={{
                padding: "30px",
                boxSizing: "border-box",
            }}
        >
            <h2>Car Images Manager</h2>

            {loading && (
                <p>Loading images...</p>
            )}

            {error && (
                <div
                    style={{
                        padding: "10px 14px",
                        marginBottom: "20px",
                        background: "#ffebee",
                        color: "#c62828",
                        borderRadius: "8px",
                    }}
                >
                    {error}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                }}
            >
                {IMAGE_TYPES.map(
                    ({ type, title }) => (
                        <ImageBox
                            key={type}
                            type={type}
                            title={title}
                        />
                    )
                )}
            </div>
        </div>
    );
}

