import React from "react";
import Home from "./pages/Home";
import AdminCars from "./pages/AdminCars";
import "./App.css";

function App() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    const isAdmin =
        path === "/admin" ||
        path.startsWith("/admin/") ||
        search.includes("admin") ||
        hash.includes("admin");
    if (isAdmin) {
        return <AdminCars />;
    }
    return <Home />;
}

export default App;
