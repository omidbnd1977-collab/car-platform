import React, { useMemo, useState } from "react";
import dealerConfig from "../config/dealerConfig";
import {
    COUNTRY_OPTIONS,
    FIELD_LABELS,
    brandOfModel,
    buildCarPayload,
    buildModelGroups,
    buildYearOptions,
    clean,
    dealershipLabel,
    inputStyle,
    modelsOfBrand,
    needsFreeTextModel,
    summarizeUploads,
    validateCarForm,
} from "../utils/carForm";
import { CarFormFields, FormMessage } from "../components/admin/CarFormUI";
import { useCarCatalog, useCatalogWriter } from "../utils/useCarCatalog";
import { apiUrl } from "../utils/apiBase";
import { adminFetch, readError } from "../utils/adminAuth";

// ترتیب آپلود خودکار عکس‌ها بعد از ثبت خودرو
const IMAGE_VIEWS = ["FRONT", "REAR", "INTERIOR", "SIDE", "MAIN"];

// ------------------------------------------------------------
// فرم «افزودن خودروی جدید»
// ------------------------------------------------------------
// همه‌ی فیلدها کمبوکس‌اند (تایپ دستی فقط در سه فیلد قیمت، توضیحات
// و بخش «افزودن به کاتالوگ»)، تا خطای تایپِ نام برند/مدل که باعث
// «Brand not found» می‌شد— ممکن نباشد.
// ------------------------------------------------------------
export default function AddCar({ back, onCreated }) {
    const [form, setForm] = useState({
        brand: "",
        model: "",
        year: "",
        country: dealerConfig.country || "UAE",
        dealership_name: "",
        price_aed: "",
        shipping_cost: "",
        customs_cost: "",
        description: "",
    });

    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [saving, setSaving] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState("");

    // بخش «افزودن به کاتالوگ» (تنها جایی که تایپ نام مجاز است)
    const [catalogForm, setCatalogForm] = useState({ brand: "", model: "" });

    // ---------------------------------------
    // کاتالوگ (برندها + مدل‌ها) و نمایندگی‌ها
    // ---------------------------------------
    const {
        brands,
        dealerships,
        state: catalogState,
        source: catalogSource,
        dealershipState,
        error: catalogLoadError,
        brandOptions,
        readyOnlyCount,
        dbBrandCount,
        load: reloadCatalog,
    } = useCarCatalog();

    const catalog = useCatalogWriter(reloadCatalog);

    const selectedBrand = useMemo(
        () => brands.find((brand) => clean(brand?.name) === clean(form.brand)) || null,
        [brands, form.brand]
    );

    const visibleModels = useMemo(() => modelsOfBrand(brands, form.brand), [brands, form.brand]);

    // برندی که هیچ مدلی ندارد (مثلاً تازه به کاتالوگ اضافه شده) → فیلد مدل تایپی می‌شود
    const modelFreeText = useMemo(() => needsFreeTextModel(brands, form.brand), [brands, form.brand]);

    // تا وقتی برند انتخاب نشده، مدلِ «همه‌ی برندها» گروه‌بندی‌شده نشان داده
    // می‌شود و با انتخاب مدل، برند هم خودکار پر می‌شود.
    const modelGroups = useMemo(
        () => buildModelGroups(brands, clean(form.brand)),
        [brands, form.brand]
    );

    const dealershipOptions = useMemo(
        () => [
            { value: "", label: "بدون نمایندگی (اختیاری)" },
            ...dealerships.map((dealership) => ({
                value: dealership.name,
                label: dealershipLabel(dealership),
            })),
        ],
        [dealerships]
    );

    const yearOptions = useMemo(() => buildYearOptions(), []);

    const countryOptions = useMemo(
        () => COUNTRY_OPTIONS.map((country) => ({ value: country, label: country })),
        []
    );

    const change = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
            // با عوض شدن برند، مدل باید دوباره انتخاب شود
            ...(name === "brand" ? { model: "" } : null),
            // با انتخاب مدل از لیست همه‌ی برندها، برندش هم ست می‌شود
            ...(name === "model" && value ? { brand: brandOfModel(brands, value) || prev.brand } : null),
        }));

        setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
        setError("");
    };

    // ---------------------------------------
    // افزودن برند/مدل به کاتالوگ (بخش جدا، اختیاری)
    // ---------------------------------------
    const addToCatalog = async () => {
        const { ok, result } = await catalog.add({
            brand: catalogForm.brand,
            model: catalogForm.model,
        });

        if (!ok) {
            return;
        }

        setForm((prev) => ({
            ...prev,
            brand: result.brandName || prev.brand,
            model: result.modelName || (result.brandName && result.brandName !== prev.brand ? "" : prev.model),
        }));

        setCatalogForm({ brand: "", model: "" });
        setNotice("کاتالوگ به‌روز شد؛ حالا از لیست انتخابش کن.");
    };

    // ---------------------------------------
    // آپلود عکس‌ها (هر نما یک فایل)
    // ---------------------------------------
    const uploadImages = async (carId, list) => {
        const results = [];

        for (let index = 0; index < list.length; index += 1) {
            const file = list[index];
            const viewType = IMAGE_VIEWS[index];

            setUploadProgress(`در حال آپلود ${index + 1} از ${list.length}…`);

            const body = new FormData();
            body.append("image", file);
            body.append("view_type", viewType);

            try {
                const res = await adminFetch(apiUrl(`cars/${carId}/images/upload`), {
                    method: "POST",
                    body,
                });

                if (!res.ok) {
                    throw new Error(await readError(res));
                }

                results.push({ name: file.name, ok: true, view: viewType });
            } catch (uploadError) {
                results.push({
                    name: file.name,
                    ok: false,
                    error: uploadError?.message || "خطای نامشخص",
                });
            }
        }

        setUploadProgress("");

        return summarizeUploads(results);
    };

    // ---------------------------------------
    // ثبت خودرو
    // ---------------------------------------
    const save = async () => {
        const check = validateCarForm(form, { modelMode: modelFreeText ? "text" : "select" });

        setErrors(check.errors);

        if (!check.valid) {
            setError("لطفاً همه‌ی فیلدهای الزامی را از لیست انتخاب کن.");

            return;
        }

        const payload = buildCarPayload(form, {
            brands,
            models: visibleModels,
            defaultCountry: dealerConfig.country,
            defaultDealership: "",
        });

        try {
            setSaving(true);
            setError("");
            setNotice("");

            const res = await adminFetch(apiUrl("cars"), {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(await readError(res, "ثبت خودرو ناموفق بود."));
            }

            const data = await res.json();
            const car = data?.car || null;

            let uploadSummary = null;

            if (car?.id && files.length) {
                uploadSummary = await uploadImages(car.id, files.slice(0, IMAGE_VIEWS.length));
            }

            if (uploadSummary?.failed?.length) {
                setError("خودرو ثبت شد ولی بعضی عکس‌ها آپلود نشدند: " + uploadSummary.message);

                return;
            }

            setNotice(
                "خودرو ثبت شد" +
                    (uploadSummary?.uploaded ? ` و ${uploadSummary.uploaded} عکس آپلود شد.` : ".")
            );

            if (onCreated) {
                onCreated(car);

                return;
            }

            back();
        } catch (saveError) {
            console.error("ADD CAR ERROR:", saveError);
            setError(saveError?.message || "ثبت خودرو ناموفق بود");
        } finally {
            setSaving(false);
        }
    };

    // ---------------------------------------
    // رندر
    // ---------------------------------------
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
                    <h2 style={{ margin: 0, fontSize: "22px" }}>افزودن خودروی جدید</h2>
                    <p style={{ margin: "6px 0 0", color: "#888", fontSize: "13px" }}>
                        همه‌ی فیلدها از لیست انتخاب می‌شوند تا اشتباه تایپی رخ ندهد؛ فقط قیمت‌ها
                        (و توضیحات) دستی وارد می‌شوند. لیست برند و مدل، کل کاتالوگ به‌علاوه‌ی
                        برندها/مدل‌های ثبت‌شده‌ی قبلی است.
                    </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={reloadCatalog}
                        style={{
                            padding: "9px 14px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            background: "#fff",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            fontSize: "12px",
                        }}
                    >
                        ↻ بازخوانی لیست
                    </button>

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
                        ← بازگشت
                    </button>
                </div>
            </div>

            <FormMessage tone="error">{catalogState === "error" ? catalogLoadError : ""}</FormMessage>
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
                    brandHint={
                        catalogSource === "legacy"
                            ? `${dbBrandCount} برند از API قدیمی + ${readyOnlyCount} برند از لیست آماده — برای «افزودن به کاتالوگ» و حذف خودرو، بک‌اند را هم دیپلوی کن`
                            : `همه‌ی برندهای بازار: ${dbBrandCount} برند کاتالوگ + ${readyOnlyCount} برند آماده (مدل‌های پرفروش هم داخل لیست است)`
                    }
                    catalogLoading={catalogState === "loading"}
                    dealershipAvailable={dealershipState !== "unavailable" && dealerships.length > 0}
                    disabled={saving}
                />
            </div>

            {/* ---------------------------------------
                فقط وقتی برند/مدل در کاتالوگ نبود:
                افزودن به کاتالوگ (خارج از فرم خودرو)
            --------------------------------------- */}
            <details
                style={{
                    marginBottom: "18px",
                    border: "1px solid #e2e2e2",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    background: "#fafafa",
                }}
            >
                <summary style={{ cursor: "pointer", fontSize: "13px", color: "#555" }}>
                    برند یا مدل در لیست نیست؟ (افزودن به کاتالوگ)
                </summary>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "12px",
                        marginTop: "12px",
                    }}
                >
                    <div>
                        <label style={{ fontSize: "12px", color: "#666" }} htmlFor="catalog-brand">
                            نام برند جدید
                        </label>
                        <input
                            id="catalog-brand"
                            style={{ ...inputStyle, marginTop: "4px" }}
                            value={catalogForm.brand}
                            dir="ltr"
                            placeholder="مثلاً Chery"
                            onChange={(event) =>
                                setCatalogForm((prev) => ({ ...prev, brand: event.target.value }))
                            }
                            disabled={catalog.saving}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: "12px", color: "#666" }} htmlFor="catalog-model">
                            نام مدل جدید {selectedBrand ? `(برای ${selectedBrand.name})` : ""}
                        </label>
                        <input
                            id="catalog-model"
                            style={{ ...inputStyle, marginTop: "4px" }}
                            value={catalogForm.model}
                            dir="ltr"
                            placeholder="مثلاً Tiggo 8"
                            onChange={(event) =>
                                setCatalogForm((prev) => ({ ...prev, model: event.target.value }))
                            }
                            disabled={catalog.saving}
                        />
                    </div>
                </div>

                <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                        type="button"
                        onClick={addToCatalog}
                        disabled={catalog.saving}
                        style={{
                            padding: "9px 18px",
                            border: "1px solid #111",
                            borderRadius: "8px",
                            background: "#fff",
                            cursor: catalog.saving ? "default" : "pointer",
                            fontSize: "13px",
                        }}
                    >
                        {catalog.saving ? "در حال ثبت…" : "افزودن به کاتالوگ"}
                    </button>

                    <span style={{ fontSize: "11px", color: "#999" }}>
                        فقط در همین بخش تایپ آزاد است؛ در فرم خودرو همه‌چیز انتخابی است.
                    </span>
                </div>

                {catalog.error && (
                    <div
                        role="alert"
                        style={{
                            marginTop: "10px",
                            color: "#8a1f1f",
                            background: "#fdecec",
                            border: "1px solid #e5b4b4",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "12px",
                        }}
                    >
                        {catalog.error}
                    </div>
                )}
            </details>

            <div
                style={{
                    marginBottom: "18px",
                    padding: "14px",
                    border: "1px dashed #d8d8d8",
                    borderRadius: "10px",
                    background: "#fafafa",
                }}
            >
                <label
                    htmlFor="addcar-images"
                    style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "700" }}
                >
                    عکس‌ها (اختیاری)
                </label>

                <input
                    id="addcar-images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    disabled={saving}
                    onChange={(event) => setFiles(Array.from(event.target.files || []))}
                />

                <div style={{ color: "#999", fontSize: "11px", marginTop: "8px" }}>
                    حداکثر ۱۵ مگابایت هر فایل — jpg, png, webp, gif. اولین ۵ فایل به‌ترتیب نمای
                    FRONT، REAR، INTERIOR، SIDE و MAIN ثبت می‌شود؛ بقیه را بعداً از بخش «تصاویر»
                    اضافه کنید.
                    {files.length ? ` (${files.length} فایل انتخاب شده)` : ""}
                </div>

                {files.length > IMAGE_VIEWS.length && (
                    <div style={{ color: "#b26a00", fontSize: "11px", marginTop: "6px" }}>
                        {files.length - IMAGE_VIEWS.length} فایل بیشتر از ۵ عدد است و در این مرحله
                        آپلود نمی‌شود.
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                    {saving ? "در حال ثبت…" : "ثبت خودرو"}
                </button>

                {uploadProgress && (
                    <span style={{ color: "#666", fontSize: "12px" }}>{uploadProgress}</span>
                )}
            </div>
        </div>
    );
}
