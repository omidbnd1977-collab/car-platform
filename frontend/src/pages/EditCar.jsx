import React, { useMemo, useState } from "react";
import dealerConfig from "../config/dealerConfig";
import {
    COUNTRY_OPTIONS,
    FIELD_LABELS,
    brandOfModel,
    buildModelGroups,
    buildUpdatePayload,
    buildYearOptions,
    clean,
    describeChange,
    dealershipLabel,
    modelsOfBrand,
    needsFreeTextModel,
    validateCarForm,
} from "../utils/carForm";
import { CarFormFields, FormMessage } from "../components/admin/CarFormUI";
import { useCarCatalog } from "../utils/useCarCatalog";
import { apiUrl } from "../utils/apiBase";
import { adminFetch, readError } from "../utils/adminAuth";

// ------------------------------------------------------------
// فرم ویرایش خودرو
// ------------------------------------------------------------
// مثل فرم افزودن، همه‌چیز انتخابی است. برخلاف نسخه‌ی قبلی این فرم،
// برند/مدل/نمایندگی واقعاً ذخیره می‌شوند (PUT /api/cars/:id آن‌ها را
// قبول می‌کند) و اگر برندی تازه انتخاب شود، در کاتالوگ ساخته می‌شود.
// ------------------------------------------------------------

const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "فعال — در سایت نمایش داده می‌شود" },
    { value: "HIDDEN", label: "مخفی — از سایت خارج می‌شود" },
];

function startForm(car) {
    return {
        brand: clean(car?.brand || car?.brand_name),
        model: clean(car?.model || car?.model_name),
        year: String(car?.year ?? ""),
        country: clean(car?.country),
        dealership_name: clean(car?.dealership_name),
        price_aed: String(car?.price_aed ?? ""),
        shipping_cost: String(car?.shipping_cost ?? ""),
        customs_cost: String(car?.customs_cost ?? ""),
        description: clean(car?.description),
        status: clean(car?.status) || "ACTIVE",
    };
}

export default function EditCar({ car, back, onDeleted, onManageImages }) {
    // AdminCars با key={car.id} این کامپوننت را mount می‌کند، پس
    // مقدار اولیه از props گرفته می‌شود و به effect ری‌ست نیاز نیست.
    const [form, setForm] = useState(() => startForm(car));
    const [initial] = useState(() => startForm(car));
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { brands, dealerships, state: catalogState, load: reloadCatalog } = useCarCatalog();

    const selectedBrand = useMemo(
        () => brands.find((brand) => clean(brand?.name) === clean(form.brand)) || null,
        [brands, form.brand]
    );

    const visibleModels = useMemo(() => modelsOfBrand(brands, form.brand), [brands, form.brand]);

    const modelFreeText = useMemo(() => needsFreeTextModel(brands, form.brand), [brands, form.brand]);

    const modelGroups = useMemo(
        () => buildModelGroups(brands, clean(form.brand)),
        [brands, form.brand]
    );

    const brandOptions = useMemo(
        () =>
            brands.map((brand) => ({
                value: brand.name,
                label: `${brand.name}${
                    brand.is_global ? " (لیست آماده)" : brand.in_catalog ? "" : " (بدون کاتالوگ)"
                }`,
            })),
        [brands]
    );

    const dealershipOptions = useMemo(
        () => [
            { value: "", label: "بدون نمایندگی" },
            ...dealerships.map((dealership) => ({
                value: dealership.name,
                label: dealershipLabel(dealership),
            })),
        ],
        [dealerships]
    );

    const yearOptions = useMemo(() => buildYearOptions(), []);

    const countryOptions = useMemo(
        () =>
            COUNTRY_OPTIONS.map((country) => ({ value: country, label: country })),
        []
    );

    const change = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "brand" ? { model: "" } : null),
            ...(name === "model" && value ? { brand: brandOfModel(brands, value) || prev.brand } : null),
        }));

        setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
        setError("");
    };

    const save = async () => {
        const check = validateCarForm(form, { modelMode: modelFreeText ? "text" : "select" });

        setErrors(check.errors);

        if (!check.valid) {
            setError("لطفاً همه‌ی فیلدهای الزامی را پر کن.");

            return;
        }

        const payload = buildUpdatePayload(form, {
            brands,
            models: visibleModels,
            defaultCountry: dealerConfig.country,
            defaultDealership: "",
        });

        try {
            setSaving(true);
            setError("");
            setNotice("");

            const res = await adminFetch(apiUrl(`cars/${car.id}`), {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(await readError(res, "ویرایش خودرو ناموفق بود."));
            }

            const data = await res.json();
            const changed = describeChange(initial, form);
            const created = data?.catalog?.brand_created || data?.catalog?.model_created;

            setNotice(
                "تغییرات ذخیره شد." +
                    (changed.length ? ` ${changed.join("، ")}.` : "") +
                    (created ? " برند/مدل تازه به کاتالوگ اضافه شد." : "")
            );

            // اگر لیست از قبل این خودرو را داشت، بهتر است تازه شود
            reloadCatalog();
        } catch (saveError) {
            console.error("EDIT CAR ERROR:", saveError);
            setError(saveError?.message || "ویرایش خودرو ناموفق بود");
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        try {
            setDeleting(true);
            setError("");

            const res = await adminFetch(apiUrl(`cars/${car.id}`), { method: "DELETE" });

            let data = null;

            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (!res.ok) {
                throw new Error(
                    String(data?.error || data?.message || "") || "حذف خودرو ناموفق بود."
                );
            }

            setNotice(String(data?.message || "") || "خودرو حذف شد.");

            if (onDeleted) {
                onDeleted(car, data);
            }
        } catch (deleteError) {
            console.error("DELETE CAR ERROR:", deleteError);
            setError(deleteError?.message || "حذف خودرو ناموفق بود");
            setConfirmDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div dir="rtl" style={{ color: "#111" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "18px",
                    gap: "12px",
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: "22px" }}>
                        ویرایش خودرو {selectedBrand ? `${form.brand} ${form.model}` : `#${car?.id}`}
                    </h2>
                    <p style={{ margin: "6px 0 0", color: "#888", fontSize: "13px" }}>
                        شناسه‌ی خودرو: {String(car?.id ?? "—")} — همه‌ی فیلدها انتخابی‌اند و فقط
                        قیمت‌ها و توضیحات تایپ می‌شوند.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={back}
                    style={{
                        padding: "9px 16px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        background: "#fff",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                    }}
                >
                    ← بازگشت به لیست
                </button>
            </div>

            <FormMessage tone="error">{error}</FormMessage>
            <FormMessage tone="notice">{notice && !error ? notice : ""}</FormMessage>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "0 18px",
                }}
            >
                <CarFormFields
                    idPrefix="editcar"
                    form={form}
                    onChange={change}
                    errors={errors}
                    labels={{
                        price_aed: `${FIELD_LABELS.price_aed} (${dealerConfig.currency})`,
                        shipping_cost: `${FIELD_LABELS.shipping_cost} (${dealerConfig.currency})`,
                        customs_cost: `${FIELD_LABELS.customs_cost} (${dealerConfig.currency})`,
                    }}
                    brandOptions={brandOptions}
                    modelGroups={modelGroups}
                    modelFreeText={modelFreeText}
                    yearOptions={yearOptions}
                    countryOptions={countryOptions}
                    dealershipOptions={dealershipOptions}
                    brandCount={brands.length}
                    catalogLoading={catalogState === "loading"}
                    dealershipAvailable={dealerships.length > 0}
                    disabled={saving}
                />
            </div>

            <div style={{ marginBottom: "16px" }}>
                <label htmlFor="editcar-status" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "700" }}>
                    وضعیت در سایت
                </label>

                <select
                    id="editcar-status"
                    name="status"
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d8d8d8",
                        borderRadius: "8px",
                        fontSize: "14px",
                        background: "#fff",
                        fontFamily: "inherit",
                    }}
                    value={form.status}
                    onChange={change}
                    disabled={saving}
                >
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    style={{
                        padding: "12px 26px",
                        border: "none",
                        borderRadius: "8px",
                        background: saving ? "#777" : "#111",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "14px",
                        cursor: saving ? "default" : "pointer",
                    }}
                >
                    {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
                </button>

                {onManageImages && (
                    <button
                        type="button"
                        onClick={() => onManageImages(car)}
                        style={{
                            padding: "11px 18px",
                            border: "1px solid #111",
                            borderRadius: "8px",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: "13px",
                        }}
                    >
                        مدیریت تصاویر
                    </button>
                )}
            </div>

            {/* ---------------------------------------
                حذف خودرو (برای ثبت‌های اشتباه)
            --------------------------------------- */}
            <div
                style={{
                    marginTop: "22px",
                    padding: "14px",
                    border: "1px solid #f0c9c9",
                    borderRadius: "10px",
                    background: "#fdf6f6",
                }}
            >
                <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                    حذف این خودرو
                </div>

                <div style={{ fontSize: "12px", color: "#7a5a5a", lineHeight: "1.8" }}>
                    با حذف، رکورد خودرو و همه‌ی عکس‌هایش پاک می‌شود. اگر خودرو به رکورد فروش وصل
                    باشد، به‌جای حذف فقط از سایت مخفی می‌شود. برای اشتباه‌های ساده، «مخفی» کردن
                    امن‌تر است.
                </div>

                {!confirmDelete ? (
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        style={{
                            marginTop: "10px",
                            padding: "10px 18px",
                            border: "1px solid #c62828",
                            borderRadius: "8px",
                            background: "#fff",
                            color: "#c62828",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                        }}
                    >
                        حذف این خودرو…
                    </button>
                ) : (
                    <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "#c62828" }}>مطمئنی؟</span>

                        <button
                            type="button"
                            onClick={remove}
                            disabled={deleting}
                            style={{
                                padding: "9px 16px",
                                border: "none",
                                borderRadius: "8px",
                                background: deleting ? "#8a1f1f" : "#c62828",
                                color: "#fff",
                                fontWeight: "700",
                                fontSize: "13px",
                                cursor: deleting ? "default" : "pointer",
                            }}
                        >
                            {deleting ? "در حال حذف…" : "بله، حذف کن"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            disabled={deleting}
                            style={{
                                padding: "9px 16px",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: "13px",
                            }}
                        >
                            انصراف
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
