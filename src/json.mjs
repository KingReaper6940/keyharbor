export const pointer=parts=>parts.map(k=>'/'+k.replace(/~/g,'~0').replace(/\//g,'~1')).join('');
export function parseObjectJSON(source,overrides={}){
 const limit={maxSource:400000,maxString:4000,maxKey:256,maxDepth:12,maxNodes:3000,maxTotal:150000,maxMessages:500,...overrides};
 if(typeof source!=='string'||source.length>limit.maxSource)throw Error('JSON exceeds '+limit.maxSource+' characters.');
 let i=0,nodes=0,total=0,messages=0;
 const fail=m=>{throw Error(m+' (offset '+i+').');},ws=()=>{while(i<source.length&&/[ \t\r\n]/.test(source[i]))i++;};
 function string(max){if(source[i]!=='"')fail('Expected a JSON string');const start=i++;let closed=false;while(i<source.length){const c=source[i++];if(c==='"'){closed=true;break;}if(c==='\\')i++;}if(!closed)fail('Unclosed JSON string');let v;try{v=JSON.parse(source.slice(start,i));}catch{fail('Invalid JSON string');}
  if(v.length>max||[...v].some(c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff))fail('Text exceeds its limit or has unpaired Unicode surrogates');
  total+=v.length;if(total>limit.maxTotal)fail('Decoded text exceeds '+limit.maxTotal+' characters');return v;}
 function value(depth,path){if(depth>limit.maxDepth||++nodes>limit.maxNodes)fail('JSON depth or node limit exceeded');ws();
  if(source[i]==='"'){if(++messages>limit.maxMessages)fail('Message limit exceeded');return string(limit.maxString);}
  if(source[i]!=='{')fail('Only nested objects and string values are supported');i++;ws();const o={},seen=new Set();if(source[i]==='}'){i++;return o;}
  while(i<source.length){ws();const k=string(limit.maxKey);if(seen.has(k))fail('Duplicate decoded key at '+pointer([...path,k]));seen.add(k);ws();if(source[i++]!==':')fail('Expected colon');const v=value(depth+1,[...path,k]);Object.defineProperty(o,k,{value:v,enumerable:true,writable:true,configurable:true});ws();if(source[i]==='}'){i++;return o;}if(source[i++]!==',')fail('Expected comma or closing brace');ws();}
  fail('Unclosed JSON object');
 }
 ws();if(source[i]!=='{')fail('Root must be an object');const result=value(0,[]);ws();if(i!==source.length)fail('Unexpected trailing content');return result;
}
export const parseDictionary=source=>parseObjectJSON(source);
export function countMessages(node){return typeof node==='string'?1:Object.values(node).reduce((n,v)=>n+countMessages(v),0);}
