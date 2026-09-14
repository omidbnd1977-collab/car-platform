import React, { useState } from "react";
import { getImageUrl } from "../utils/imageUrl";
import dealerConfig from "../config/dealerConfig";
const PLACEHOLDER="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e0e0e0'/%3E%3C/svg%3E";
function isPrimary(v){return v===true||String(v).toLowerCase()==="true";}
function getImg(car){
  const imgs=(Array.isArray(car?.images)?car.images:[]).filter(i=>i?.image_url);
  if(!imgs.length)return "";
  const p=imgs.find(i=>isPrimary(i.is_primary))||(car?.primary_image_id!=null&&imgs.find(i=>String(i.id)===String(car.primary_image_id)))||imgs[0];
  return p?.image_url||"";
}
export default function CarCard({car,onViewDetails,onContactRequest}){
  const [h,sH]=useState(false);
  const src=getImg(car);
  const img=src?getImageUrl(src):PLACEHOLDER;
  const title=`${car?.brand_name||car?.brand||""} ${car?.model_name||car?.model||""}`.trim()||"خودرو";
  const price=car?.price_aed?Number(car.price_aed).toLocaleString("en-US"):"N/A";
  const contact=()=>{
    if(onContactRequest){onContactRequest(car);return;}
    const ph=String(dealerConfig.phone||"").trim();
    if(ph){window.location.href=`tel:${ph}`;return;}
    const wa=String(dealerConfig.whatsapp||"").trim().replace(/[^\d]/g,"");
    if(wa){window.open(`https://wa.me/${wa}`,"_blank","noopener");return;}
    alert("درخواست ثبت شد");
  };
  return (
    <div style={{width:"100%",background:"linear-gradient(145deg, #ffffff 0%, #f7f7f7 100%)",borderRadius:"20px",overflow:"hidden",border:"1px solid rgba(0,0,0,0.06)",boxShadow:h?"0 24px 55px rgba(0,0,0,0.20)":"0 10px 30px rgba(0,0,0,0.09)",transform:h?"translateY(-8px)":"translateY(0)",transition:"all 0.45s",display:"flex",flexDirection:"column"}} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}>
      <div style={{position:"relative",width:"100%",height:"215px",background:"#eee",overflow:"hidden"}}>
        <img src={img} alt={title} style={{width:"100%",height:"100%",objectFit:"cover",transform:h?"scale(1.06)":"scale(1)",transition:"transform 0.8s"}} />
        {car?.year&&<div style={{position:"absolute",top:"14px",left:"14px",background:"rgba(0,0,0,0.72)",color:"#fff",padding:"6px 11px",borderRadius:"20px",fontSize:"12px",fontWeight:"700"}}>{car.year}</div>}
      </div>
      <div style={{padding:"18px 18px 20px",display:"flex",flexDirection:"column",flexGrow:1}}>
        <h3 style={{margin:"0 0 12px",fontSize:"19px",color:"#111",fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{title}</h3>
        <div style={{display:"flex",justifyContent:"center",gap:"7px",marginBottom:"20px"}}><span style={{fontSize:"26px",fontWeight:900,color:"#111"}}>{price}</span><span style={{fontSize:"13px",fontWeight:800,color:"#8a8a8a"}}>{dealerConfig.currency}</span></div>
        <div style={{marginTop:"auto",display:"flex",border:"1.5px solid rgba(212,175,55,0.55)",borderRadius:"999px",overflow:"hidden",background:"#fff"}}>
          <button type="button" onClick={contact} dir="rtl" style={{flex:1,padding:"13px 8px",border:"none",background:"#fff",color:"#a97f2f",fontFamily:"Vazirmatn, Tahoma, sans-serif",fontSize:"15px",fontWeight:800,cursor:"pointer"}}>درخواست بازدید</button>
          <span style={{width:"1px",margin:"9px 0",background:"rgba(169,127,47,0.35)"}} />
          <button type="button" onClick={()=>onViewDetails&&onViewDetails(car)} dir="rtl" style={{flex:1,padding:"13px 8px",border:"none",background:"#fff",color:"#a97f2f",fontFamily:"Vazirmatn, Tahoma, Arial, sans-serif",fontSize:"15px",fontWeight:800,cursor:"pointer"}}>مشاهده جزئیات</button>
        </div>
      </div>
    </div>
  );
}
<<<<<<< HEAD

function cleanText(value) {
    return String(value == null ? "" : value).trim();
}

function CarCard({ car, onViewDetails, onContactRequest }) {
    const [hovered, setHovered] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);

    const imageSource = getCardImageSource(car);

    const image = imageSource ? getImageUrl(imageSource) : PLACEHOLDER_IMAGE;

    const brand = cleanText(car?.brand_name || car?.brand);
    const model = cleanText(car?.model_name || car?.model);

    const title = `${brand} ${model}`.trim() || "خودرو";

    const price = car?.price_aed
        ? Number(car.price_aed).toLocaleString("en-US")
        : "N/A";

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(car);
        }
    };

    const handleContactRequest = () => {
        if (onContactRequest) {
            onContactRequest(car);
            return;
        }

        setContactOpen(true);
    };

    return (
        <>
            {/* فونت Vazirmatn — همان فونت «خودروی ویژه» در صفحه‌ی جزئیات */}
            <link rel="preconnect" href={"ht" + "tps://fonts.googleapis.com"} />
            <link
                rel="preconnect"
                href={"ht" + "tps://fonts.gstatic.com"}
                crossOrigin="anonymous"
            />
            <link
                href={
                    ("ht" + "tps://fonts.googleapis.com/css2?") +
                    "family=Vazirmatn:wght@700;800&" +
                    "display=swap"
                }
                rel="stylesheet"
            />

            <div
                style={{
                    width: "100%",
                    minWidth: 0,

                    background:
                        "linear-gradient(145deg, #ffffff 0%, #f7f7f7 100%)",

                    borderRadius: "20px",
                    overflow: "hidden",

                    border: "1px solid rgba(0,0,0,0.06)",

                    boxShadow: hovered
                        ? "0 24px 55px rgba(0,0,0,0.20)"
                        : "0 10px 30px rgba(0,0,0,0.09)",

                    transition:
                        "transform 0.45s cubic-bezier(.22,1,.36,1), box-shadow 0.45s cubic-bezier(.22,1,.36,1)",

                    transform: hovered
                        ? "translateY(-8px)"
                        : "translateY(0)",

                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",

                    animation:
                        "carCardReveal 0.7s cubic-bezier(.22,1,.36,1) both",

                    position: "relative",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* IMAGE */}

                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "215px",
                        background: "#eeeeee",
                        overflow: "hidden",
                    }}
                >
                    <img
                        src={image}
                        alt={title}
                        loading="lazy"

                        onError={(event) => {
                            if (
                                event.currentTarget.src !== PLACEHOLDER_IMAGE
                            ) {
                                event.currentTarget.src = PLACEHOLDER_IMAGE;
                            }
                        }}

                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",

                            transform: hovered ? "scale(1.06)" : "scale(1)",

                            transition:
                                "transform 0.8s cubic-bezier(.22,1,.36,1)",
                        }}
                    />

                    {/* DARK IMAGE GRADIENT */}

                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: "38%",

                            background:
                                "linear-gradient(to top, rgba(0,0,0,0.40), transparent)",

                            pointerEvents: "none",
                        }}
                    />

                    {/* YEAR */}

                    {car?.year && (
                        <div
                            style={{
                                position: "absolute",
                                top: "14px",
                                left: "14px",

                                background: "rgba(0,0,0,0.72)",

                                color: "#fff",

                                padding: "6px 11px",
                                borderRadius: "20px",

                                fontSize: "12px",
                                fontWeight: "700",
                                letterSpacing: "0.5px",

                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",

                                border: "1px solid rgba(255,255,255,0.16)",
                            }}
                        >
                            {car.year}
                        </div>
                    )}
                </div>

                {/* CONTENT — حداقل اطلاعات */}

                <div
                    style={{
                        padding: "18px 18px 20px",

                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 1,
                    }}
                >
                    {/* BRAND + MODEL */}

                    <h3
                        title={title}
                        style={{
                            margin: "0 0 12px",

                            fontSize: "19px",
                            lineHeight: 1.35,

                            color: "#111",
                            fontWeight: 800,

                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {title}
                    </h3>

                    {/* PRICE */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "center",
                            gap: "7px",
                            flexWrap: "wrap",

                            marginBottom: "20px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "26px",
                                fontWeight: 900,
                                color: "#111",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            {price}
                        </span>

                        <span
                            style={{
                                fontSize: "13px",
                                fontWeight: 800,
                                color: "#8a8a8a",
                                letterSpacing: "0.5px",
                            }}
                        >
                            {dealerConfig.currency}
                        </span>
                    </div>

                    {/* ACTIONS — یک دکمه‌ی یکپارچه با دو قسمت (سفید با متن طلایی شامپاینی) */}

                    <div
                        style={{
                            marginTop: "auto",

                            display: "flex",
                            alignItems: "stretch",

                            border: "1.5px solid rgba(212,175,55,0.55)",
                            borderRadius: "999px",
                            overflow: "hidden",
                            background: "#ffffff",

                            textAlign: "center",
                        }}
                    >
                        {/* قسمت اول: درخواست بازدید */}

                        <button
                            type="button"
                            onClick={handleContactRequest}
                            aria-label={`درخواست بازدید یا تماس برای ${title}`}

                            dir="rtl"

                            style={{
                                flex: "1 1 0",
                                minWidth: 0,

                                padding: "13px 8px",

                                border: "none",
                                background: "#ffffff",
                                color: "#a97f2f",

                                cursor: "pointer",

                                fontFamily: "'Vazirmatn', Tahoma, Arial, sans-serif",
                                fontSize: "15px",
                                fontWeight: 800,
                                letterSpacing: "0",
                                lineHeight: 1.3,

                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",

                                transition: "background 0.3s ease",
                            }}

                            onMouseEnter={(event) => {
                                event.currentTarget.style.background = "#faf5e6";
                            }}

                            onMouseLeave={(event) => {
                                event.currentTarget.style.background = "#ffffff";
                            }}
                        >
                            درخواست بازدید
                        </button>

                        {/* خط جداکننده‌ی دو قسمت */}

                        <span
                            aria-hidden="true"
                            style={{
                                width: "1px",
                                alignSelf: "stretch",
                                margin: "9px 0",
                                background: "rgba(169,127,47,0.35)",
                            }}
                        />

                        {/* قسمت دوم: مشاهده جزئیات */}

                        <button
                            type="button"
                            onClick={handleViewDetails}
                            aria-label={`مشاهده جزئیات ${title}`}

                            dir="rtl"

                            style={{
                                flex: "1 1 0",
                                minWidth: 0,

                                padding: "13px 8px",

                                border: "none",
                                background: "#ffffff",
                                color: "#a97f2f",

                                cursor: "pointer",

                                fontFamily: "'Vazirmatn', Tahoma, Arial, sans-serif",
                                fontSize: "15px",
                                fontWeight: 800,
                                letterSpacing: "0",
                                lineHeight: 1.3,

                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",

                                transition: "background 0.3s ease",
                            }}

                            onMouseEnter={(event) => {
                                event.currentTarget.style.background = "#faf5e6";
                            }}

                            onMouseLeave={(event) => {
                                event.currentTarget.style.background = "#ffffff";
                            }}
                        >
                            مشاهده جزئیات
                        </button>
                    </div>
                </div>
            </div>

            {contactOpen && (
                <ContactModal
                    car={car}
                    onClose={() => setContactOpen(false)}
                />
            )}
        </>
    );
}

export default CarCard;
=======
>>>>>>> 68ce1b6 (fix: exact base like 9vv7 - 215px gold pill + phone)
