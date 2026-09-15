import React from "react";
import Home from "./pages/Home";
import AdminCars from "./pages/AdminCars";
import QRPrintSheet from "./components/QRPrintSheet";
import "./App.css";
function App() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    const isQR = path === "/qr" || path === "/print-qr" || path.startsWith("/qr/") || path.startsWith("/print-qr/") || search.includes("qr") || search.includes("print") || hash.includes("qr");
    const isAdmin = !isQR && (path === "/admin" || path.startsWith("/admin/") || search.includes("admin") || hash.includes("admin"));
    if (isQR) return <QRPrintSheet />;
    if (isAdmin) return <AdminCars />;
    return <Home />;
}
export default App;
