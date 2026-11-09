import {parseObjectJSON,parseDictionary} from './json.mjs';
export const SCHEMA='keyharbor-project-v1';
function text(v,max,name){if(typeof v!=='string'||v.length>max||/[\u0000-\u001f\u007f]/.test(v)||[...v].some(c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff))throw Error('Invalid '+name+'.');}
export function validate(p){
 const names=['schema','title','sourceName','targetName','sourceText','targetText'];if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).sort().join('|')!==names.sort().join('|')||p.schema!==SCHEMA)throw Error('Unsupported project fields or version.');
 for(const [k,n] of [['title',80],['sourceName',48],['targetName',48]]){text(p[k],n,k);if(!p[k].trim())throw Error('Names must not be blank.');}
 try{parseDictionary(p.sourceText);}catch(e){throw Error('Source: '+e.message);}
 try{parseDictionary(p.targetText);}catch(e){throw Error('Target: '+e.message);}
 return p;
}
export const clone=p=>structuredClone(validate(p));
export const blank=()=>({schema:SCHEMA,title:'Untitled comparison',sourceName:'Source',targetName:'Target',sourceText:'{}',targetText:'{}'});
export function parseProject(source){return clone(parseObjectJSON(source,{maxSource:2000000,maxString:400000,maxDepth:1,maxNodes:8,maxTotal:900000,maxMessages:6}));}
