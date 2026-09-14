import React, { useState } from "react";
import { getImageUrl } from "../utils/imageUrl";
import dealerConfig from "../config/dealerConfig";
const PLACEHOLDER_IMAGE="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E";
function isPrimaryFlag(v){return v===true||String(v).toLowerCase()==="true";}
function getCardImageSource(car){
  const images=(Array.isArray(car?.images)?car.images:[]).filter(i=>i?.image_url);
  if(!images.length)return "";
  const primary=images.find(i=>isPrimaryFlag(i.is_primary))||(car?.primary_image_id!=null&&images.find(i=>String(i.id)===String(car.primary_image_id)))||images[0];
  return primary?.image_url||"";
}
export default function CarCard({car,onViewDetails,onContactRequest}){
  const [hover,setHover]=useState(false);
  const imageSource=getCardImageSource(car);
  const image=imageSource?getImageUrl(imageSource):PLACEHOLDER_IMAGE;
  const title=`${car?.brand_name||car?.brand||""} ${car?.model_name||car?.model||""}`.trim()||"خودرو";
  const price=car?.price_aed?Number(car.price_aed).toLocaleString("en-US"):"N/A";
  const handleContact=()=>{
    if(onContactRequest){onContactRequest(car);return;}
    const phone=String(dealerConfig.phone||"").trim();
    if(phone){window.location.href=`tel:${phone}`;return;}
    const whatsapp=String(dealerConfig.whatsapp||"").trim().replace(/[^\d]/g,"");
    if(whatsapp){window.open(`https://wa.me/${whatsapp}`,"_blank","noopener");return;}
    alert("درخواست ثبت شد");
  };
  return (
    <div style={{width:"100%",minWidth:0,background:"linear-gradient(145deg, #ffffff 0%, #f7f7f7 100%)",borderRadius:"20px",overflow:"hidden",border:"1px solid rgba(0,0,0,0.06)",boxShadow:hover?"0 24px 55px rgba(0,0,0,0.20)":"0 10px 30px rgba(0,0,0,0.09)",transform:hover?"translateY(-8px)":"translateY(0)",transition:"all 0.45s",display:"flex",flexDirection:"column"}} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <div style={{position:"relative",width:"100%",height:"215px",background:"#eeeeee",overflow:"hidden"}}>
        <img src={image} alt={title} style={{width:"100%",height:"100%",objectFit:"cover",transform:hover?"scale(1.06)":"scale(1)",transition:"transform 0.8s"}} />
        {car?.year&&<div style={{position:"absolute",top:"14px",left:"14px",background:"rgba(0,0,0,0.72)",color:"#fff",padding:"6px 11px",borderRadius:"20px",fontSize:"12px",fontWeight:"700"}}>{car.year}</div>}
      </div>
      <div style={{padding:"18px 18px 20px",display:"flex",flexDirection:"column",flexGrow:1}}>
        <h3 style={{margin:"0 0 12px",fontSize:"19px",color:"#111",fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{title}</h3>
        <div style={{display:"flex",justifyContent:"center",gap:"7px",marginBottom:"20px"}}><span style={{fontSize:"26px",fontWeight:900,color:"#111"}}>{price}</span><span style={{fontSize:"13px",fontWeight:800,color:"#8a8a8a"}}>{dealerConfig.currency}</span></div>
        <div style={{marginTop:"auto",display:"flex",border:"1.5px solid rgba(212,175,55,0.55)",borderRadius:"999px",overflow:"hidden",background:"#fff"}}>
          <button type="button" onClick={handleContact} dir="rtl" style={{flex:1,padding:"13px 8px",border:"none",background:"#fff",color:"#a97f2f",fontFamily:"Vazirmatn, Tahoma, sans-serif",fontSize:"15px",fontWeight:800,cursor:"pointer"}}>درخواست بازدید</button>
          <span style={{width:"1px",margin:"9px 0",background:"rgba(169,127,47,0.35)"}} />
          <button type="button" onClick={()=>onViewDetails&&onViewDetails(car)} dir="rtl" style={{flex:1,padding:"13px 8px",border:"none",background:"#fff",color:"#a97f2f",fontFamily:"Vazirmatn, Tahoma, Arial, sans-serif",fontSize:"15px",fontWeight:800,cursor:"pointer"}}>مشاهده جزئیات</button>
        </div>
      </div>
    </div>
  );
}
