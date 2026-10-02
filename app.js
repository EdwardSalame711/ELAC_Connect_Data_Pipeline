const attention = [
  ['Missing Student ID','Math Lab','4','Resolve'],['Invalid Hours Format','Writing Center','1','Review'],
  ['Duplicate Attendance Record','STEM Center','2','Merge'],['Duplicate Attendance Record','STEM Center','4','Resolve'],
  ['Duplicate Attendance Record','STEM Center','2','Review'],['Duplicate Attendance Record','STEM Center','1','Review'],
  ['Duplicate Attendance Record','STEM Center','1','Resolve'],['Duplicate Attendance Record','STEM Center','2','Merge']
];
const validation = Array.from({length:7},(_,i)=>({center:i===1?'Writing Format':'Math Lab',name:i>2?'(jdoe@elac.edu)':'J. Doe<br>(jdoe@elac.edu)',resolved:false}));
let missing = [
  ['Extreme Hours','Extreme Center','J. Doe<br>(jdoe@elac.edu)','72.0 Hrs.','[Needs Director<br>Verification]','anomaly','hours'],
  ['Duplicate Record','Math Lab','J. Doe<br>(jdoe@elac.edu)','1.5 Hrs.','[Select and<br>Merge]','timestamp<br>conflict','duplicate'],
  ['Mismatched ID','Extreme Center','J. Doe<br>(jdoe@elac.edu)','72.0 Hrs.','No Match Found<br>(Roster/Cranium)','Verify','id'],
  ['Math Lab','Writing Format','J. Doe<br>(jdoe@elac.edu)','1.5 Hrs.','[Manual Input ID]','Edit ID','id'],
  ['Extreme ID','Writing Center','J. Doe<br>(jdoe@elac.edu)','5.0 Hrs.','[Needs Director<br>Verification]','Verify','id'],
  ['Duplicate Record','Math Lab','J. Doe<br>(jdoe@elac.edu)','1.5 Hrs.','[Select and<br>Merge]','Edit ID','duplicate']
];
const cleaned = [['123456789','3.5 hrs'],['987654321','1.2 hrs'],['987654322','3.5 hrs'],['987654323','1.2 hrs'],['987654320','2.7 hrs'],['987654321','1.2 hrs']];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let selectedPenjiFile = null;
function render(){
  $('#attentionRows').innerHTML=attention.map(r=>`<tr>${r.map((v,i)=>`<td class="${i===3?'action':''}">${v}</td>`).join('')}</tr>`).join('');
  $('#validationRows').innerHTML=validation.map((r,i)=>`<tr class="${i===0?'selected':''}"><td>${r.center}</td><td>${r.name}</td><td>Incomplete ID<br><span>(8 digits: 12345678)</span></td><td><div class="suggestion"><select><option>Use [jdoe@elac.edu] lookup</option><option>Enter ID manually</option></select><button class="confirm" data-index="${i}">${r.resolved?'Corrected ✓':'Confirm & Correct'}</button><small>Match Found: 123456789 (Oya/Roster)</small></div></td></tr>`).join('');
  drawMissing('all');
  $('#exportRows').innerHTML=cleaned.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
}
function drawMissing(filter){
  const rows=missing.map((r,index)=>({r,index})).filter(({r})=>filter==='all'||r[6]===filter);
  $('#missingRows').innerHTML=rows.map(({r,index})=>`<tr class="${index===2?'selected':''}"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${renderDurationCell(r,index)}</td><td>${r[4]}</td><td>${['Verify','Edit ID'].includes(r[5])?`<button class="row-action">${r[5]}</button>`:`<span class="tag">${r[5]}</span>`}</td></tr>`).join('');
}
function renderDurationCell(row,index){
  if(!/^72(?:\.0)? Hrs\./.test(row[3]))return row[3];
  return `<div class="duration-actions"><strong>${row[3]}</strong><button class="fix-hours" data-index="${index}">FIX HOURS</button><button class="delete-record" data-index="${index}">DELETE</button></div>`;
}
function showScreen(id){
  $$('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
  $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.screen===id));
  document.body.dataset.screen=id;
  $('#breadcrumb').innerHTML=id==='dashboard'?'ELAC Connect: Data Pipeline':'ELAC Connect: Data Pipeline&nbsp;&nbsp;›&nbsp;&nbsp; <b>Stage 2: Validation & Review <span style="color:#923a37">(3 Issues Found)</span></b>';
  $('#sidebar').classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'});
}
function toast(text){const t=document.createElement('div');t.className='toast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
document.addEventListener('click',e=>{
  if(e.target.closest('.import-trigger')){e.preventDefault();openImportModal();return;}
  const nav=e.target.closest('[data-screen]');if(nav)showScreen(nav.dataset.screen);
  const confirmButton=e.target.closest('.confirm');if(confirmButton){validation[+confirmButton.dataset.index].resolved=true;render();toast('Student ID corrected successfully.');}
  const fixHours=e.target.closest('.fix-hours');
  if(fixHours){
    const index=+fixHours.dataset.index;
    const current=parseFloat(missing[index][3]);
    const next=prompt('Enter corrected logged hours:',Number.isFinite(current)?current.toFixed(1):'');
    if(next===null)return;
    const value=Number(next);
    if(!Number.isFinite(value)||value<0){toast('Please enter a valid hour amount.');return;}
    missing[index][3]=`${value.toFixed(1)} Hrs.`;
    missing[index][5]='hours fixed';
    drawMissing($('#missingFilter').value);
    toast('Logged hours updated.');
  }
  const deleteRecord=e.target.closest('.delete-record');
  if(deleteRecord){
    const index=+deleteRecord.dataset.index;
    if(!window.confirm('Delete this record from the missing records queue?'))return;
    missing.splice(index,1);
    drawMissing($('#missingFilter').value);
    toast('Record deleted.');
  }
});
function openImportModal(){
  $('#importModal').hidden=false;
  document.body.style.overflow='hidden';
  setTimeout(()=>$('#choosePenjiFile').focus(),0);
}
function closeImportModal(){
  $('#importModal').hidden=true;
  document.body.style.overflow='';
}
function resetFileSelection(){
  selectedPenjiFile=null;
  $('#penjiFile').value='';
  $('#selectedFile').hidden=true;
  $('#confirmImport').disabled=true;
}
function handlePenjiFile(file){
  $('#importError').textContent='';
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.csv')){
    resetFileSelection();
    $('#importError').textContent='Please select a Penji file with a .csv extension.';
    return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
    const text=String(reader.result||'').replace(/^\uFEFF/,'').trim();
    if(!text.includes(',')){
      resetFileSelection();
      $('#importError').textContent='This file does not appear to contain comma-separated data.';
      return;
    }
    const rowCount=Math.max(0,text.split(/\r?\n/).filter(Boolean).length-1);
    selectedPenjiFile={file,text,rowCount};
    $('#selectedFileName').textContent=file.name;
    $('#selectedFileDetails').textContent=`${rowCount.toLocaleString()} data records • ${(file.size/1024).toFixed(1)} KB`;
    $('#selectedFile').hidden=false;
    $('#confirmImport').disabled=false;
  };
  reader.onerror=()=>{$('#importError').textContent='The file could not be read. Please try again.';};
  reader.readAsText(file);
}
$('#choosePenjiFile').addEventListener('click',()=>$('#penjiFile').click());
$('#replaceFile').addEventListener('click',()=>$('#penjiFile').click());
$('#penjiFile').addEventListener('change',e=>handlePenjiFile(e.target.files[0]));
$('#closeImport').addEventListener('click',closeImportModal);
$('#cancelImport').addEventListener('click',closeImportModal);
$('#importModal').addEventListener('click',e=>{if(e.target===$('#importModal'))closeImportModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#importModal').hidden)closeImportModal();});
$('#confirmImport').addEventListener('click',()=>{
  if(!selectedPenjiFile)return;
  $('#importStepStatus').textContent=`Imported ${selectedPenjiFile.rowCount.toLocaleString()} records`;
  closeImportModal();
  toast(`${selectedPenjiFile.file.name} imported successfully.`);
  setTimeout(()=>showScreen('validation'),500);
});
$('#menuButton').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#missingFilter').addEventListener('change',e=>drawMissing(e.target.value));
$('#resolveAll').addEventListener('click',()=>toast('Select a record, review the match, then confirm the correction.'));
$('#updateRecords').addEventListener('click',()=>{toast('Two corrected records were updated.');showScreen('missing')});
$('#exportButton').addEventListener('click',()=>{
  const csv='Student ID,Summed Hours\n'+cleaned.map(r=>`${r[0]},${r[1].replace(' hrs','')}`).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='ELAC_Fall_2026_Cleaned_Data.csv';a.click();URL.revokeObjectURL(a.href);
  $('#exportMessage').textContent='Export complete — final CSV downloaded.';
});
render();showScreen('dashboard');
