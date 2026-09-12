// ------------------------------------------------------------
// محافظ روت‌های نوشتنی (admin guard)
// ------------------------------------------------------------
// دو راه ورود به پنل/API:
//   ۱) هدر  x-admin-key: <ADMIN_API_KEY>   (ساده، برای پنل ادمین)
//   ۲) هدر  Authorization: Bearer <JWT>    با role ادمین
//      (همان authMiddleware/roleMiddleware موجود، اگر JWT_SECRET ست باشد)
//
// اگر ADMIN_API_KEY تنظیم نشده باشد، گارد «خاموش» است تا سرویسِ
// جاری روی Render بی‌صدا از کار نیفتد؛ در همین حالت یک هشدار در
// لاگ شروع و یک پرچم در  GET /api/admin/status  گذاشته می‌شود که
// پنل هم آن را به‌صورت بنر نشان می‌دهد. با یک  env  ساده روشن می‌شود.
// ------------------------------------------------------------

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const HEADER = "x-admin-key";
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

let warned = false;

function configuredKey() {
    return String(
        process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD || ""
    ).trim();
}

function isGuardEnabled() {
    return configuredKey().length > 0;
}

function logGuardState() {
    if (warned) {
        return;
    }

    warned = true;

    const key = configuredKey();

    if (!key) {
        console.warn(
            "ADMIN GUARD: خاموش (ADMIN_API_KEY تنظیم نشده). " +
                "روت‌های نوشتنی /api/cars و /api/catalog برای همه باز است. " +
                "برای بستنشان در Render یک مقدار طولانی برای ADMIN_API_KEY بگذارید."
        );

        return;
    }

    console.log(
        "ADMIN GUARD: روشن — درخواست‌های نوشتنی نیاز به " +
            HEADER +
            " یا توکن ادمین دارند (کلید " +
            key.length +
            " حرفی)."
    );
}

// مقایسه‌ی پایدار از نظر زمان، بدون لو رفتن طول کلید
function safeEquals(sent, expected) {
    const a = crypto.createHash("sha256").update(String(sent)).digest();
    const b = crypto.createHash("sha256").update(String(expected)).digest();

    return crypto.timingSafeEqual(a, b);
}

function readBearer(req) {
    const header = String(req.headers.authorization || "").trim();

    if (!header.toLowerCase().startsWith("bearer ")) {
        return "";
    }

    return header.slice(7).trim();
}

function adminFromJwt(req) {
    const secret = String(process.env.JWT_SECRET || "").trim();
    const token = readBearer(req);

    if (!secret || !token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, secret);
        const role = String(decoded?.role || "").toUpperCase();

        if (!ADMIN_ROLES.includes(role)) {
            return null;
        }

        return decoded;
    } catch (error) {
        return null;
    }
}

function adminGuard(req, res, next) {
    logGuardState();

    const expected = configuredKey();

    if (!expected) {
        req.isAdmin = true;

        return next();
    }

    const jwtUser = adminFromJwt(req);

    if (jwtUser) {
        req.user = jwtUser;
        req.isAdmin = true;

        return next();
    }

    const sent = String(req.headers[HEADER] || "").trim();

    if (sent && safeEquals(sent, expected)) {
        req.isAdmin = true;

        return next();
    }

    return res.status(401).json({
        error:
            "رمز ورود ادمین لازم است. " +
            (sent
                ? "کلیدی که فرستادی با ADMIN_API_KEY سرور فرق دارد."
                : "هدر «" + HEADER + "» را بفرست (در پنل: دکمه‌ی «رمز ورود»)."),
        code: "ADMIN_KEY_REQUIRED",
    });
}

// GET /api/admin/status — عمومی است تا پنل بفهمد گارد روشن است یا نه
function guardStatus(req, res) {
    logGuardState();

    return res.json({
        enabled: isGuardEnabled(),
        header: HEADER,
        jwt_enabled: Boolean(String(process.env.JWT_SECRET || "").trim()),
    });
}

logGuardState();

module.exports = adminGuard;
module.exports.adminGuard = adminGuard;
module.exports.guardStatus = guardStatus;
module.exports.isGuardEnabled = isGuardEnabled;
module.exports.ADMIN_KEY_HEADER = HEADER;
