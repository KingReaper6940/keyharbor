// This intentionally recognizes a documented subset, not arbitrary i18next syntax.
export function scanPlaceholders(text){
 const map=new Map(),reasons=new Set();let i=0;
 while(i<text.length){
  if(text.startsWith('{{',i)){
   const end=text.indexOf('}}',i+2);if(end<0){reasons.add('Unclosed interpolation marker');break;}
   let body=text.slice(i+2,end).trim(),unescaped=false;if(body.startsWith('-')){unescaped=true;body=body.slice(1).trim();}
   if(!/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(body))reasons.add('Interpolation outside the supported name-only grammar');
   else{const token=map.get(body)||{name:body,escaped:0,unescaped:0};token[unescaped?'unescaped':'escaped']++;map.set(body,token);}
   i=end+2;continue;
  }
  if(text[i]==='{'||text[i]==='}')reasons.add('Brace syntax outside supported interpolation');
  i++;
 }
 if(text.includes('$t('))reasons.add('Nested translation syntax is not evaluated');
 if(/%(?:\([^)]+\)|\d+\$)?[A-Za-z]/.test(text))reasons.add('Possible printf syntax is not evaluated');
 return {complete:reasons.size===0,tokens:[...map.values()].sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0),reasons:[...reasons],markup:/<\/?[A-Za-z][^>]*>/.test(text)};
}
export function comparePlaceholders(source,target){
 const a=scanPlaceholders(source),b=scanPlaceholders(target),issues=[];
 if(!a.complete||!b.complete)issues.push({code:'manual-syntax',level:'review',detail:'Placeholder comparison skipped: '+[...new Set([...a.reasons,...b.reasons])].join('; ')+'.'});
 if(a.markup||b.markup)issues.push({code:'markup',level:'review',detail:'Markup appears in a message; tag structure, attributes and runtime rendering are not validated.'});
 if(a.complete&&b.complete){
  const am=new Map(a.tokens.map(t=>[t.name,t])),bm=new Map(b.tokens.map(t=>[t.name,t]));
  for(const name of [...new Set([...am.keys(),...bm.keys()])].sort()){
   const s=am.get(name),t=bm.get(name);
   if(!t)issues.push({code:'missing-variable',level:'attention',detail:'Target is missing variable '+name+'.'});
   else if(!s)issues.push({code:'extra-variable',level:'attention',detail:'Target adds variable '+name+'.'});
   else{
    if((s.escaped>0)!==(t.escaped>0)||(s.unescaped>0)!==(t.unescaped>0))issues.push({code:'escape-marker',level:'review',detail:'Escaped/unescaped marker use differs for '+name+'; runtime escaping options are not assessed.'});
    if(s.escaped+s.unescaped!==t.escaped+t.unescaped)issues.push({code:'occurrences',level:'info',detail:'Occurrence count differs for '+name+' ('+(s.escaped+s.unescaped)+' vs '+(t.escaped+t.unescaped)+'); this can be intentional.'});
   }
  }
 }
 return {source:a,target:b,checked:a.complete&&b.complete,issues};
}
