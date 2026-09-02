const API_ORIGIN = "https://car-platform-db.onrender.com";

export function getImageUrl(value) {
    if (!value) {
        return "";
    }

    const url = String(value).trim();

    if (!url) {
        return "";
    }

    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
        return url;
    }

    if (url.indexOf("/") === 0) {
        return API_ORIGIN + url;
    }

    return API_ORIGIN + "/" + url;
}

export default getImageUrl;
