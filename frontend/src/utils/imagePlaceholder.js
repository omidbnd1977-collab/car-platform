const CAR_ICON_PATH="M17 55l5-16c1.6-5.1 5.3-8 10.4-8h25.2c5.1 0 8.8 2.9 10.4 8l5 16v13c0 1.7-1.3 3-3 3h-3c-1.7 0-3-1.3-3-3v-2H26v2c0 1.7-1.3 3-3 3h-3c-1.7 0-3-1.3-3-3V55zm9 4h40l-3.4-11.2C62.1 45.4 60.4 44 57.6 44H42.4c-2.8 0-4.5 1.4-5 3.8L34 59zm2 10a4 4 0 110-8 4 4 0 010 8zm24 0a4 4 0 110-8 4 4 0 010 8z";
const THEMES={dark:{bg:"#101010",car:"#2c2c2c",title:"#8e8e8e",note:"#6a6a6a"},light:{bg:"#ececec",car:"#d3d3d3",title:"#8b8b8b",note:"#a0a0a0"}};
function escapeXml(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");}
function escapeUri(v){return encodeURIComponent(String(v==null?"":v)).replace(/'/g,"%27").replace(/"/g,"%22");}
export function makePlaceholder({variant="dark",title="",note=""}={}){
  const theme=THEMES[variant==="light"?"light":"dark"];
  const titleText=String(title||"").trim();
  const noteText=String(note||"").trim();
  const titleY=noteText?74:80;
  const noteBlock=noteText?`<text x="50%" y="95" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="9" fill="${theme.note}">${escapeXml(noteText)}</text>`:"";
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="${theme.bg}"/><g transform="translate(25,14) scale(0.5)" fill="${theme.car}"><path d="${CAR_ICON_PATH}"/></g>`+(titleText?`<text x="50%" y="${titleY}" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="7" fill="${theme.title}">${escapeXml(titleText)}</text>`:"")+noteBlock+`</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${escapeUri(svg)}`;
}
