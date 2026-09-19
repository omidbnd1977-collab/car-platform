import React, { useEffect, useRef, useState } from "react";

// ------------------------------------------------------------
// لینک مستقیم پنل‌ها
// ------------------------------------------------------------
// /admin#/new      → فرم «افزودن خودروی جدید»
// /admin#/car/54   → مدیریت تصاویر خودروی ۵۴
// /admin#/edit/54  → ویرایش مشخصات خودروی ۵۴
// /admin#/         → لیست خودروها
// از hash استفاده می‌کنیم تا به تنظیم Rewrite روی هاست
// وابسته نباشد و آدرس را بتوان بوک‌مارک کرد.
// ------------------------------------------------------------
const VIEW_NONE = "";
const VIEW_NEW_CAR = "#/new";
const VIEW_CAR_IMAGES_PREFIX = "#/car/";
const VIEW_CAR_EDIT_PREFIX = "#/edit/";
const VIEW_REQUESTS = "#/requests";

function readViewFromLocation() {
    const win = typeof window === "undefined" ? null : window;

    if (!win?.location) {
        return { name: "list", id: null };
    }

    const hash = String(win.location.hash || "");

    if (hash.startsWith(VIEW_REQUESTS)) {
        return { name: "requests", id: null };
    }

    if (hash.startsWith(VIEW_CAR_IMAGES_PREFIX)) {
        return { name: "car", id: hash.slice(VIEW_CAR_IMAGES_PREFIX.length) };
    }

    if (hash.startsWith(VIEW_CAR_EDIT_PREFIX)) {
        return { name: "edit", id: hash.slice(VIEW_CAR_EDIT_PREFIX.length) };
    }

    if (hash.startsWith(VIEW_NEW_CAR)) {
        return { name: "new", id: null };
    }

    return { name: "list", id: null };
}

function writeViewToLocation(view) {
    if (typeof window === "undefined") {
        return;
    }

    const pathname = window.location.pathname || "/";
    const search = window.location.search || "";
    // Fix SecurityError: when pathname is "/" and view is "", old code produced "//" -> invalid URL "https:"
    const next = view === VIEW_NONE ? pathname + search : pathname + search + view;

    const current = window.location.pathname + window.location.search + window.location.hash;
    if (current !== next) {
        try {
            window.history.replaceState(null, "", next);
        } catch {
            try {
                if (view && view.startsWith("#")) {
                    window.location.hash = view;
                } else {
                    window.location.hash = "";
                }
            } catch {}
        }
    }
}

import AdminCarImages from "../components/admin/AdminCarImages";
import EditCar from "./EditCar";
import AddCar from "./AddCar";
import { getImageUrl } from "../utils/imageUrl";
import CarDetails from "./CarDetails";
import VisitRequests from "./VisitRequests";
import AdminStats from "../components/admin/AdminStats";
import dealerConfig, { tenantSlug } from "../config/dealerConfig";
import { API_BASE, apiUrl } from "../utils/apiBase";
import {
    adminFetch,
    clearAdminKey,
    fetchGuardStatus,
    getAdminKey,
    isUnauthorized,
    setAdminKey,
    verifyAdminKey,
} from "../utils/adminAuth";

const cardStyle = {
    background: "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid #e1e1e1",
    boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
};

const actionButton = ({ tone = "dark" } = {}) => ({
    flex: 1,
    padding: "11px 8px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    border: tone === "dark" ? "none" : "1px solid #ccc",
    background: tone === "dark" ? "#111" : "#fff",
    color: tone === "dark" ? "#fff" : "#111",
});

// ------------------------------------------------------------
// فرم کوچک وارد‌کردن رمز ادمین (هدر x-admin-key)
// ------------------------------------------------------------
function AdminKeyPrompt({ open, saving, value, onChange, onSubmit, onCancel, onClear, error }) {
    if (!open) {
        return null;
    }

    return (
        <div
            style={{
                background: "#111",
                color: "#fff",
                borderRadius: "12px",
                padding: "18px",
                marginBottom: "25px",
            }}
        >
            <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>
                رمز ورود ادمین
            </div>

            <div style={{ fontSize: "12px", color: "#bbb", marginBottom: "12px", lineHeight: "1.8" }}>
                سرور، عملیات نوشتنی (ثبت/ویرایش/حذف خودرو و عکس‌ها) را با کلید
                <code style={{ background: "#222", padding: "1px 5px", borderRadius: "4px" }}>
                    ADMIN_API_KEY
                </code>
                قفل کرده است. رمز را وارد کن؛ در همین مرورگر ذخیره می‌شود و با هر درخواست در هدر
                <code style={{ background: "#222", padding: "1px 5px", borderRadius: "4px" }}>
                    x-admin-key
                </code>
                فرستاده می‌شود.
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                    type="password"
                    dir="ltr"
                    value={value}
                    onChange={onChange}
                    placeholder="ADMIN_API_KEY"
                    style={{
                        flex: "1 1 220px",
                        padding: "10px 12px",
                        border: "1px solid #444",
                        borderRadius: "8px",
                        background: "#1d1d1d",
                        color: "#fff",
                        fontSize: "14px",
                    }}
                />

                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={saving}
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#fff",
                        color: "#111",
                        fontWeight: "700",
                        cursor: "pointer",
                    }}
                >
                    ذخیره و ادامه
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: "10px 16px",
                        border: "1px solid #555",
                        borderRadius: "8px",
                        background: "transparent",
                        color: "#ddd",
                        cursor: "pointer",
                    }}
                >
                    بعداً
                </button>

                {onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        style={{
                            padding: "10px 14px",
                            border: "1px solid #555",
                            borderRadius: "8px",
                            background: "transparent",
                            color: "#ddd",
                            cursor: "pointer",
                            fontSize: "12px",
                        }}
                    >
                        پاک کردن رمز ذخیره‌شده
                    </button>
                )}
            </div>

            {error && (
                <div style={{ marginTop: "10px", color: "#ffb4b4", fontSize: "12px" }}>{error}</div>
            )}
        </div>
    );
}

export default function AdminCars() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [editCar, setEditCar] = useState(null);
    const [addingCar, setAddingCar] = useState(() => readViewFromLocation().name === "new");
    const [showRequests, setShowRequests] = useState(() => readViewFromLocation().name === "requests");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [detailsCar, setDetailsCar] = useState(null);

    // حذف خودروی اشتباهی
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showStats, setShowStats] = useState(false);

    // وضعیت محافظ ادمین (ADMIN_API_KEY سمت سرور)
    const [guard, setGuard] = useState({ checked: false, enabled: false, hasKey: false });
    const [keyPrompt, setKeyPrompt] = useState(false);
    const [keyDraft, setKeyDraft] = useState("");
    const [keySaving, setKeySaving] = useState(false);
    const [keyError, setKeyError] = useState("");

    // id درخواستیِ لینک /#/car/:id (یک‌بار مصرف، بدون رندر اضافه)
    const pendingCarIdRef = useRef(readViewFromLocation().id);
    const pendingEditIdRef = useRef(
        readViewFromLocation().name === "edit" ? readViewFromLocation().id : null
    );

    const loadCars = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch(apiUrl("cars"));

            if (!res.ok) {
                throw new Error(`Failed to load cars: ${res.status}`);
            }

            const data = await res.json();

            console.log("CARS:", data);

            const list = Array.isArray(data?.cars) ? data.cars : [];

            setCars(list);

            // آدرس مستقیم /#/car/:id → همان خودرو را در مدیریت
            // تصاویر باز می‌کند (بعد از این‌که لیست آمد).
            const pendingId = pendingCarIdRef.current;

            if (pendingId) {
                pendingCarIdRef.current = null;

                const match = list.find((car) => String(car?.id) === String(pendingId));

                if (match) {
                    setSelectedCar(match);
                }
            }

            // /#/edit/:id → فرم ویرایش همان خودرو
            const pendingEdit = pendingEditIdRef.current;

            if (pendingEdit) {
                pendingEditIdRef.current = null;

                const match = list.find((car) => String(car?.id) === String(pendingEdit));

                if (match) {
                    setEditCar(match);
                }
            }
        } catch (err) {
            console.error("LOAD CARS ERROR:", err);
            setError(err?.message || "Failed to load cars.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            await loadCars();
        })();
    }, []);

    // آیا گارد روی سرور روشن است؟
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const status = await fetchGuardStatus(API_BASE);

            if (cancelled) {
                return;
            }

            const hasKey = Boolean(getAdminKey());

            setGuard({
                checked: true,
                enabled: Boolean(status?.enabled),
                hasKey,
            });

            if (status?.enabled && !hasKey) {
                setKeyPrompt(true);
            }

            // رمز ذخیره‌شده ممکن است بعد از تعویض ADMIN_API_KEY بی‌اعتبار شده باشد
            if (status?.enabled && hasKey) {
                const checked = await verifyAdminKey(API_BASE);

                if (!checked.ok && !cancelled) {
                    clearAdminKey();
                    setGuard((prev) => ({ ...prev, hasKey: false }));
                    setKeyPrompt(true);
                    setKeyError("رمز ذخیره‌شده دیگر معتبر نیست؛ دوباره واردش کن.");
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // لینک را با حالت فعلی صفحه هم‌نگاه می‌کنیم
    useEffect(() => {
        if (showRequests) {
            writeViewToLocation(VIEW_REQUESTS);
            return;
        }

        if (addingCar) {
            writeViewToLocation(VIEW_NEW_CAR);

            return;
        }

        if (editCar?.id) {
            writeViewToLocation(VIEW_CAR_EDIT_PREFIX + editCar.id);

            return;
        }

        if (selectedCar?.id) {
            writeViewToLocation(VIEW_CAR_IMAGES_PREFIX + selectedCar.id);

            return;
        }

        writeViewToLocation(VIEW_NONE);
    }, [addingCar, editCar, selectedCar, showRequests]);

    // اگر کاربر خودش hash را عوض کرد (مثلاً Back مرورگر)
    useEffect(() => {
        const onHashChange = () => {
            const view = readViewFromLocation();

            if (view.name === "requests") {
                setSelectedCar(null);
                setEditCar(null);
                setAddingCar(false);
                setShowRequests(true);
                return;
            }

            setShowRequests(false);

            if (view.name === "new") {
                setSelectedCar(null);
                setEditCar(null);
                setAddingCar(true);

                return;
            }

            setAddingCar(false);

            if (view.name === "car") {
                pendingCarIdRef.current = view.id;
                loadCars();

                return;
            }

            if (view.name === "edit") {
                pendingEditIdRef.current = view.id;
                loadCars();

                return;
            }

            setSelectedCar(null);
            setEditCar(null);
        };

        window.addEventListener("hashchange", onHashChange);

        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const saveKey = async () => {
        const clean = String(keyDraft || "").trim();

        if (!clean) {
            setKeyError("رمز را وارد کن.");

            return;
        }

        setKeySaving(true);
        setKeyError("");

        try {
            // اول رمز را ذخیره کن تا verify با همین رمز جدید چک کند
            setAdminKey(clean);
            const checked = await verifyAdminKey(API_BASE);

            if (!checked.ok) {
                // اگر اشتباه بود پاک کن
                clearAdminKey();
                setKeyError(
                    checked.reason === "network"
                        ? "سرور پاسخ نداد؛ دوباره امتحان کن."
                        : "این رمز مورد قبول سرور نبود (ADMIN_API_KEY را بررسی کن)."
                );

                return;
            }

            setKeyDraft("");
            setGuard((prev) => ({ ...prev, enabled: true, hasKey: true }));
            setKeyPrompt(false);
            setNotice("رمز درست است؛ عملیات ثبت/ویرایش/حذف باز شد.");

            await loadCars();
        } catch (saveError) {
            setKeyError(saveError?.message || "ذخیره رمز ناموفق بود.");
        } finally {
            setKeySaving(false);
        }
    };

    const forgetKey = () => {
        clearAdminKey();
        setGuard((prev) => ({ ...prev, hasKey: false }));
        setKeyPrompt(true);
        setKeyError("");
        setNotice("رمز ذخیره‌شده پاک شد.");
    };

    const removeCar = async (car) => {
        const id = car?.id;

        try {
            setDeletingId(id);
            setError("");
            setNotice("");

            const res = await adminFetch(apiUrl(`cars/${id}`), { method: "DELETE" });

            let data = null;

            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (isUnauthorized(res)) {
                setKeyPrompt(true);
                setKeyError("رمز ذخیره‌شده accepted نشد؛ دوباره واردش کن.");

                throw new Error("برای حذف، رمز ورود ادمین لازم است.");
            }

            if (!res.ok) {
                throw new Error(String(data?.error || "") || `حذف ناموفق (کد ${res.status}).`);
            }

            setConfirmDeleteId(null);
            setNotice(
                String(data?.message || "") ||
                    `خودرو #${id} حذف شد (${Number(data?.images_removed) || 0} عکس هم پاک شد).`
            );

            setCars((prev) => prev.filter((item) => String(item?.id) !== String(id)));

            await loadCars();
        } catch (deleteError) {
            console.error("DELETE CAR ERROR:", deleteError);
            setError(deleteError?.message || "حذف خودرو ناموفق بود.");
        } finally {
            setDeletingId(null);
        }
    };

    const getCarImage = (car) => {
        const images = Array.isArray(car?.images) ? car.images : [];

        const front = images.find((img) => {
            return (
                String(img?.view_type || "").toUpperCase() === "FRONT" && img?.image_url
            );
        });

        if (front?.image_url) {
            return getImageUrl(front.image_url);
        }

        const primary = images.find((img) => img?.is_primary === true);

        if (primary?.image_url) {
            return getImageUrl(primary.image_url);
        }

        const uploaded = images.find((img) => {
            return String(img?.image_url || "").startsWith("/uploads/cars/");
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

    if (addingCar) {
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
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "14px",
                        padding: "25px",
                        border: "1px solid #e5e5e5",
                    }}
                >
                    <AddCar
                        back={() => {
                            setAddingCar(false);
                            loadCars();
                        }}
                        onCreated={(car) => {
                            setAddingCar(false);
                            loadCars();

                            // بعد از ثبت خودرو، مستقیم به مدیریت تصاویر
                            // همان خودرو می‌رویم تا عکس‌ها همان‌جا
                            // تکمیل شوند.
                            if (car?.id) {
                                setSelectedCar({
                                    ...car,
                                    brand_name: car.brand,
                                    model_name: car.model,
                                });
                            }
                        }}
                    />
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
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "14px",
                        padding: "25px",
                        border: "1px solid #e5e5e5",
                    }}
                >
                    <EditCar
                        key={`edit-${editCar.id}`}
                        car={editCar}
                        back={() => {
                            setEditCar(null);
                            loadCars();
                        }}
                        onDeleted={() => {
                            setEditCar(null);
                            setNotice("خودرو حذف شد و از لیست برداشته شد.");
                            loadCars();
                        }}
                        onManageImages={() => {
                            setSelectedCar(editCar);
                            setEditCar(null);
                        }}
                    />
                </div>
            </div>
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
                    ← بازگشت به لیست
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

                    <h1 style={{ margin: "0 0 25px", fontSize: "30px" }}>
                        {selectedCar.brand_name || selectedCar.brand || ""} {selectedCar.model_name || selectedCar.model || ""}
                    </h1>

                    <AdminCarImages carId={selectedCar.id} />
                </div>
            </div>
        );
    }

    // درخواست‌های بازدید - تب جدید ادمین
    if (showRequests) {
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
                <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "22px", flexWrap: "wrap" }}>
                        <button type="button" onClick={() => setShowRequests(false)} style={{ padding: "10px 18px", border: "1px solid #111", borderRadius: "8px", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>← بازگشت به خودروها</button>
                        <button type="button" onClick={() => { setShowRequests(false); setAddingCar(true); }} style={{ padding: "10px 18px", border: "none", borderRadius: "8px", background: "#111", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>+ افزودن خودرو</button>
                    </div>
                    <VisitRequests />
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
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
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
                        ADMIN PANEL · {dealerConfig.name}
                    </p>

                    <h1 style={{ margin: 0, fontSize: "36px" }}>مدیریت خودروها</h1>

                    <p style={{ margin: "10px 0 0", color: "#aaa", fontSize: "13px" }}>
                        ثبت، ویرایش، حذف و مدیریت تصاویر. قالب فعال:{" "}
                        <code style={{ background: "#222", padding: "1px 6px", borderRadius: "4px" }}>
                            {tenantSlug}
                        </code>{" "}
                        {" — برای تغییرات اختصاصی یک مشتری، فایل config/tenants/<slug>.js را ببین."}
                    </p>

                    <div style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
                        <button type="button" onClick={() => setShowRequests(false)} style={{ padding: "10px 18px", borderRadius: "8px", border: showRequests ? "1px solid #444" : "none", background: showRequests ? "transparent" : "#fff", color: showRequests ? "#aaa" : "#111", cursor: "pointer", fontWeight: 800, fontSize: "13px" }}>🚗 خودروها ({cars.length})</button>
                        <button type="button" onClick={() => setShowRequests(true)} style={{ padding: "10px 18px", borderRadius: "8px", border: !showRequests ? "1px solid #444" : "none", background: !showRequests ? "transparent" : "#fff", color: !showRequests ? "#aaa" : "#111", cursor: "pointer", fontWeight: 800, fontSize: "13px" }}>📋 درخواست‌های بازدید</button>
                    </div>
                </div>

                {/* ---------------------------------------
                    وضعیت محافظ ادمین
                --------------------------------------- */}
                {guard.checked && !guard.enabled && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "18px",
                            background: "#fff8e1",
                            border: "1px solid #ffe082",
                            borderRadius: "10px",
                            color: "#7a5c00",
                            fontSize: "12px",
                            lineHeight: "1.9",
                        }}
                    >
                        <b>محافظ ادمین خاموش است.</b> تا وقتی در Render متغیر{" "}
                        <code>ADMIN_API_KEY</code> ست نشود، هر کسی می‌تواند با{" "}
                        <code>POST /api/cars</code> خودرو ثبت یا حذف کند. با ست‌کردن آن متغیر و
                        ریدپلوی بک‌اند، همین پنل از شما رمز می‌خواهد و همه‌ی درخواست‌های نوشتنی
                        قفل می‌شوند.
                    </div>
                )}

                {guard.checked && guard.enabled && !guard.hasKey && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "18px",
                            background: "#e3f2fd",
                            border: "1px solid #bbdefb",
                            borderRadius: "10px",
                            color: "#0d47a1",
                            fontSize: "12px",
                            lineHeight: "1.9",
                        }}
                    >
                        محافظ ادمین روشن است — برای ثبت/ویرایش/حذف، رمز را وارد کنید.{" "}
                        <button
                            type="button"
                            onClick={() => setKeyPrompt(true)}
                            style={{
                                padding: "6px 12px",
                                border: "1px solid #0d47a1",
                                borderRadius: "6px",
                                background: "#fff",
                                color: "#0d47a1",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                        >
                            رمز ورود
                        </button>
                    </div>
                )}

                <AdminKeyPrompt
                    open={keyPrompt}
                    saving={keySaving}
                    value={keyDraft}
                    error={keyError}
                    onChange={(event) => setKeyDraft(event.target.value)}
                    onSubmit={saveKey}
                    onCancel={() => {
                        setKeyPrompt(false);
                        setKeyError("");
                    }}
                    onClear={guard.hasKey ? forgetKey : null}
                />

                {/* ---------------------------------------
                    یادداشت محل ذخیره‌ی عکس‌ها (موقت)
                --------------------------------------- */}
                <div
                    style={{
                        padding: "10px 16px",
                        marginBottom: "18px",
                        background: "#f1f1f1",
                        border: "1px solid #e0e0e0",
                        borderRadius: "10px",
                        color: "#666",
                        fontSize: "11px",
                        lineHeight: "1.9",
                    }}
                >
                    عکس‌ها فعلاً روی دیسک خودِ هاست ذخیره می‌شوند (نه R2/S3)؛ برای همین با هر
                    ریدپلوی، فایل‌های قدیمی از دست می‌روند. مایگرشن استورج در program بعدی است.
                </div>

                {notice && (
                    <div
                        role="status"
                        style={{
                            padding: "14px 18px",
                            marginBottom: "25px",
                            background: "#e8f5e9",
                            color: "#1b5e20",
                            borderRadius: "9px",
                            fontSize: "13px",
                        }}
                    >
                        {notice}
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
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
                        <h2 style={{ margin: 0, fontSize: "24px" }}>خودروها</h2>

                        <p style={{ margin: "6px 0 0", color: "#888", fontSize: "14px" }}>
                            {cars.length} خودرو
                            {loading ? " — در حال بارگذاری…" : ""}
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={loadCars}
                            style={{
                                padding: "12px 18px",
                                border: "1px solid #111",
                                borderRadius: "8px",
                                background: "#fff",
                                cursor: "pointer",
                                fontWeight: "700",
                                fontSize: "13px",
                            }}
                        >
                            ↻ تازه‌سازی
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowStats(true)}
                            style={{
                                padding: "12px 20px",
                                border: "1px solid #d4af37",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #111 0%, #222 100%)",
                                color: "#d4af37",
                                cursor: "pointer",
                                fontWeight: "800",
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                            }}
                        >
                            📊 آمار حرفه‌ای
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setNotice("");
                                setError("");
                                setAddingCar(true);
                            }}
                            style={{
                                padding: "12px 22px",
                                border: "none",
                                borderRadius: "8px",
                                background: "#111",
                                color: "#fff",
                                cursor: "pointer",
                                fontWeight: "700",
                                fontSize: "13px",
                            }}
                        >
                            + افزودن خودروی جدید
                        </button>
                    </div>
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
                        <h3>خودرویی پیدا نشد</h3>

                        <p style={{ color: "#888" }}>با دکمه‌ی «افزودن خودروی جدید» اولين خودرو را ثبت کن.</p>
                    </div>
                )}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "25px",
                    }}
                >
                    {cars.map((car) => {
                        const imageUrl = getCarImage(car);

                        const brand = car.brand_name || car.brand || "";
                        const model = car.model_name || car.model || "";

                        const price = car.price_aed ? Number(car.price_aed).toLocaleString("en-US") : "N/A";

                        const status = String(car.status || "ACTIVE").toUpperCase();
                        const hidden = status !== "ACTIVE";

                        return (
                            <div key={car.id} style={cardStyle}>
                                <div
                                    style={{
                                        height: "210px",
                                        background: "#e9e9e9",
                                        overflow: "hidden",
                                        position: "relative",
                                    }}
                                >
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={`${brand} ${model}`}
                                            onError={(event) => {
                                                event.currentTarget.style.display = "none";
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
                                            بدون عکس
                                        </div>
                                    )}

                                    {hidden && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: "10px",
                                                right: "10px",
                                                background: "#c62828",
                                                color: "#fff",
                                                fontSize: "11px",
                                                padding: "4px 9px",
                                                borderRadius: "999px",
                                            }}
                                        >
                                            مخفی در سایت
                                        </span>
                                    )}
                                </div>

                                <div style={{ padding: "20px" }}>
                                    <h3 style={{ margin: "0 0 8px", fontSize: "21px" }}>
                                        {brand} {model}
                                    </h3>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "12px",
                                            padding: "14px 0",
                                            borderTop: "1px solid #eee",
                                            borderBottom: "1px solid #eee",
                                        }}
                                    >
                                        <div>
                                            <small style={{ color: "#999" }}>سال</small>

                                            <div style={{ fontWeight: "600", marginTop: "4px" }}>
                                                {car.year || "-"}
                                            </div>
                                        </div>

                                        <div>
                                            <small style={{ color: "#999" }}>قیمت</small>

                                            <div style={{ fontWeight: "700", marginTop: "4px" }}>
                                                {price} {dealerConfig.currency}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNotice("");
                                                setError("");
                                                setEditCar(car);
                                            }}
                                            style={actionButton({ tone: "dark" })}
                                        >
                                            ویرایش
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedCar(car)}
                                            style={actionButton()}
                                        >
                                            تصاویر ({Array.isArray(car.images) ? car.images.length : 0})
                                        </button>
                                    </div>

                                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                                        <button
                                            type="button"
                                            onClick={() => setDetailsCar(car)}
                                            style={{
                                                flex: 1,
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
                                            جزئیات
                                        </button>

                                        {confirmDeleteId === car.id ? (
                                            <span style={{ display: "flex", gap: "6px", flex: 1 }}>
                                                <button
                                                    type="button"
                                                    disabled={deletingId === car.id}
                                                    onClick={() => removeCar(car)}
                                                    style={{
                                                        flex: 1,
                                                        padding: "11px 8px",
                                                        border: "none",
                                                        borderRadius: "7px",
                                                        background: "#c62828",
                                                        color: "#fff",
                                                        fontWeight: "700",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {deletingId === car.id ? "در حال حذف…" : "حذف شود؟"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    style={{
                                                        padding: "11px 10px",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "7px",
                                                        background: "#fff",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    انصراف
                                                </button>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNotice("");
                                                    setError("");
                                                    setConfirmDeleteId(car.id);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: "11px",
                                                    border: "1px solid #c62828",
                                                    borderRadius: "7px",
                                                    background: "#fff",
                                                    color: "#c62828",
                                                    cursor: "pointer",
                                                    fontWeight: "600",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                حذف
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ color: "#aaa", fontSize: "11px", marginTop: "10px" }}>
                                        شناسه: {String(car.id)} · وضعیت: {status}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <AdminStats open={showStats} onClose={() => setShowStats(false)} />
            </div>
        </div>
    );
}
