import React from "react";
import {
    errorTextStyle,
    hintStyle,
    inputStyle,
    labelStyle,
    selectStyle,
} from "../../utils/carForm";

// ------------------------------------------------------------
// اجزای مشترک فرم خودرو (افزودن + ویرایش)
// ------------------------------------------------------------
// همه‌ی فیلدها «کمبوکس»‌اند و فقط قیمت‌ها/توضیحات تایپ می‌شوند،
// تا خطای تایپِ نام برند یا مدل ممکن نباشد. این فایل عمداً فقط
// کامپوننت export می‌کند؛ استایل‌ها و منطق در utils/carForm.js‌اند.
// ------------------------------------------------------------

function FieldShell({ children }) {
    return <div style={{ marginBottom: "16px" }}>{children}</div>;
}

export function SelectField({
    name,
    label,
    value,
    options,
    groups,
    onChange,
    placeholder = "— انتخاب کنید —",
    error,
    hint,
    disabled,
    idPrefix = "addcar",
}) {
    return (
        <FieldShell>
            <label htmlFor={`${idPrefix}-${name}`} style={labelStyle}>
                {label}
            </label>

            <select
                id={`${idPrefix}-${name}`}
                name={name}
                style={{ ...selectStyle, opacity: disabled ? 0.6 : 1 }}
                value={value}
                onChange={onChange}
                disabled={disabled}
                dir="rtl"
            >
                <option value="">{placeholder}</option>

                {groups
                    ? groups.map((group) => (
                          <optgroup key={`group-${group.label}`} label={group.label}>
                              {group.options.map((option) => (
                                  <option key={`${group.label}-${option.value}`} value={option.value}>
                                      {option.label}
                                  </option>
                              ))}
                          </optgroup>
                      ))
                    : (options || []).map((option) => (
                          <option key={option.value} value={option.value}>
                              {option.label}
                          </option>
                      ))}
            </select>

            {hint && !error && <div style={hintStyle}>{hint}</div>}

            {error && <div style={errorTextStyle}>{error}</div>}
        </FieldShell>
    );
}

export function PriceField({
    name,
    label,
    value,
    onChange,
    error,
    hint,
    disabled,
    idPrefix = "addcar",
}) {
    return (
        <FieldShell>
            <label htmlFor={`${idPrefix}-${name}`} style={labelStyle}>
                {label}
            </label>

            <input
                id={`${idPrefix}-${name}`}
                name={name}
                type="number"
                min="0"
                step="any"
                style={inputStyle}
                value={value}
                onChange={onChange}
                inputMode="decimal"
                dir="ltr"
                placeholder="0"
                disabled={disabled}
            />

            {hint && !error && <div style={hintStyle}>{hint}</div>}

            {error && <div style={errorTextStyle}>{error}</div>}
        </FieldShell>
    );
}

/** پنج کمبوکس + سه قیمت + توضیحات، برای حالت «افزودن» و «ویرایش» */
export function CarFormFields({
    form,
    onChange,
    errors = {},
    brandOptions = [],
    modelGroups = [],
    yearOptions = [],
    countryOptions = [],
    dealershipOptions = [],
    currency = "AED",
    labels,
    brandCount,
    brandHint,
    catalogLoading,
    modelsLoading,
    modelFreeText,
    dealershipAvailable,
    disabled,
    idPrefix = "addcar",
}) {
    const priceNames = ["price_aed", "shipping_cost", "customs_cost"];
    const priceLabels = {
        price_aed: `قیمت (${currency})`,
        shipping_cost: "هزینه لندیکرافت",
        customs_cost: "هزینه گمرک",
    };

    return (
        <>
            <SelectField
                idPrefix={idPrefix}
                name="brand"
                label="برند"
                value={form.brand}
                options={brandOptions}
                onChange={onChange}
                disabled={disabled}
                placeholder={
                    catalogLoading ? "در حال دریافت کاتالوگ…" : "— انتخاب برند —"
                }
                hint={
                    brandHint ||
                    (typeof brandCount === "number"
                        ? `${brandCount} برند از کاتالوگ و خودروهای ثبت‌شده`
                        : "")
                }
                error={errors.brand}
            />

            {modelFreeText ? (
                <FieldShell>
                    <label htmlFor={`${idPrefix}-model`} style={labelStyle}>
                        مدل
                    </label>

                    <input
                        id={`${idPrefix}-model`}
                        name="model"
                        type="text"
                        style={inputStyle}
                        value={form.model}
                        onChange={onChange}
                        disabled={disabled}
                        dir="ltr"
                        placeholder="نام مدل را لاتین بنویس"
                    />

                    <div style={hintStyle}>
                        این برند هنوز مدلی در کاتالوگ ندارد؛ همان‌جا بنویس — با ذخیره،
                        مدل هم در کاتالوگ ساخته می‌شود و دفعه‌ی بعد در لیست است.
                    </div>

                    {errors.model && <div style={errorTextStyle}>{errors.model}</div>}
                </FieldShell>
            ) : (
                <SelectField
                    idPrefix={idPrefix}
                    name="model"
                    label="مدل"
                    value={form.model}
                    groups={modelGroups}
                    onChange={onChange}
                    disabled={disabled || modelsLoading}
                    placeholder={
                        modelsLoading
                            ? "در حال دریافت مدل‌ها…"
                            : form.brand
                              ? `— مدل‌های ${form.brand} —`
                              : "— مدل همه‌ی برندها —"
                    }
                    hint={
                        form.brand
                            ? `مدل‌های ${form.brand} از کاتالوگ و لیست آماده‌ی بازار است.`
                            : "با انتخاب مدل، برند هم خودکار پر می‌شود."
                    }
                    error={errors.model}
                />
            )}

            <SelectField
                idPrefix={idPrefix}
                name="year"
                label="سال تولید"
                value={form.year}
                options={yearOptions}
                onChange={onChange}
                disabled={disabled}
                placeholder="— انتخاب سال —"
                error={errors.year}
            />

            <SelectField
                idPrefix={idPrefix}
                name="country"
                label="کشور"
                value={form.country}
                options={countryOptions}
                onChange={onChange}
                disabled={disabled}
                placeholder="— انتخاب کشور —"
                error={errors.country}
            />

            <SelectField
                idPrefix={idPrefix}
                name="dealership_name"
                label="نمایندگی / شو روم"
                value={form.dealership_name}
                options={dealershipOptions}
                onChange={onChange}
                disabled={disabled}
                placeholder="— انتخاب نمایندگی —"
                hint={
                    dealershipAvailable === false
                        ? "لیست نمایندگی‌ها در دسترس نیست"
                        : "اختیاری"
                }
                error={errors.dealership_name}
            />

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "12px",
                }}
            >
                {priceNames.map((name) => (
                    <PriceField
                        key={name}
                        idPrefix={idPrefix}
                        name={name}
                        label={labels?.[name] || priceLabels[name]}
                        value={form[name]}
                        onChange={onChange}
                        disabled={disabled}
                        error={errors[name]}
                        hint={name === "price_aed" ? "عدد — جداکننده هزارگان اختیاری است" : "خالی = صفر"}
                    />
                ))}
            </div>

            <FieldShell>
                <label htmlFor={`${idPrefix}-description`} style={labelStyle}>
                    توضیحات
                </label>

                <textarea
                    id={`${idPrefix}-description`}
                    name="description"
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical" }}
                    value={form.description}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder="مثلاً رنگ، کارکرد، وضعیت بدنه، کلید یدک…"
                />
            </FieldShell>
        </>
    );
}

export function FormMessage({ tone = "error", children }) {
    if (!children) {
        return null;
    }

    const palette =
        tone === "notice"
            ? { background: "#e8f5e9", color: "#1b5e20", border: "1px solid #a5d6a7" }
            : { background: "#fdecea", color: "#b71c1c", border: "1px solid #f5c6cb" };

    return (
        <div
            role={tone === "notice" ? "status" : "alert"}
            style={{
                ...palette,
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                lineHeight: "1.7",
                marginBottom: "14px",
            }}
        >
            {children}
        </div>
    );
}
