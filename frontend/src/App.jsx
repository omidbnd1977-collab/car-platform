import React from "react";
import Home from "./pages/Home";
import AdminCars from "./pages/AdminCars";
import SoldCars from "./pages/SoldCars";
import QRPrintSheet from "./components/QRPrintSheet";
import "./App.css";

function App() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const search = window.location.search || "";
    const hash = window.location.hash || "";

    // QR پرینت A4 حرفه‌ای - هر شاخه QR مخصوص خودش
    const isQR =
        path === "/qr" ||
        path === "/print-qr" ||
        path.startsWith("/qr/") ||
        path.startsWith("/print-qr/") ||
        search.includes("qr") ||
        search.includes("print") ||
        hash.includes("qr");

    // ادمین - پشتیبانی از /admin و ?admin (Render static 404 fix)
    const isAdmin =
        !isQR &&
        (path === "/admin" ||
            path.startsWith("/admin/") ||
            search.includes("admin") ||
            hash.includes("admin"));

    // صفحه خودروهای فروخته شده - حرفه‌ای
    const isSold =
        !isQR &&
        !isAdmin &&
        (path === "/sold" ||
            path.startsWith("/sold/") ||
            search.includes("sold") ||
            hash.includes("sold"));

    if (isQR) {
        return <QRPrintSheet />;
    }

    if (isAdmin) {
        return <AdminCars />;
    }

    if (isSold) {
        return <SoldCars />;
    }

    return <Home />;
}

export default App;
