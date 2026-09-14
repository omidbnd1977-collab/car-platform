import { useMemo, useState } from "react";
import { makePlaceholder } from "../utils/imagePlaceholder";
export default function SafeImage({src="",alt="",variant="dark",fit="cover",title="",note="",showMessage=false,onError,onLoad,style,...rest}){
  const cleanSrc=String(src||"").trim();
  const [loadedSrc,setLoadedSrc]=useState("");
  const [failedSrc,setFailedSrc]=useState("");
  const loaded=loadedSrc===cleanSrc&&cleanSrc!=="";
  const failed=failedSrc===cleanSrc&&cleanSrc!=="";
  const placeholder=useMemo(()=>makePlaceholder({variant,title:failed?title:"",note:failed?note:""}),[variant,failed,title,note]);
  const isDark=variant!=="light";
  return (
    <span style={{position:"relative",display:"block",width:"100%",height:"100%",overflow:"hidden",background:isDark?"#0b0b0b":"#eeeeee"}}>
      {cleanSrc?(<img {...rest} src={cleanSrc} alt={alt} draggable={false} onLoad={(e)=>{setLoadedSrc(cleanSrc);if(onLoad)onLoad(e);}} onError={()=>{setFailedSrc(cleanSrc);if(onError)onError(cleanSrc);}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:fit,display:failed?"none":"block",opacity:loaded?1:0,transition:"opacity 0.35s ease",...style}} />):null}
      {!loaded?(<span aria-hidden="true" style={{position:"absolute",inset:0,display:"block",backgroundImage:`url("${placeholder}")`,backgroundSize:"cover",backgroundPosition:"center",backgroundRepeat:"no-repeat",pointerEvents:"none"}} />):null}
    </span>
  );
}
