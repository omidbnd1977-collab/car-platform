import React from "react";
import Home from "./pages/Home";
import AdminCars from "./pages/AdminCars";
import "./App.css";

function App() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";

    if (path === "/admin") {
        return <AdminCars />;
    }

    return <Home />;
}

export default App;