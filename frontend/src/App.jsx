import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import AdminCars from "./pages/AdminCars";
import SoldCars from "./pages/SoldCars";
import QRPrintSheet from "./components/QRPrintSheet";
import "./App.css";

function getRoute() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const search = window.location.search || "";
    const hash = window.location.hash || "";

    const isQR =
        path === "/qr" ||
        path === "/print-qr" ||
        path.startsWith("/qr/") ||
        path.startsWith("/print-qr/") ||
        search.includes("qr") ||
        search.includes("print") ||
        hash.includes("qr");

    const isAdmin =
        !isQR &&
        (path === "/admin" ||
            path.startsWith("/admin/") ||
            search.includes("admin") ||
            hash.includes("admin"));

    const isSold =
        !isQR &&
        !isAdmin &&
        (path === "/sold" ||
            path.startsWith("/sold/") ||
            search.includes("sold") ||
            hash.includes("sold"));

    if (isQR) return "qr";
    if (isAdmin) return "admin";
    if (isSold) return "sold";
    return "home";
}

function App() {
    const [route, setRoute] = useState(() => getRoute());

    useEffect(() => {
        const onChange = () => setRoute(getRoute());
        window.addEventListener("hashchange", onChange);
        window.addEventListener("popstate", onChange);
        return () => {
            window.removeEventListener("hashchange", onChange);
            window.removeEventListener("popstate", onChange);
        };
    }, []);

    if (route === "qr") return <QRPrintSheet />;
    if (route === "admin") return <AdminCars />;
    if (route === "sold") return <SoldCars />;
    return <Home />;
}

export default App;
