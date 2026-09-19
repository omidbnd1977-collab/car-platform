const db = require("../config/database");
const smsService = require("../services/smsService");
let tableEnsured = false;
async function ensureTable() {
    if (tableEnsured) return;
    await db.query(`CREATE TABLE IF NOT EXISTS visit_requests (id SERIAL PRIMARY KEY, first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, mobile VARCHAR(20) NOT NULL, car_id INTEGER, car_brand VARCHAR(120), car_model VARCHAR(120), car_year INTEGER, car_title VARCHAR(250), car_price_aed NUMERIC, status VARCHAR(30) NOT NULL DEFAULT 'جدید', sms_consent BOOLEAN NOT NULL DEFAULT FALSE, sms_consent_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ip_address VARCHAR(64));`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_requests_mobile ON visit_requests(mobile);`);
    tableEnsured = true;
}
function normalizeMobile(input) {
    let s = String(input||"").trim().replace(/[\s\-\(\)]/g,"");
    if (s.startsWith("+98")) s="0"+s.slice(3);
    if (s.startsWith("0098")) s="0"+s.slice(4);
    if (s.startsWith("98") && s.length>=12) s="0"+s.slice(2);
    if (/^9\d{9}$/.test(s)) s="0"+s;
    return s;
}
function isValidIranMobile(m){return /^09\d{9}$/.test(m);}
function validateName(n){const t=String(n||"").trim(); if(t.length<2||t.length>80) return false; return /^[\u0600-\u06FFa-zA-Z\s\-']{2,80}$/.test(t);}
exports.createVisitRequest = async (req,res)=>{
    try{
        await ensureTable();
        const body=req.body||{};
        const first_name=String(body.first_name||body.firstName||"").trim();
        const last_name=String(body.last_name||body.lastName||"").trim();
        let mobile=normalizeMobile(body.mobile||body.phone||"");
        const car_id=Number(body.car_id||body.carId||0);
        const sms_consent=Boolean(body.sms_consent||body.smsConsent||false);
        if(!validateName(first_name)) return res.status(400).json({error:"نام نامعتبر است."});
        if(!validateName(last_name)) return res.status(400).json({error:"نام خانوادگی نامعتبر است."});
        if(!mobile||!isValidIranMobile(mobile)) return res.status(400).json({error:"شماره موبایل نامعتبر است."});
        if(!car_id||car_id<=0) return res.status(400).json({error:"خودرو مشخص نشده."});
        const carRes=await db.query(`SELECT id, brand, model, year, price_aed, status FROM cars WHERE id=$1 LIMIT 1`,[car_id]);
        if(!carRes.rows.length) return res.status(404).json({error:"خودرو یافت نشد."});
        const c=carRes.rows[0];
        if(String(c.status).toUpperCase()!=='ACTIVE') return res.status(404).json({error:"خودرو فعال نیست."});
        const car_title=`${c.brand||""} ${c.model||""} ${c.year||""}`.trim().slice(0,250);
        const dup=await db.query(`SELECT id FROM visit_requests WHERE mobile=$1 AND car_id=$2 AND created_at > NOW() - INTERVAL '5 minutes' LIMIT 1`,[mobile,car_id]);
        if(dup.rows.length) return res.status(429).json({error:"درخواست شما برای همین خودرو همین الان ثبت شده است."});
        const ip=String(req.headers["x-forwarded-for"]||req.ip||"").split(",")[0].trim().slice(0,64);
        const result=await db.query(`INSERT INTO visit_requests (first_name, last_name, mobile, car_id, car_brand, car_model, car_year, car_title, car_price_aed, status, sms_consent, sms_consent_at, ip_address) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'جدید',$10, CASE WHEN $10=true THEN NOW() ELSE NULL END, $11) RETURNING id, first_name, last_name, mobile, car_id, car_title, status, sms_consent, created_at`,[first_name,last_name,mobile,car_id,c.brand,c.model,c.year,car_title,c.price_aed,sms_consent,ip]);
        setImmediate(async()=>{try{const conf=smsService.getConfig(); if(conf.enabled){await smsService.notifyAdminNewRequest({firstName:first_name,lastName:last_name,mobile,carTitle:car_title,carId:car_id});}}catch(e){console.error("SMS bg error:",e.message);}});
        return res.status(201).json({message:"درخواست شما با موفقیت ثبت شد",request:result.rows[0]});
    }catch(e){console.error("CREATE VISIT ERROR:",e.message,e.stack); return res.status(500).json({error:"خطا در ثبت درخواست: "+e.message});}
};
const ALLOWED_STATUSES=["جدید","در حال پیگیری","تماس گرفته شد","بازدید انجام شد","بسته شد"];
exports.getVisitRequests=async(req,res)=>{
    try{
        await ensureTable();
        const {status,search,limit=100,offset=0}=req.query;
        let query=`SELECT vr.* FROM visit_requests vr WHERE 1=1`; const values=[]; let idx=1;
        if(status&&ALLOWED_STATUSES.includes(status)){query+=` AND vr.status = $${idx}`; values.push(status); idx++;}
        if(search){const s=`%${String(search).trim()}%`; query+=` AND (vr.first_name ILIKE $${idx} OR vr.last_name ILIKE $${idx} OR vr.mobile ILIKE $${idx} OR vr.car_title ILIKE $${idx})`; values.push(s); idx++;}
        query+=` ORDER BY vr.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`; values.push(Math.min(Number(limit)||100,200)); values.push(Math.max(Number(offset)||0,0));
        const result=await db.query(query,values);
        const countResult=await db.query(`SELECT COUNT(*)::int AS total FROM visit_requests`);
        const statsResult=await db.query(`SELECT status, COUNT(*)::int AS count FROM visit_requests GROUP BY status`);
        return res.json({requests:result.rows,total:countResult.rows[0].total,stats:statsResult.rows});
    }catch(e){return res.status(500).json({error:e.message});}
};
exports.updateVisitRequestStatus=async(req,res)=>{
    try{
        await ensureTable();
        const id=Number(req.params.id); const {status}=req.body||{};
        if(!Number.isFinite(id)||id<=0) return res.status(400).json({error:"شناسه نامعتبر"});
        if(!ALLOWED_STATUSES.includes(status)) return res.status(400).json({error:"وضعیت نامعتبر"});
        const result=await db.query(`UPDATE visit_requests SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,[status,id]);
        if(!result.rows.length) return res.status(404).json({error:"یافت نشد"});
        return res.json({message:"وضعیت بروزرسانی شد",request:result.rows[0]});
    }catch(e){return res.status(500).json({error:e.message});}
};
exports.getVisitRequestById=async(req,res)=>{
    try{
        await ensureTable();
        const id=Number(req.params.id);
        const result=await db.query(`SELECT * FROM visit_requests WHERE id=$1`,[id]);
        if(!result.rows.length) return res.status(404).json({error:"یافت نشد"});
        return res.json({request:result.rows[0]});
    }catch(e){return res.status(500).json({error:e.message});}
};
exports.exportVisitRequestsCsv=async(req,res)=>{
    try{
        await ensureTable();
        const {consent}=req.query; let where=""; if(String(consent).toLowerCase()==="true"||consent==="1") where="WHERE sms_consent = true";
        const result=await db.query(`SELECT DISTINCT ON (mobile) mobile, first_name, last_name, car_title, sms_consent, created_at FROM visit_requests ${where} ORDER BY mobile, created_at DESC`,[]);
        const header="mobile,first_name,last_name,car_title,sms_consent,created_at\n";
        const lines=result.rows.map((r)=>{const esc=(s)=>`"${String(s||"").replace(/"/g,'""')}"`; return `${r.mobile},${esc(r.first_name)},${esc(r.last_name)},${esc(r.car_title)},${r.sms_consent?"yes":"no"},${r.created_at?new Date(r.created_at).toISOString():""}`;});
        const csv=header+lines.join("\n");
        res.setHeader("Content-Type","text/csv; charset=utf-8");
        res.setHeader("Content-Disposition",`attachment; filename=visit-requests-${new Date().toISOString().slice(0,10)}.csv`);
        return res.status(200).send("\uFEFF"+csv);
    }catch(e){return res.status(500).json({error:e.message});}
};
exports.bulkSmsToConsented=async(req,res)=>{
    try{
        await ensureTable();
        const {message,template,dryRun,mobiles:selectedMobiles}=req.body||{};
        const smsService=require("../services/smsService");
        const conf=smsService.getConfig();
        if(!conf.enabled) return res.status(400).json({error:"KAVENEGAR_API_KEY نیست"});
        const clean=(s)=>String(s||"").replace(/%/g,"").trim().slice(0,80)||"x";
        let rows=[];
        if(Array.isArray(selectedMobiles)&&selectedMobiles.length>0){
            const cleaned=selectedMobiles.map((m)=>String(m).trim()).filter((m)=>/^09\d{9}$/.test(m));
            if(!cleaned.length) return res.status(400).json({error:"شماره معتبر نیست"});
            const q=await db.query(`SELECT DISTINCT ON (mobile) mobile, first_name, last_name FROM visit_requests WHERE mobile = ANY($1) ORDER BY mobile, created_at DESC`,[cleaned]);
            rows=q.rows; const found=new Set(rows.map((r)=>r.mobile)); for(const m of cleaned) if(!found.has(m)) rows.push({mobile:m,first_name:"کاربر",last_name:""});
        }else{
            const q=await db.query(`SELECT DISTINCT ON (mobile) mobile, first_name, last_name FROM visit_requests WHERE sms_consent = true ORDER BY mobile, created_at DESC`);
            rows=q.rows;
        }
        const mobiles=rows.map((r)=>r.mobile).filter(Boolean);
        if(!mobiles.length) return res.json({ok:true,total:0,message:"هیچ شماره‌ای نیست"});
        if(dryRun) return res.json({ok:true,dryRun:true,total:mobiles.length,sample:mobiles.slice(0,5)});
        if(!message) return res.status(400).json({error:"متن را وارد کنید"});
        const bulkTemplate=template||"bulk-greeting";
        const results=[];
        for(const row of rows){
            const fullName=`${row.first_name||""} ${row.last_name||""}`.trim()||"کاربر";
            const nameClean=clean(fullName);
            const msgClean=clean(message);
            try{
                let r;
                if(conf.sender){
                    // با sender - متن کامل با فاصله - بدون -
                    const fullText=`آقای ${fullName} عزیز ${message}`;
                    r=await smsService.sendViaKavenegar({receptor:row.mobile,message:fullText});
                }else{
                    const dashName=nameClean.replace(/\s+/g,"-");
                    const dashMsg=msgClean.replace(/\s+/g,"-");
                    r=await smsService.lookupViaKavenegar({receptor:row.mobile,template:bulkTemplate,token:dashName,token2:dashMsg});
                }
                results.push({mobile:row.mobile,ok:true,template:bulkTemplate,hasSender:Boolean(conf.sender)});
            }catch(e){
                results.push({mobile:row.mobile,ok:false,error:e.message});
            }
            await new Promise((r)=>setTimeout(r,600));
        }
        return res.json({ok:true,total:mobiles.length,sent:results.filter((r)=>r.ok).length,failed:results.filter((r)=>!r.ok).length,results,hasSender:Boolean(conf.sender)});
    }catch(e){
        console.error("BULK SMS ERROR:",e.message,e.stack);
        return res.status(500).json({error:e.message});
    }
};
exports.ensureTable=ensureTable;
exports.ALLOWED_STATUSES=ALLOWED_STATUSES;
