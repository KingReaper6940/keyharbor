import {blank,SCHEMA} from './model.mjs';import {example} from './example.mjs';import {compare,history} from './compare.mjs';import {esc,valueText} from './export.mjs';import {attachHandoff} from './handoff.mjs';
export function createApp(doc,win=doc.defaultView){
 const $=s=>doc.querySelector(s),form=$('#compare-form'),field=n=>form.elements.namedItem(n),h=history(example());let dirty=false,revision=0,report=compare(h.value),offset=0,onChange=()=>{};
 const status=m=>{$('#status').textContent=m;},check=()=>{if(dirty)throw Error('Analyze or revert input drafts before replacing the comparison.');};
 function fill(){const p=h.value;for(const k of ['title','sourceName','targetName','sourceText','targetText'])field(k).value=p[k];dirty=false;revision++;}
 function changed(){dirty=true;revision++;$('#draft-badge').textContent='UNSAVED INPUTS · LAST ANALYZED REPORT';status('Inputs changed. Analyze to update the report, or revert drafts.');onChange();}
 function renderRecords(){
  const search=$('#search').value.toLowerCase(),level=$('#level').value,rows=report.records.filter(r=>(level==='all'||r.level===level)&&(!search||(r.pointer+' '+valueText(r.sourcePresent,r.sourceValue)+' '+valueText(r.targetPresent,r.targetValue)).toLowerCase().includes(search)));
  const pages=Math.max(1,Math.ceil(rows.length/20));offset=Math.min(offset,(pages-1)*20);const shown=rows.slice(offset,offset+20);
  $('#visible-count').textContent=rows.length+' / '+report.records.length+' records';
  $('#records').innerHTML=shown.map(r=>'<article class="record '+r.level+'"><div class="record-heading"><span class="path">'+esc(JSON.stringify(r.pointer))+'</span><span class="tag">'+esc(r.level+' · '+r.type)+'</span></div><ul>'+r.issues.map(i=>'<li>'+esc(i.code+': '+i.detail)+'</li>').join('')+'</ul><div class="values"><div><h3>Source · '+esc(report.project.sourceName)+'</h3><pre>'+esc(valueText(r.sourcePresent,r.sourceValue))+'</pre></div><div><h3>Target · '+esc(report.project.targetName)+'</h3><pre>'+esc(valueText(r.targetPresent,r.targetValue))+'</pre></div></div><p class="hint">Messages covered: '+r.sourceCovered+' source / '+r.targetCovered+' target. '+(r.placeholders?(r.placeholders.checked?'Supported placeholder subset checked.':'Placeholder comparison skipped; manual syntax review.'):'No placeholder comparison for this record type.')+'</p>'+(r.placeholders?'<details><summary>Scan details and coverage</summary><pre>'+esc(JSON.stringify(r.placeholders,null,2))+'</pre></details>':'')+'</article>').join('')||'<p class="hint">No records match this view. Exports still include the complete report.</p>';
  $('#page').textContent='Page '+(offset/20+1)+' / '+pages;$('#previous').disabled=offset===0;$('#next').disabled=offset+20>=rows.length;
 }
 function render(){const s=report.summary;$('#report-title').textContent=h.value.title;for(const k of ['attention','review','info','checked'])$('#'+k+'-count').textContent=s[k];$('#coverage').textContent=s.sourceMessages+' source messages / '+s.targetMessages+' target messages · '+s.placeholderPairsChecked+' placeholder pairs checked / '+s.placeholderPairsSkipped+' skipped';$('#draft-badge').textContent=dirty?'UNSAVED INPUTS · LAST ANALYZED REPORT':'LAST ANALYZED INPUTS';$('#undo').disabled=!h.canUndo;$('#redo').disabled=!h.canRedo;renderRecords();onChange();}
 const run=fn=>{try{fn();}catch(e){status(e.message);}};
 for(const type of ['input','change'])form.addEventListener(type,e=>{if(e.target.type!=='file')changed();});
 form.addEventListener('submit',e=>{e.preventDefault();run(()=>{const p={schema:SCHEMA};for(const k of ['title','sourceName','targetName','sourceText','targetText'])p[k]=field(k).value;const r=compare(p);h.commit(p);report=r;dirty=false;revision++;offset=0;render();status('Comparison updated. Review coverage and keep the human language review. Save project JSON to resume later.');});});
 $('#revert').addEventListener('click',()=>{fill();render();status('Input drafts reverted to the last analyzed comparison.');});
 for(const [id,maker] of [['demo',example],['new',blank]])$('#'+id).addEventListener('click',()=>run(()=>{check();h.commit(maker());report=compare(h.value);offset=0;fill();render();status(id==='new'?'Blank comparison ready. Paste two dictionaries or open their JSON files.':'Invented example loaded; values are not production translations.');}));
 for(const dir of ['undo','redo'])$('#'+dir).addEventListener('click',()=>run(()=>{check();h[dir]();report=compare(h.value);offset=0;fill();render();status(dir==='undo'?'Undone.':'Redone.');}));
 $('#level').addEventListener('change',()=>{offset=0;renderRecords();});$('#search').addEventListener('input',()=>{offset=0;renderRecords();});$('#previous').addEventListener('click',()=>{offset=Math.max(0,offset-20);renderRecords();});$('#next').addEventListener('click',()=>{offset+=20;renderRecords();});
 win.addEventListener('beforeunload',e=>{e.preventDefault();e.returnValue='';});fill();render();
 return {get value(){return h.value},get revision(){return revision},get dirty(){return dirty},status,
  load(p){check();const r=compare(p);h.commit(p);report=r;offset=0;fill();render();status('Comparison project opened. Undo restores the previous comparison.');},
  draftDictionary(side,text){if(!['source','target'].includes(side))throw Error('Unsupported dictionary side.');field(side+'Text').value=text;changed();status(side+' JSON loaded into the editor. Analyze dictionaries to apply it.');},
  subscribe(fn){onChange=fn;fn();}};
}
if(typeof document!=='undefined')attachHandoff(createApp(document),document);
