import {parseProject} from './model.mjs';import {parseDictionary} from './json.mjs';import {projectJSON,reportJSON,reviewHTML,summarySVG} from './export.mjs';
async function readUTF8(file,max){if(!file||!Number.isInteger(file.size)||file.size>max)throw Error('File exceeds '+max+' bytes.');const bytes=await file.arrayBuffer();if(bytes.byteLength>max)throw Error('File exceeds '+max+' bytes.');return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}
export async function readDictionaryFile(file){const source=await readUTF8(file,1600000);parseDictionary(source);return source;}
export async function readProjectFile(file){return parseProject(await readUTF8(file,8000000));}
export function attachHandoff(app,doc,win=doc.defaultView){
 const links=[['project-download','application/json',projectJSON],['report-download','application/json',reportJSON],['html-download','text/html',reviewHTML],['svg-download','image/svg+xml',summarySVG]];let urls=[];const sequence=new Map();
 function refresh(){for(const u of urls)win.URL.revokeObjectURL(u);urls=[];for(const [id,type,format] of links){const a=doc.getElementById(id);a.removeAttribute('href');a.setAttribute('aria-disabled',String(app.dirty));if(!app.dirty){const u=win.URL.createObjectURL(new win.Blob([format(app.value)],{type:type+';charset=utf-8'}));urls.push(u);a.setAttribute('href',u);}}}
 for(const [id] of links)doc.getElementById(id).addEventListener('click',e=>{if(app.dirty){e.preventDefault();app.status('Analyze or revert drafts before downloading.');}});
 for(const side of ['source','target','project']){const input=doc.getElementById(side+'-file');input.addEventListener('change',async()=>{
  const seq=(sequence.get(side)||0)+1;sequence.set(side,seq);const start=app.revision,file=input.files?.[0];if(!file)return;if(side==='project'&&app.dirty){app.status('Analyze or revert drafts before opening a project.');input.value='';return;}
  try{const data=side==='project'?await readProjectFile(file):await readDictionaryFile(file);if(seq!==sequence.get(side)||start!==app.revision){if(seq===sequence.get(side))app.status('File not applied because another file, input or saved comparison changed. Choose it again.');return;}if(side==='project')app.load(data);else app.draftDictionary(side,data);}
  catch(e){if(seq===sequence.get(side)&&start===app.revision)app.status('Could not open '+side+': '+e.message);}
  finally{if(seq===sequence.get(side))input.value='';}
 });}
 win.addEventListener('pagehide',()=>{for(const u of urls)win.URL.revokeObjectURL(u);urls=[];});win.addEventListener('pageshow',refresh);app.subscribe(refresh);
}
