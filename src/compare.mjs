import {validate} from './model.mjs';import {parseDictionary,pointer,countMessages} from './json.mjs';import {comparePlaceholders} from './placeholders.mjs';
const ABSENT=Symbol('absent'),kind=n=>n===ABSENT?'absent':typeof n==='string'?'string':'object';
export function compare(p){
 validate(p);const source=parseDictionary(p.sourceText),target=parseDictionary(p.targetText),records=[];
 function add(path,s,t,type,issues,placeholders=null){
  const level=issues.some(i=>i.level==='attention')?'attention':issues.some(i=>i.level==='review')?'review':issues.length?'info':'checked';
  records.push({pointer:pointer(path),segments:[...path],type,level,sourcePresent:s!==ABSENT,targetPresent:t!==ABSENT,sourceValue:s===ABSENT?null:s,targetValue:t===ABSENT?null:t,sourceCovered:s===ABSENT?0:countMessages(s),targetCovered:t===ABSENT?0:countMessages(t),placeholders,issues});
 }
 function absent(path,n,side){
  if(typeof n==='string'||Object.keys(n).length===0){const missing=side==='target';add(path,missing?n:ABSENT,missing?ABSENT:n,missing?'missing':'extra',[{code:missing?'missing':'extra',level:'attention',detail:missing?'Path is absent from the target.':'Path exists only in the target.'}]);}
  else for(const k of Object.keys(n).sort())absent([...path,k],n[k],side);
 }
 function walk(path,s,t){
  if(s===ABSENT){absent(path,t,'source');return;}if(t===ABSENT){absent(path,s,'target');return;}
  if(kind(s)!==kind(t)){add(path,s,t,'shape',[{code:'shape',level:'attention',detail:'Source is '+kind(s)+'; target is '+kind(t)+'. Subtrees are preserved in this record.'}]);return;}
  if(typeof s==='string'){
   const ph=comparePlaceholders(s,t),issues=[...ph.issues];if(!s.trim())issues.push({code:'blank-source',level:'review',detail:'Source is blank; confirm it is intentional.'});if(s.trim()&&!t.trim())issues.push({code:'blank-target',level:'attention',detail:'A nonblank source has a blank target.'});
   if(s===t&&s.trim())issues.push({code:'same-text',level:'info',detail:'Text is identical. This may be intentional; it is not proof of a missing translation.'});
   add(path,s,t,'message',issues,ph);return;
  }
  const keys=[...new Set([...Object.keys(s),...Object.keys(t)])].sort();if(!keys.length)add(path,s,t,'empty-object',[]);
  for(const k of keys)walk([...path,k],Object.hasOwn(s,k)?s[k]:ABSENT,Object.hasOwn(t,k)?t[k]:ABSENT);
 }
 walk([],source,target);
 const summary={sourceMessages:countMessages(source),targetMessages:countMessages(target),records:records.length,attention:0,review:0,info:0,checked:0,placeholderPairsChecked:0,placeholderPairsSkipped:0};
 for(const r of records){summary[r.level]++;if(r.placeholders){if(r.placeholders.checked)summary.placeholderPairsChecked++;else summary.placeholderPairsSkipped++;}}
 if(records.reduce((n,r)=>n+r.sourceCovered,0)!==summary.sourceMessages||records.reduce((n,r)=>n+r.targetCovered,0)!==summary.targetMessages)throw Error('Message accounting failed.');
 return {schema:'keyharbor-report-v1',scope:'Nested string dictionaries and the documented default-interpolation subset; not translation quality or runtime validation.',project:structuredClone(p),summary,records};
}
export function history(initial){let current=structuredClone(validate(initial)),past=[],future=[];return {get value(){return structuredClone(current)},get canUndo(){return past.length>0},get canRedo(){return future.length>0},commit(p){const q=structuredClone(validate(p));if(JSON.stringify(q)===JSON.stringify(current))return false;past.push(current);past=past.slice(-25);current=q;future=[];return true;},undo(){if(!past.length)return false;future.push(current);current=past.pop();return true;},redo(){if(!future.length)return false;past.push(current);past=past.slice(-25);current=future.pop();return true;}};}
