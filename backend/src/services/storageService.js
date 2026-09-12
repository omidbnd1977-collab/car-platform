/**
 * ============================================================
 *  STORAGE SERVICE  (local / S3 / Cloudflare R2)
 * ============================================================
 *
 * چرا این فایل اضافه شد؟
 * فایل‌سیستم Render موقت (ephemeral) است: هر فایلی که روی دیسک
 * نوشته شود با هر دیپلوی، ری‌استارت یا spin-down پاک می‌شود
 * (دیسک ماندگار فقط در پلن پولی وجود دارد). بنابراین عکس‌هایی
 * که multer روی دیسک ذخیره می‌کرد بعد از هر دیپلوی ناپدید
 * می‌شدند و همه‌ی لینک‌های /uploads/... با ۴۰۴ برمی‌گشتند.
 *
 * این سرویس محل ذخیره را از کد جدا می‌کند:
 *   - STORAGE_PROVIDER ست‌نشده / local  →  دیسک (رفتار قبلی، بدون تغییر)
 *   - STORAGE_PROVIDER=s3                →  AWS S3 (یا هر S3 سازگار)
 *   - STORAGE_PROVIDER=r2                →  Cloudflare R2
 *
 * متغیرهای محیطی حالت خارجی:
 *   S3_BUCKET            نام باکت (ضروری)
 *   S3_ACCESS_KEY_ID     کلید دسترسی (ضروری)
 *   S3_SECRET_ACCESS_KEY کلید مخفی (ضروری)
 *   S3_REGION            منطقه؛ برای R2 مقدار auto کافی است
 *   S3_ENDPOINT          فقط برای R2 / سرویس‌های سازگار
 *   S3_PUBLIC_BASE_URL   دامنه‌ی عمومی‌ی عکس‌ها (برای R2 ضروری)
 *   S3_KEY_PREFIX        پیشوند اختیاری کلید آبجکت‌ها
 *   S3_CANNED_ACL        پیش‌فرض: public-read فقط برای S3 خالص
 *   S3_FORCE_PATH_STYLE  true → آدرس‌دهی path-style
 *
 * برای سبک ماندن npm install روی Render، این فایل به پکیج خارجی
 * (مثل @aws-sdk/client-s3) نیاز ندارد و درخواست‌ها را خودش با
 * AWS Signature V4 امضا می‌کند.
 * ============================================================
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ---------------------------------------------------------
// ثابت‌های حالت محلی
// ---------------------------------------------------------

// پیشوندی که express.static زیر آن سرو می‌شود (در server.js).
const URL_PREFIX = "/uploads";

// ریشه‌ی پوشه‌ی آپلود در حالت محلی (مثل قبل: backend/uploads).
const LOCAL_ROOT = path.join(process.cwd(), "uploads");

// زیرپوشه‌ی پیش‌فرض عکس‌های خودرو.
const DEFAULT_FOLDER = "cars";

const EXTENSION_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/pjpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
};

const CONTENT_TYPE_BY_EXTENSION = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".avif": "image/avif",
};

// نام فایل شامل تایم‌ستَمپ یکتا است، پس محتوا عوض‌نشدنی است.
const PUBLIC_CACHE_CONTROL = "public, max-age=31536000, immutable";

// سقف زمان هر درخواست به استورج خارجی (میلی‌ثانیه)
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

function getRequestTimeoutMs() {
    const raw = Number(process.env.S3_TIMEOUT_MS);

    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_REQUEST_TIMEOUT_MS;
}

// ---------------------------------------------------------
// ابزارهای عمومی
// ---------------------------------------------------------

function trimSlashes(value) {
    return String(value == null ? "" : value)
        .trim()
        .replace(/^\/+|\/+$/g, "");
}

function normalizeProvider(value) {
    const name = String(value || "local").trim().toLowerCase();

    if (name === "s3" || name === "s3-compatible" || name === "aws") {
        return "s3";
    }

    if (name === "r2" || name === "cloudflare" || name === "cloudflare-r2" || name === "r2-s3") {
        return "r2";
    }

    return "local";
}

function getProvider() {
    return normalizeProvider(process.env.STORAGE_PROVIDER);
}

function isExternal() {
    return getProvider() !== "local";
}

// فقط در حالت محلی خودمان فایل را از دیسک سرو می‌کنیم؛
// در حالت خارجی دامنه‌ی استورج این کار را انجام می‌دهد.
function servesLocalFiles() {
    return getProvider() === "local";
}

function getLocalUploadsDir() {
    return LOCAL_ROOT;
}

function getUrlPrefix() {
    return URL_PREFIX;
}

function ensureLocalDirs() {
    if (isExternal()) {
        return LOCAL_ROOT;
    }

    fs.mkdirSync(path.join(LOCAL_ROOT, DEFAULT_FOLDER), { recursive: true });

    return LOCAL_ROOT;
}

function safeExtension(fileName, mimeType) {
    const fromMime = EXTENSION_BY_MIME[String(mimeType || "").toLowerCase()];

    if (fromMime) {
        return fromMime;
    }

    const ext = path
        .extname(String(fileName || ""))
        .toLowerCase()
        .replace(/[^.a-z0-9]/g, "");

    // .jfif عملاً jpeg است؛ یکسان‌سازی می‌شود تا content-type
    // درست بگیرد و پسوند در URL تمیز بماند.
    if (ext === ".jfif" || ext === ".jpeg") {
        return ".jpg";
    }

    return CONTENT_TYPE_BY_EXTENSION[ext] ? ext : ".jpg";
}

function contentTypeFor(fileName, mimeType) {
    const clean = String(mimeType || "").toLowerCase();

    if (EXTENSION_BY_MIME[clean]) {
        return clean === "image/jpg" || clean === "image/pjpeg" ? "image/jpeg" : clean;
    }

    if (/^image\/(png|webp|gif|avif|jpeg)$/.test(clean)) {
        return clean;
    }

    return CONTENT_TYPE_BY_EXTENSION[safeExtension(fileName, mimeType)] || "image/jpeg";
}

function buildObjectKey(fileName, mimeType, folder) {
    const dir = trimSlashes(folder) || DEFAULT_FOLDER;
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

    // حفظ الگوی نام‌گذاری قبلی (car-<timestamp>) تا فایل‌های
    // محلی و خارجی شکل یکسانی داشته باشند.
    return `${dir}/car-${unique}${safeExtension(fileName, mimeType)}`;
}

// تبدیل آدرس نسبی/مطلق به مسیر امن داخل LOCAL_ROOT
function resolveLocalPath(reference) {
    const raw = String(reference || "").trim();

    if (!raw) {
        return null;
    }

    let relative = raw;

    if (relative.startsWith(URL_PREFIX + "/")) {
        relative = relative.slice(URL_PREFIX.length + 1);
    } else if (/^https?:\/\//i.test(relative)) {
        try {
            relative = decodeURIComponent(new URL(relative).pathname).replace(/^\/+/, "");
        } catch (error) {
            return null;
        }
    } else if (relative.startsWith("/")) {
        relative = relative.slice(1);
    }

    const absolute = path.resolve(LOCAL_ROOT, relative);
    const root = path.resolve(LOCAL_ROOT);

    // محافظت در برابر path traversal
    if (absolute !== root && !absolute.startsWith(root + path.sep)) {
        return null;
    }

    return absolute;
}

// ---------------------------------------------------------
// تنظیمات S3 / R2
// ---------------------------------------------------------

let cachedConfig;

function resetConfigCache() {
    cachedConfig = undefined;
}

function getS3Config() {
    if (cachedConfig !== undefined) {
        return cachedConfig;
    }

    const provider = getProvider();

    if (provider === "local") {
        cachedConfig = null;

        return cachedConfig;
    }

    const env = process.env;

    const bucket = trimSlashes(env.S3_BUCKET || env.AWS_S3_BUCKET);
    const region = String(
        env.S3_REGION || env.AWS_REGION || (provider === "r2" ? "auto" : "us-east-1")
    ).trim();
    const accessKeyId = String(env.S3_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = String(
        env.S3_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY || ""
    ).trim();
    const keyPrefix = trimSlashes(env.S3_KEY_PREFIX);

    let endpoint = null;
    let endpointError = null;

    try {
        endpoint = normalizeEndpoint(env.S3_ENDPOINT);
    } catch (error) {
        endpointError = error.message;
    }

    // R2 و سرویس‌های سازگار path-style می‌خواهند.
    const forcePathStyle =
        env.S3_FORCE_PATH_STYLE === "true" || env.S3_FORCE_PATH_STYLE === "1" || Boolean(endpoint);

    const cannedAcl =
        env.S3_CANNED_ACL === undefined
            ? provider === "s3" && !endpoint
                ? "public-read"
                : ""
            : String(env.S3_CANNED_ACL).trim();

    const missing = [];

    if (endpointError) missing.push(endpointError);
    if (provider === "r2" && !endpoint) {
        missing.push("S3_ENDPOINT (برای Cloudflare R2 الزامی است)");
    }

    if (!bucket) missing.push("S3_BUCKET");
    if (!accessKeyId) missing.push("S3_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("S3_SECRET_ACCESS_KEY");

    const publicBaseUrl = normalizePublicBaseUrl(env.S3_PUBLIC_BASE_URL);

    if (missing.length) {
        cachedConfig = {
            provider,
            error:
                `STORAGE_PROVIDER=${provider} است ولی پیکربندی کامل نیست → ` +
                missing.join(" | "),
        };

        return cachedConfig;
    }

    cachedConfig = {
        provider,
        bucket,
        region,
        accessKeyId,
        secretAccessKey,
        endpoint,
        publicBaseUrl,
        keyPrefix,
        forcePathStyle,
        cannedAcl,
        error: null,
    };

    return cachedConfig;
}

function normalizeEndpoint(value) {
    const raw = String(value || "").trim();

    if (!raw) {
        return null;
    }

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    let url;

    try {
        url = new URL(withProtocol);
    } catch (error) {
        throw new Error("S3_ENDPOINT آدرس معتبری نیست: " + raw);
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("S3_ENDPOINT فقط می‌تواند http/https باشد: " + raw);
    }

    return url;
}

function normalizePublicBaseUrl(value) {
    const raw = String(value || "").trim();

    if (!raw) {
        return "";
    }

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    return trimSlashes(withProtocol);
}

// ------------------------------------------------------------
// ساخت مقصد درخواست (origin + مسیر کدشده + host)
// ------------------------------------------------------------

function buildRequestTarget(config, key) {
    const encodedKey = String(key)
        .split("/")
        .map((segment) => encodeRfc3986(segment))
        .join("/");

    if (config.endpoint) {
        // اگر endpoint مسیر پایه داشته باشد (مثل /account/bucket)
        // آن مسیر هم بخشی از canonical URI برای امضا است.
        const basePath = trimSlashes(
            decodeURIComponent(config.endpoint.pathname || "")
        );

        const segments = [];

        if (basePath) {
            segments.push(
                ...basePath.split("/").map((segment) => encodeRfc3986(segment))
            );
        }

        if (config.forcePathStyle) {
            segments.push(encodeRfc3986(config.bucket));
        }

        segments.push(encodedKey);

        return {
            origin: config.endpoint.origin,
            host: config.endpoint.host,
            objectPath: "/" + segments.join("/"),
        };
    }

    if (config.forcePathStyle) {
        return {
            origin: `https://s3.${config.region}.amazonaws.com`,
            host: `s3.${config.region}.amazonaws.com`,
            objectPath: "/" + config.bucket + "/" + encodedKey,
        };
    }

    return {
        origin: `https://${config.bucket}.s3.${config.region}.amazonaws.com`,
        host: `${config.bucket}.s3.${config.region}.amazonaws.com`,
        objectPath: "/" + encodedKey,
    };
}

function encodeRfc3986(value) {
    return encodeURIComponent(value).replace(
        /[!'()*]/g,
        (char) => "%" + char.charCodeAt(0).toString(16).toUpperCase()
    );
}

function fullUrlFor(config, key) {
    const prefixedKey = config.keyPrefix ? `${config.keyPrefix}/${key}` : key;

    if (config.publicBaseUrl) {
        return `${config.publicBaseUrl}/${prefixedKey}`;
    }

    // باکت عمومی S3 بدون دامنه‌ی اختصاصی
    if (config.provider === "s3" && !config.endpoint) {
        const target = buildRequestTarget(config, prefixedKey);

        return target.origin + target.objectPath;
    }

    throw new Error(
        "storageService: برای استورج خارجی باید S3_PUBLIC_BASE_URL ست شود " +
            "(دامنه‌ی عمومی R2، custom domain یا CDN)."
    );
}

// ---------------------------------------------------------
// امضای AWS Signature V4
// ---------------------------------------------------------

function hmac(key, value) {
    return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256Hex(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

const SIGNED_HEADER_ALLOWLIST = [
    "cache-control",
    "content-type",
    "host",
    "x-amz-acl",
    "x-amz-content-sha256",
    "x-amz-date",
];

function buildAuthorization({ method, config, target, headers, payloadHash, amzDate }) {
    const dateStamp = amzDate.slice(0, 8);

    const signedNames = Object.keys(headers)
        .map((name) => name.toLowerCase())
        .filter((name) => SIGNED_HEADER_ALLOWLIST.includes(name))
        .sort();

    const canonicalHeaders = signedNames
        .map((name) => `${name}:${String(headers[name]).trim().replace(/\s+/g, " ")}\n`)
        .join("");

    const canonicalRequest = [
        method,
        target.objectPath,
        "", // بدون query string
        canonicalHeaders,
        signedNames.join(";"),
        payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;

    const stringToSign = [
        "AWS4-HMAC-SHA256",
        amzDate,
        credentialScope,
        sha256Hex(canonicalRequest),
    ].join("\n");

    // زنجیره‌ی کلید امضا (key derivation):
    const kDate = hmac("AWS4" + config.secretAccessKey, dateStamp);
    const kRegion = hmac(kDate, config.region);
    const kService = hmac(kRegion, "s3");
    const kSigning = hmac(kService, "aws4_request");

    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    return (
        `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedNames.join(";")}, Signature=${signature}`
    );
}

async function s3Request(method, key, body, extraHeaders = {}) {
    const config = getS3Config();

    if (!config) {
        throw new Error("storageService: provider محلی است؛ درخواست S3 ارسال نمی‌شود.");
    }

    if (config.error) {
        throw new Error("storageService: " + config.error);
    }

    const prefixedKey = config.keyPrefix ? `${config.keyPrefix}/${key}` : key;
    const target = buildRequestTarget(config, prefixedKey);

    const payload = body === undefined || body === null ? null : Buffer.from(body);
    const payloadHash = sha256Hex(payload || Buffer.alloc(0));
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");

    const headers = {
        host: target.host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
    };

    for (const [name, value] of Object.entries(extraHeaders || {})) {
        if (value !== undefined && value !== null && value !== "") {
            headers[name.toLowerCase()] = String(value);
        }
    }

    if (method === "PUT" && config.cannedAcl) {
        headers["x-amz-acl"] = config.cannedAcl;
    }

    const authorization = buildAuthorization({
        method,
        config,
        target,
        headers,
        payloadHash,
        amzDate,
    });

    let response;

    try {

        response = await fetch(target.origin + target.objectPath, {
            method,
            headers: { ...headers, authorization },
            body: method === "PUT" ? payload : undefined,
            // بدون timeout، یک استورج بی‌پاسق درخواست آپلود را
            // تا ابد باز نگه می‌دارد و فرانت‌اند فقط spinner می‌بیند.
            signal: AbortSignal.timeout(getRequestTimeoutMs()),
        });

    }
    catch (networkError) {

        const reason =
            networkError?.cause?.message || networkError.message;

        throw new Error(
            `storageService: اتصال به ${target.origin} برقرار نشد (${reason}). ` +
                "S3_ENDPOINT / شبکه را بررسی کنید."
        );

    }

    if (!response.ok) {
        const text = await response.text().catch(() => "");

        throw new Error(
            `S3 ${method} ناموفق بود (HTTP ${response.status}): ` +
                (text.replace(/\s+/g, " ").trim().slice(0, 300) || response.statusText)
        );
    }

    return response;
}

// ---------------------------------------------------------
// API اصلی
// ---------------------------------------------------------

/**
 * ذخیره‌ی فایل آپلودشده (req.file از multer با memoryStorage).
 * @returns {Promise<{url: string, key: string, provider: string, size: number}>}
 */
async function saveFile(file, options = {}) {
    if (!file) {
        throw new Error("storageService.saveFile: فایلی ارسال نشده است.");
    }

    let buffer = file.buffer;

    if (!buffer && file.path) {
        buffer = fs.readFileSync(file.path);
    }

    if (!buffer || !buffer.length) {
        throw new Error(
            "storageService.saveFile: محتوای فایل خالی است؛ upload.js باید memoryStorage استفاده کند."
        );
    }

    const fileName = file.originalname || file.name || "image.jpg";
    const mimeType = file.mimetype || file.type;
    const key = options.key || buildObjectKey(fileName, mimeType, options.folder);

    // ---------------- حالت محلی ----------------
    if (!isExternal()) {
        const absolute = path.join(LOCAL_ROOT, key);

        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        fs.writeFileSync(absolute, buffer);

        return {
            url: `${URL_PREFIX}/${key}`,
            key,
            provider: "local",
            size: buffer.length,
        };
    }

    // ---------------- حالت خارجی (s3 / r2) ----------------
    const config = getS3Config();

    if (config.error) {
        throw new Error("storageService: " + config.error);
    }

    const url = fullUrlFor(config, key);

    await s3Request("PUT", key, buffer, {
        "content-type": contentTypeFor(fileName, mimeType),
        "cache-control": PUBLIC_CACHE_CONTROL,
    });

    return {
        url,
        key,
        provider: config.provider,
        size: buffer.length,
    };
}

/**
 * حذف فیزیکِ فایل. آدرس نسبی محلی (legacy) و آدرس کامل خارجی
 * هر دو پشتیبانی می‌شوند. خطای حذف فقط لاگ می‌شود تا عملیات
 * حذف رکورد در دیتابیس شکست‌ناپذیر بماند.
 */
async function deleteFile(reference) {
    const raw = String(reference || "").trim();

    if (!raw) {
        return { deleted: false, reason: "empty reference" };
    }

    const looksLocal = raw.startsWith(URL_PREFIX + "/") || (!/^https?:\/\//i.test(raw) && !isExternal());

    if (looksLocal) {
        const absolute = resolveLocalPath(raw);

        if (!absolute || !fs.existsSync(absolute)) {
            return { deleted: false, reason: "file not found on local disk" };
        }

        try {
            fs.unlinkSync(absolute);

            return { deleted: true, provider: "local", key: raw };
        } catch (error) {
            console.log("STORAGE DELETE ERROR (local):", error.message);

            return { deleted: false, reason: error.message };
        }
    }

    const config = getS3Config();

    if (!config || config.error) {
        return { deleted: false, reason: config ? config.error : "external storage is not configured" };
    }

    let key = raw;

    if (config.publicBaseUrl && raw.startsWith(config.publicBaseUrl)) {
        key = raw.slice(config.publicBaseUrl.length).replace(/^\/+/, "");
    } else {
        try {
            key = decodeURIComponent(new URL(raw).pathname).replace(/^\/+/, "");
        } catch (error) {
            key = raw.replace(/^https?:\/\/[^/]+\//, "");
        }

        if (config.forcePathStyle && key.startsWith(config.bucket + "/")) {
            key = key.slice(config.bucket.length + 1);
        }
    }

    if (config.keyPrefix && key.startsWith(config.keyPrefix + "/")) {
        key = key.slice(config.keyPrefix.length + 1);
    }

    try {
        await s3Request("DELETE", key);

        return { deleted: true, provider: config.provider, key };
    } catch (error) {
        console.log("STORAGE DELETE ERROR (s3):", error.message);

        return { deleted: false, reason: error.message };
    }
}

/**
 * نمایش عمومی یک آدرس ذخیره‌شده. در حالت محلی دست‌نخورده
 * برمی‌گردد؛ در حالت خارجی آدرس‌های قدیمیِ /uploads/... را به
 * دامنه‌ی عمومی استورج تبدیل می‌کند (تا با کپی فایل‌ها در باکت،
 * رکوردهای قبلی هم نمایش داده شوند).
 */
function toPublicUrl(storedValue) {
    const raw = String(storedValue || "").trim();

    if (!raw || !isExternal()) {
        return raw;
    }

    const config = getS3Config();

    if (!config || config.error || !config.publicBaseUrl) {
        return raw;
    }

    if (raw.startsWith(URL_PREFIX + "/")) {
        return `${config.publicBaseUrl}/${raw.slice(URL_PREFIX.length + 1)}`;
    }

    return raw;
}

/**
 * خلاصه‌ی تنظیمات برای لاگ شروع سرور (هیچ کلیدی در آن نیست).
 */
function describe() {
    const provider = getProvider();

    if (provider === "local") {
        return {
            provider: "local",
            dir: LOCAL_ROOT,
            urlPrefix: URL_PREFIX,
        };
    }

    const config = getS3Config();

    return {
        provider,
        bucket: config && !config.error ? config.bucket : null,
        region: config && !config.error ? config.region : null,
        endpoint: config && !config.error && config.endpoint ? config.endpoint.origin : null,
        publicBaseUrl: config && !config.error ? config.publicBaseUrl || null : null,
        keyPrefix: config && !config.error ? config.keyPrefix || null : null,
        configured: Boolean(config) && !config.error,
        error: config ? config.error : null,
    };
}

module.exports = {
    URL_PREFIX,
    DEFAULT_FOLDER,
    PUBLIC_CACHE_CONTROL,
    LOCAL_ROOT,

    getProvider,
    isExternal,
    servesLocalFiles,
    getLocalUploadsDir,
    getUrlPrefix,
    ensureLocalDirs,

    buildObjectKey,
    contentTypeFor,
    getRequestTimeoutMs,

    saveFile,
    deleteFile,
    toPublicUrl,
    describe,

    // برای تست‌های واحد
    _internal: {
        getS3Config,
        resetConfigCache,
        buildRequestTarget,
        buildAuthorization,
        resolveLocalPath,
        safeExtension,
        normalizeProvider,
        fullUrlFor,
    },
};
