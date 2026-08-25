import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import CarCard from "../components/CarCard";
import CarDetails from "./CarDetails";
import { getImageUrl } from "../utils/imageUrl";
import dealerConfig from "../config/dealerConfig";

function Home() {
    const [cars, setCars] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedBrands, setSelectedBrands] = useState([]);
const [selectedYears, setSelectedYears] = useState([]);
const [minPrice, setMinPrice] = useState("");
const [maxPrice, setMaxPrice] = useState("");

    const [city, setCity] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
const [selectedCar, setSelectedCar] = useState(null);

const handleViewDetails = (car) => {
    console.log("========== FULL CAR DATA ==========");
    console.log(JSON.stringify(car, null, 2));
    console.log("===================================");

    setSelectedCar(car);
};

const [brands, setBrands] = useState([]);
const MARKET_BRANDS = [
    "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Cadillac",
    "Chevrolet", "Ferrari", "Ford", "Genesis", "GMC", "Honda",
    "Hyundai", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover",
    "Lexus", "Maserati", "McLaren", "Mercedes-Benz", "MINI", "Nissan",
    "Porsche", "Rolls-Royce", "Range Rover", "Toyota", "Volkswagen",
    "Volvo", "Tesla", "Maybach", "Alfa Romeo", "Dodge", "Infiniti",
    "Lincoln", "Lotus", "Mitsubishi", "Subaru", "Suzuki", "Chrysler",
    "Peugeot", "Renault", "Skoda", "Citroen", "Geely", "Chery",
    "BYD", "Jetour", "Zeekr", "Hongqi", "NIO", "Li Auto", "Tank",
    "GAC", "JAC", "Haval", "MG", "Omoda", "Exeed", "Forthing"
];
const [brandImageTick, setBrandImageTick] = useState(0);

useEffect(() => {
    const interval = window.setInterval(() => {
        setBrandImageTick((prev) => prev + 1);
    }, 3500);

    return () => window.clearInterval(interval);
}, []);

useEffect(() => {
    const getBrands = async () => {
        try {
            const response = await api.get("/catalog/brands");

            const list = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.data?.brands)
                    ? response.data.brands
                    : [];

            const apiBrands = list
        .map((item) =>
            String(item?.name || item?.brand_name || item?.brand || "").trim()
        )
        .filter(Boolean);

    setBrands(
        Array.from(
            new Map(
                [...MARKET_BRANDS, ...apiBrands].map((name) => [
                    name.toLowerCase(),
                    name,
                ])
            ).values()
        ).sort((a, b) => a.localeCompare(b))
    );
        } catch (err) {
            console.error("BRANDS ERROR:", err);
            setBrands([]);
        }
    };

    getBrands();
}, []);

    useEffect(() => {
        let mounted = true;

        const getCars = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/cars");
                const data = response?.data;

                // Supports both:
                // { cars: [...] }
                // and directly returned [...]
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.cars)
                        ? data.cars
                        : [];

                if (!mounted) return;

                setCars(list);

                if (!Array.isArray(data) && !Array.isArray(data?.cars)) {
                    console.warn("Unexpected /cars response:", data);
                }
            } catch (err) {
                console.error("CARS ERROR:", err);

                if (!mounted) return;

                setCars([]);
                setError(
                    err?.response?.data?.message ||
                    "Failed to load vehicles. Check the backend/API connection."
                );
            } finally {
                if (mounted) setLoading(false);
            }
        };

        getCars();

        return () => {
            mounted = false;
        };
    }, []);

    

    const cities = useMemo(
        () =>
            [...new Set(
                cars
                    .map((car) => String(car?.city || "").trim())
                    .filter(Boolean)
            )].sort(),
        [cars]
    );

    const brandImageGroups = useMemo(() => {
    const groups = new Map();

    cars.forEach((car) => {
        const brandName = String(
            car?.brand_name || car?.brand || ""
        ).trim();

        if (!brandName) return;

        const key = brandName.toLowerCase();

        const images = Array.isArray(car?.images)
            ? car.images
                  .map((image) => image?.image_url)
                  .filter(Boolean)
                  .map((url) => getImageUrl(url))
                  .filter(Boolean)
            : [];

        const existing = groups.get(key);

        if (existing) {
            existing.images.push(...images);
        } else {
            groups.set(key, {
                name: brandName,
                images: [...images],
            });
        }
    });

    return Array.from(groups.values())
        .map((brand) => ({
            ...brand,
            images: Array.from(new Set(brand.images)),
        }))
        .sort((a, b) =>
            a.name.localeCompare(b.name)
        );
}, [cars]);

const marqueeBrands = useMemo(() => {
    const imageMap = new Map(
        brandImageGroups.map((brand) => [
            brand.name.trim().toLowerCase(),
            brand.images,
        ])
    );

    const source = brands.length > 0 ? brands : MARKET_BRANDS;
    const items = source.map((name) => ({
        name,
        images: imageMap.get(name.trim().toLowerCase()) || [],
    }));

    return [...items, ...items, ...items, ...items, ...items, ...items];
}, [brands, brandImageGroups]);


    const filteredCars = useMemo(() => {
    const q = String(search).trim().toLowerCase();
    const c = String(city).trim().toLowerCase();

    const minP =
        minPrice === "" ? null : Number(minPrice);

    const maxP =
        maxPrice === "" ? null : Number(maxPrice);


    return cars.filter((car) => {

        const carBrand = String(
            car?.brand_name || car?.brand || ""
        )
            .trim()
            .toLowerCase();

        const carModel = String(
            car?.model_name || car?.model || ""
        )
            .trim()
            .toLowerCase();

        const carCity = String(car?.city || "")
            .trim()
            .toLowerCase();

        const carCountry = String(car?.country || "")
            .trim()
            .toLowerCase();

        const carPrice = Number(car?.price_aed || 0);
        const carYear = Number(car?.year || 0);

        const matchesSearch =
            !q ||
            carBrand.includes(q) ||
            carModel.includes(q) ||
            carCity.includes(q) ||
            carCountry.includes(q);

        const matchesBrand =
            selectedBrands.length === 0 ||
            selectedBrands.includes(carBrand);

        const matchesCity =
            !c || carCity === c;

        const matchesMinPrice =
            minP === null || carPrice >= minP;

        const matchesMaxPrice =
            maxP === null || carPrice <= maxP;

       

        

const matchesYear =
    selectedYears.length === 0 ||
    selectedYears.includes(carYear);

return (
    matchesSearch &&
    matchesBrand &&
    matchesCity &&
    matchesMinPrice &&
    matchesMaxPrice &&
    matchesYear
);
    });

}, [
    cars,
    search,
    city,
    selectedBrands,
    minPrice,
    maxPrice,
    selectedYears,
]);

   const clearFilters = () => {
    setSearch("");
    setSelectedBrands([]);
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedYears([]);
};

if (selectedCar) {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#050505",
                color: "#fff",
                fontFamily: "Arial, Helvetica, sans-serif",
                padding: "30px",
            }}
        >
            

           <CarDetails
    car={selectedCar}
    onBack={() => setSelectedCar(null)}
/>
        </div>
    );
}


return (
    <div
        style={{
            minHeight: "100vh",
            background: "#050505",
            color: "#fff",
            fontFamily: "Arial, Helvetica, sans-serif",
            overflowX: "hidden",
        }}
    >
        {/* HERO */}
        <section
                style={{
                    position: "relative",
                    width: "100%",
                    height: "430px",
                    minHeight: "430px",
                    background: "#050505",
                    overflow: "hidden",
                }}
            >
                <video
                    src="/hero.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        right: "7%",
                        bottom: "28px",
                        zIndex: 2,
                        direction: "rtl",
                        color: "#fff",
                        fontSize: "15px",
                        fontWeight: 800,
                        letterSpacing: "1.5px",
                        textShadow: "0 3px 18px rgba(0,0,0,0.85)",
                        padding: "8px 14px",
                        borderRight: "2px solid #d4af37",
                        background: "rgba(0,0,0,0.22)",
                        backdropFilter: "blur(3px)",
                    }}
                >
                    {dealerConfig.name}
                </div>
            </section>

            {/* BRAND TUNNEL / MARQUEE */}
            <section
                aria-label="Featured vehicle brands"
                style={{
                    width: "100%",
                    height: "62px",
                    padding: "7px 0",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    position: "relative",
                    background: "#050505",
                    borderTop: "1px solid rgba(212,175,55,0.18)",
                    borderBottom: "1px solid rgba(212,175,55,0.18)",
                    direction: "rtl",
                    scrollbarWidth: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: "7px 0",
                        border: "1px solid rgba(212,175,55,0.55)",
                        borderRadius: "999px",
                        pointerEvents: "none",
                        boxShadow: "inset 0 0 18px rgba(212,175,55,0.035)",
                    }}
                />

                <div
                    className="brand-tunnel-window"
                    style={{
                        width: "100%",
                        height: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        position: "relative",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    <div
                        className="brand-tunnel-track"
                        style={{
                            display: "flex",
                            width: "max-content",
                            minWidth: "100%",
                            height: "100%",
                            alignItems: "center",
                            whiteSpace: "nowrap",
                            direction: "rtl",
                            animation: "brandTunnelMove 90s linear infinite",
                            willChange: "transform",
                        }}
                    >
                        {marqueeBrands.map((brand, index) => (
                            <React.Fragment key={`${brand.name}-${index}`}>
                                <button
                                    type="button"
                                    aria-label={`Filter ${brand.name}`}
                                    onClick={() => {
                                        setSelectedBrands([brand.name.trim().toLowerCase()]);
                                        setSearch("");
                                        setSelectedYears([]);
                                        setMinPrice("");
                                        setMaxPrice("");
                                        setCity("");
                                    }}
                                    className="brand-tunnel-item"
                                    style={{
                                        border: 0,
                                        padding: "0 7px",
                                        margin: 0,
                                        background: "transparent",
                                        color: "rgba(255,255,255,0.78)",
                                        fontSize: "12px",
                                        lineHeight: 1,
                                        fontWeight: 650,
                                        letterSpacing: "1.05px",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        transition: "color 0.25s ease, text-shadow 0.25s ease, font-weight 0.25s ease",
                                    }}
                                >
                                    {brand.name}
                                </button>
                                <span
                                    aria-hidden="true"
                                    style={{
                                        color: "rgba(212,175,55,0.72)",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        padding: "0 1px",
                                        flex: "0 0 auto",
                                    }}
                                >
                                    →
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* MAIN */}
            <main
                style={{
                    width: "100%",
                    maxWidth: "1450px",
                    margin: "0 auto",
                    padding: "32px 28px 70px",
                    boxSizing: "border-box",
                }}
            >
                {/* IMPORTANT:
                    Both columns explicitly occupy ROW 1.
                    Filter = right, cards = left.
                    This prevents the cards from starting below the filter.
                */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) 300px",
                        gridTemplateRows: "auto",
                        gap: "28px",
                        alignItems: "start",
                        width: "100%",
                    }}
                >
                    {/* RESULTS / LEFT */}
                    <section
                        style={{
                            gridColumn: "1",
                            gridRow: "1",
                            minWidth: 0,
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "end",
                                gap: "20px",
                                marginBottom: "22px",
                                flexWrap: "wrap",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        color: "#777",
                                        fontSize: "11px",
                                        letterSpacing: "3px",
                                        fontWeight: 700,
                                        marginBottom: "7px",
                                    }}
                                >
                                    AVAILABLE VEHICLES
                                </div>

                                <h2
                                    style={{
                                        margin: 0,
                                        color: "#fff",
                                        fontSize: "30px",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    Cars
                                </h2>
                            </div>

                            <div
                                style={{
                                    padding: "9px 14px",
                                    borderRadius: "999px",
                                    background: "#111",
                                    border: "1px solid #292929",
                                    color: "#bbb",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                }}
                            >
                                {filteredCars.length}{" "}
                                {filteredCars.length === 1
                                    ? "vehicle"
                                    : "vehicles"}
                            </div>
                        </div>

                        {/* COMPACT SHARED CONTACT — between vehicle header and cards */}
                        <section
                            aria-label="Quick contact"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                                gap: "8px",
                                marginBottom: "18px",
                                direction: "rtl",
                            }}
                        >
                            {[
                                ["📞", "موبایل", dealerConfig.phone, `tel:${dealerConfig.phone}`],
                                ["💬", "WhatsApp", "تماس واتساپ", `https://wa.me/${dealerConfig.whatsapp}`],
                                ["◎", "Instagram", dealerConfig.shortName, dealerConfig.instagram],
                                ["📍", "آدرس شرکت", `${dealerConfig.city}, ${dealerConfig.country}`, "#"],
                            ].map(([icon, title, value, href]) => (
                                <a
                                    key={title}
                                    href={href}
                                    target={href.startsWith("http") ? "_blank" : undefined}
                                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                                    style={{
                                        minWidth: 0,
                                        height: "52px",
                                        padding: "7px 10px",
                                        boxSizing: "border-box",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        textDecoration: "none",
                                        color: "inherit",
                                        border: "1px solid rgba(212,175,55,0.28)",
                                        borderRadius: "10px",
                                        background: "rgba(212,175,55,0.025)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <span style={{ fontSize: "16px", width: "22px", flex: "0 0 22px", textAlign: "center" }}>{icon}</span>
                                    <span style={{ minWidth: 0, overflow: "hidden" }}>
                                        <span style={{ display: "block", color: "#d4af37", fontSize: "9px", fontWeight: 900, letterSpacing: "0.8px", whiteSpace: "nowrap" }}>{title}</span>
                                        <span style={{ display: "block", color: "#aaa", fontSize: "10px", fontWeight: 600, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
                                    </span>
                                </a>
                            ))}
                        </section>

                        {loading ? (
                            <div
                                style={{
                                    minHeight: "250px",
                                    display: "grid",
                                    placeItems: "center",
                                    background: "#0d0d0d",
                                    border: "1px solid #222",
                                    borderRadius: "18px",
                                    color: "#aaa",
                                }}
                            >
                                Loading vehicles...
                            </div>
                        ) : error ? (
                            <div
                                style={{
                                    minHeight: "220px",
                                    display: "grid",
                                    placeItems: "center",
                                    textAlign: "center",
                                    background: "#0d0d0d",
                                    border: "1px solid #422",
                                    borderRadius: "18px",
                                    padding: "30px",
                                    color: "#ff8d8d",
                                }}
                            >
                                <div>
                                    <strong>Vehicle API error</strong>
                                    <div style={{ marginTop: 8 }}>{error}</div>
                                </div>
                            </div>
                        ) : filteredCars.length === 0 ? (
                            <div
                                style={{
                                    minHeight: "220px",
                                    display: "grid",
                                    placeItems: "center",
                                    textAlign: "center",
                                    background: "#0d0d0d",
                                    border: "1px solid #222",
                                    borderRadius: "18px",
                                    padding: "30px",
                                    color: "#aaa",
                                }}
                            >
                                <div>
                                    <h3 style={{ margin: "0 0 8px", color: "#fff" }}>
                                        No cars found
                                    </h3>

                                    <p style={{ margin: "0 0 18px" }}>
                                        Try another search or clear the filters.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        style={{
                                            padding: "11px 18px",
                                            border: "1px solid #333",
                                            borderRadius: "9px",
                                            background: "#fff",
                                            color: "#050505",
                                            cursor: "pointer",
                                            fontWeight: 800,
                                        }}
                                    >
                                        CLEAR FILTERS
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(3, minmax(0, 1fr))",
                                    gap: "22px",
                                    alignItems: "start",
                                    width: "100%",
                                }}
                            >
                                {filteredCars.map((car) => (
    <CarCard
        key={car?.id ?? `${car?.brand_name}-${car?.model_name}`}
        car={car}
        onViewDetails={handleViewDetails}
    />
))}
                            </div>
                        )}
                    </section>

                    {/* FILTER / RIGHT */}
<aside
    style={{
        gridColumn: "2",
        gridRow: "1",
        alignSelf: "start",
        width: "100%",
        boxSizing: "border-box",

        background: "rgba(15, 15, 15, 0.88)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "22px",
        padding: "22px",

        boxShadow:
            "0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",

        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",

        direction: "rtl",
    }}
>
    <div style={{ marginBottom: "20px" }}>
        <div
            style={{
                fontSize: "11px",
                letterSpacing: "1.5px",
                fontWeight: 800,
                color: "#aaa",
                marginBottom: "7px",
                direction: "rtl",
            }}
        >
            فیلتر خودروها · FILTER VEHICLES
        </div>

        <h3
            style={{
                margin: 0,
                fontSize: "21px",
                color: "#fff",
            }}
        >
            خودرو پیدا کنید
        </h3>
    </div>

    {/* SEARCH */}
    <div style={{ marginBottom: "16px" }}>
        <label
            style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#aaa",
                marginBottom: "7px",
            }}
        >
            جستجو · SEARCH
        </label>

        <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="BMW، Mercedes، X5..."
            style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: "1px solid #333",
                borderRadius: "9px",
                outline: "none",
                fontSize: "14px",
                background: "#0a0a0a",
                color: "#fff",
                direction: "rtl",
            }}
        />
    </div>

    {/* PRICE */}
    <div style={{ marginBottom: "18px" }}>
        <label
            style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#aaa",
                marginBottom: "7px",
            }}
        >
            قیمت · PRICE ({dealerConfig.currency})
        </label>

        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
            }}
        >
            <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="از"
                min="0"
                style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px",
                    border: "1px solid #333",
                    borderRadius: "9px",
                    background: "#0a0a0a",
                    color: "#fff",
                    outline: "none",
                    direction: "rtl",
                }}
            />

            <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="تا"
                min="0"
                style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px",
                    border: "1px solid #333",
                    borderRadius: "9px",
                    background: "#0a0a0a",
                    color: "#fff",
                    outline: "none",
                    direction: "rtl",
                }}
            />
        </div>
    </div>

    {/* YEAR */}
    <div style={{ marginBottom: "18px" }}>
        <label
            style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#aaa",
                marginBottom: "9px",
            }}
        >
            سال خودرو · YEAR
        </label>

        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
            }}
        >
            {Array.from(
                { length: 12 },
                (_, index) => 2026 - index
            ).map((year) => (
                <label
                    key={year}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 10px",
                        border: selectedYears.includes(year)
    ? "1px solid rgba(255,255,255,0.35)"
    : "1px solid rgba(255,255,255,0.08)",

borderRadius: "12px",

background: selectedYears.includes(year)
    ? "rgba(255,255,255,0.10)"
    : "rgba(0,0,0,0.25)",

boxShadow: selectedYears.includes(year)
    ? "inset 0 0 18px rgba(255,255,255,0.04)"
    : "none",
                        color: "#fff",
                        cursor: "pointer",
                        direction: "rtl",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => {
                            setSelectedYears((prev) =>
                                prev.includes(year)
                                    ? prev.filter(
                                          (item) => item !== year
                                      )
                                    : [...prev, year]
                            );
                        }}
                    />

                    <span>{year}</span>
                </label>
            ))}
        </div>
    </div>

    {/* BRAND */}
    <div style={{ marginBottom: "18px" }}>
        <label
            style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#aaa",
                marginBottom: "9px",
            }}
        >
            برند · BRAND
        </label>

        <div
    style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        background: "rgba(0,0,0,0.28)",
        padding: "10px",
    }}
>
            {brands.map((item) => {
                const value = item.trim().toLowerCase();

                return (
                    <label
                        key={item}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 7px",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "13px",
                            minWidth: 0,
                            gridColumn: item.trim().length > 12 ? "1 / -1" : "auto",
                            border: selectedBrands.includes(value)
                                ? "1px solid rgba(212,175,55,0.75)"
                                : "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "10px",
                            background: selectedBrands.includes(value)
                                ? "rgba(212,175,55,0.10)"
                                : "rgba(0,0,0,0.18)",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={selectedBrands.includes(value)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedBrands((prev) => [
                                        ...prev,
                                        value,
                                    ]);
                                } else {
                                    setSelectedBrands((prev) =>
                                        prev.filter(
                                            (b) => b !== value
                                        )
                                    );
                                }
                            }}
                        />

                        <span
                            style={{
                                minWidth: 0,
                                whiteSpace: "nowrap",
                                overflow: "visible",
                                textOverflow: "clip",
                            }}
                        >
                            {item}
                        </span>
                    </label>
                );
            })}
        </div>
    </div>

    {/* LOCATION */}
    <div style={{ marginBottom: "18px" }}>
        <label
            style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#aaa",
                marginBottom: "7px",
            }}
        >
            موقعیت · LOCATION
        </label>

        <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: "1px solid rgba(255,255,255,0.10)",
borderRadius: "12px",
background: "rgba(0,0,0,0.30)",
                fontSize: "14px",
                cursor: "pointer",
                outline: "none",
                color: "#fff",
                direction: "rtl",
            }}
        >
            <option value="">
                همه موقعیت‌ها · All Locations
            </option>

            {cities.map((item) => (
                <option key={item} value={item}>
                    {item}
                </option>
            ))}
        </select>
    </div>

    {/* CLEAR FILTERS */}
    <button
        type="button"
        onClick={clearFilters}
        style={{
            width: "100%",
            padding: "12px 15px",
            border: "1px solid #333",
            borderRadius: "9px",
            background: "#fff",
            color: "#050505",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 800,
        }}
    >
        پاک کردن فیلترها · CLEAR FILTERS
    </button>

    {/* ACTIVE FILTERS */}
    {(search ||
        selectedBrands.length > 0 ||
        selectedYears.length > 0 ||
        minPrice ||
        maxPrice ||
        city) && (
        <div
            style={{
                marginTop: "18px",
                paddingTop: "16px",
                borderTop: "1px solid #292929",
            }}
        >
            <div
                style={{
                    fontSize: "11px",
                    letterSpacing: "1.5px",
                    fontWeight: 800,
                    color: "#777",
                    marginBottom: "10px",
                }}
            >
                ACTIVE FILTERS
            </div>

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "7px",
                }}
            >
                {search && (
                    <span
                        style={{
                            padding: "7px 9px",
                            borderRadius: "8px",
                            background: "#1d1d1d",
                            color: "#ddd",
                            fontSize: "12px",
                        }}
                    >
                        جستجو: {search}
                    </span>
                )}

                {selectedBrands.length > 0 && (
                    <span
                        style={{
                            padding: "7px 9px",
                            borderRadius: "8px",
                            background: "#1d1d1d",
                            color: "#ddd",
                            fontSize: "12px",
                        }}
                    >
                        برند: {selectedBrands.join("، ")}
                    </span>
                )}

                {selectedYears.length > 0 && (
                    <span
                        style={{
                            padding: "7px 9px",
                            borderRadius: "8px",
                            background: "#1d1d1d",
                            color: "#ddd",
                            fontSize: "12px",
                        }}
                    >
                        سال: {selectedYears.join("، ")}
                    </span>
                )}

                {minPrice && (
                    <span
                        style={{
                            padding: "7px 9px",
                            borderRadius: "8px",
                            background: "#1d1d1d",
                            color: "#ddd",
                            fontSize: "12px",
                        }}
                    >
                        از: {minPrice} {dealerConfig.currency}
                    </span>
                )}

                {maxPrice && (
                    <span
                        style={{
                            padding: "7px 9px",
                            borderRadius: "8px",
                            background: "#1d1d1d",
                            color: "#ddd",
                            fontSize: "12px",
                        }}
                    >
                        تا: {maxPrice} {dealerConfig.currency}
                    </span>
                )}

                {city && (
                    <span
                        style={{
                            padding: "7px 9px",
                            borderRadius: "8px",
                            background: "#1d1d1d",
                            color: "#ddd",
                            fontSize: "12px",
                        }}
                    >
                        شهر: {city}
                    </span>
                )}
            </div>
        </div>
    )}
</aside>
                </div>
            </main>

            {/* FOOTER */}
            <footer
                style={{
                    width: "100%",
                    padding: "26px 28px 30px",
                    boxSizing: "border-box",
                    borderTop: "1px solid rgba(212,175,55,0.18)",
                    background: "#050505",
                    textAlign: "center",
                }}
            >
                <div style={{ color: "#d4af37", fontSize: "12px", fontWeight: 900, letterSpacing: "2px" }}>{dealerConfig.name}</div>
                <div style={{ color: "#777", fontSize: "12px", marginTop: "6px" }}>شرکت فروش هوشمند خودرو در قشم</div>
            </footer>

            <style>
                {`
                    .brand-tunnel-item:hover {
                        color: #d4af37 !important;
                        font-weight: 900 !important;
                        text-shadow: 0 0 14px rgba(212,175,55,0.42);
                    }

                    .brand-tunnel-window::-webkit-scrollbar {
                        display: none;
                    }

                    .brand-tunnel-window:hover .brand-tunnel-track {
    animation-play-state: paused !important;
}

                    @keyframes brandTunnelMove {
                        from {
                            transform: translate3d(0, 0, 0);
                        }
                        to {
    transform: translate3d(16.6667%, 0, 0);
}
                    }

                    @media (max-width: 1050px) {
                        section[aria-label="Quick contact"] {
                            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        }

                        main > div {
                            grid-template-columns: minmax(0, 1fr) 270px !important;
                        }

                        main > div > section > div:last-child {
                            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        }
                    }

                    @media (max-width: 780px) {
                        section[aria-label="Dealer Contact"] > div > div:nth-child(4) {
                            grid-template-columns: 1fr !important;
                        }
                        main {
                            padding: 25px 15px 50px !important;
                        }

                        main > div {
                            grid-template-columns: 1fr !important;
                            grid-template-rows: auto auto !important;
                        }

                        main > div > section {
                            grid-column: 1 !important;
                            grid-row: 1 !important;
                        }

                        main > div > aside {
                            grid-column: 1 !important;
                            grid-row: 2 !important;
                            position: relative !important;
                            top: auto !important;
                        }

                        main > div > section > div:last-child {
                            grid-template-columns: 1fr !important;
                        }

                        section[aria-label="Available vehicle brands"] {
                            height: 92px !important;
                            padding: 11px 0 !important;
                        }

                        section[aria-label="Available vehicle brands"] button {
                            flex-basis: 128px !important;
                            width: 128px !important;
                            height: 68px !important;
                            border-radius: 13px !important;
                        }
                    }


                    @media (max-width: 780px) {
                        section[aria-label="Dealer Contact"] > div > div {
                            display: block !important;
                        }
                        section[aria-label="Dealer Contact"] > div > div > div:last-child {
                            margin-top: 24px;
                            grid-template-columns: 1fr !important;
                        }
                    }
@keyframes carCardReveal {
    from {
        opacity: 0;
        transform: translateY(24px) scale(0.98);
        filter: blur(4px);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }
}
                `}
            </style>
        </div>
    );
}

export default Home;

