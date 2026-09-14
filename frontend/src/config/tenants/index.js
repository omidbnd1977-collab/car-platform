import { baseDealerConfig } from "./base";
import { qeshmTenant } from "./qeshm";
import { smartBrandCarTenant } from "./smart-brand-car";
import { resolveTenantSlug, buildTenantConfig } from "./resolve";
export const tenants = {
    base: {},
    qeshm: qeshmTenant,
    "smart-brand-car": smartBrandCarTenant,
};
export const DEFAULT_TENANT = "qeshm";
function readEnv(name){try{return String(import.meta.env?.[name]||"").trim();}catch{return "";}}
function readQuery(){try{if(typeof window==="undefined"||!window.location)return "";return new URLSearchParams(window.location.search).get("dealer")||"";}catch{return "";}}
function readStored(){try{if(typeof window==="undefined"||!window.localStorage)return "";return window.localStorage.getItem("cp_tenant")||"";}catch{return "";}}
function readHost(){try{return typeof window==="undefined"?"":window.location?.hostname||"";}catch{return "";}}
export const tenantSlug = resolveTenantSlug({query: readQuery(),stored: readStored(),hostname: readHost(),env: readEnv("VITE_TENANT")||readEnv("TENANT"),fallback: DEFAULT_TENANT,registry: tenants});
export const dealerConfig = buildTenantConfig(baseDealerConfig, [tenants[tenantSlug]||{}]);
export function listTenants(){return Object.keys(tenants).map(slug=>({slug,name:tenants[slug]?.name||baseDealerConfig.name}));}
export default dealerConfig;
