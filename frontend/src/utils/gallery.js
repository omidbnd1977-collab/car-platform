export function labelForImage(image,primary,viewLabels){
  const viewType=String(image?.view_type||"").trim().toUpperCase();
  const isPrimary=image?.is_primary===true||String(image?.is_primary).toLowerCase()==="true"||(primary?.primary_image_id!=null&&String(image?.id)===String(primary.primary_image_id));
  if(isPrimary){return {label:viewLabels.MAIN,isPrimary:true};}
  return {label:viewLabels[viewType]||viewLabels.OTHER,isPrimary:false};
}
export function pickVisibleIndex(items,selectedIndex,isBroken){
  const list=Array.isArray(items)?items:[];
  if(list.length===0){return {index:0,skipped:false,allBroken:false};}
  const maxIndex=list.length-1;
  const safeSelected=Math.min(Math.max(Number(selectedIndex)||0,0),maxIndex);
  if(list.every((item)=>isBroken(item.src))){return {index:safeSelected,skipped:false,allBroken:true};}
  for(let step=0;step<list.length;step+=1){
    const index=(safeSelected+step)%list.length;
    if(!isBroken(list[index].src)){return {index,skipped:step>0,allBroken:false};}
  }
  return {index:safeSelected,skipped:false,allBroken:true};
}
