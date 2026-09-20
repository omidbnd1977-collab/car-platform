import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import AdminCars from "./pages/AdminCars";
import SoldCars from "./pages/SoldCars";
import QRPrintSheet from "./components/QRPrintSheet";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* خانه */}
                <Route path="/" element={<Home />} />
                
                {/* فروخته شده - حرفه‌ای */}
                <Route path="/sold" element={<SoldCars />} />
                
                {/* ادمین */}
                <Route path="/admin" element={<AdminCars />} />
                
                {/* QR چاپ */}
                <Route path="/qr" element={<QRPrintSheet />} />
                <Route path="/print-qr" element={<QRPrintSheet />} />
                <Route path="/qr/:id" element={<QRPrintSheet />} />
                <Route path="/print-qr/:id" element={<QRPrintSheet />} />
                
                {/* fallback - برای ?admin و #admin و ?sold قدیمی - به مسیر درست ریدایرکت */}
                <Route path="*" element={<LegacyRouteHandler />} />
            </Routes>
        </BrowserRouter>
    );
}

// برای سازگاری با لینک‌های قدیمی که با ?admin, #admin, ?sold کار می‌کردند
function LegacyRouteHandler() {
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    const path = window.location.pathname || "";

    const isQR = path.startsWith("/qr") || path.startsWith("/print-qr") || search.includes("qr") || search.includes("print") || hash.includes("qr");
    const isAdmin = search.includes("admin") || hash.includes("admin") || path.startsWith("/admin");
    const isSold = search.includes("sold") || hash.includes("sold") || path.startsWith("/sold");

    if (isQR) return <QRPrintSheet />;
    if (isAdmin) return <AdminCars />;
    if (isSold) return <SoldCars />;
    return <Home />;
}

export default App;
