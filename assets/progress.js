(function(){
  var KEY='uim-guide-progress-v1'; var CH=document.body.getAttribute('data-chapter'); var NEXT=document.body.getAttribute('data-next');
  var done=new Set();
  try{var raw=localStorage.getItem(KEY); if(raw){JSON.parse(raw).forEach(function(x){done.add(x);});}}catch(e){}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(Array.from(done)));}catch(e){}}
  var boxes=[].slice.call(document.querySelectorAll('input[data-check]'));
  (function migrate(){
    var ids={}, bySlug={}, changed=false;
    boxes.forEach(function(b){
      var id=b.dataset.check; ids[id]=1;
      var m=id.match(/^([^-]+)-[cx]\d+-(.*)$/);
      if(m){var k=m[1]+'|'+m[2]; (bySlug[k]=bySlug[k]||[]).push(id);}
    });
    var used={};
    Array.from(done).forEach(function(id){
      if(ids[id]){used[id]=1; return;}
      var m=id.match(/^([^-]+)-[cx]\d+-(.*)$/); if(!m||m[1]!==CH){return;}
      var cands=(bySlug[m[1]+'|'+m[2]]||[]).filter(function(c){return !done.has(c)&&!used[c];});
      done.delete(id); changed=true;
      if(cands.length){done.add(cands[0]); used[cands[0]]=1;}
    });
    if(changed){save();}
  })();
  function markRow(b){
    var h=b.closest('h2,h3,h4');
    if(h){h.classList.toggle('done',b.checked);}
  }
  // Tree of checkboxes: each box's container is its heading's parent (section, block or step).
  var idx=new Map(); boxes.forEach(function(b,i){idx.set(b,i);});
  var cont=boxes.map(function(b){var h=b.closest('h2,h3,h4'); return h?h.parentElement:null;});
  var desc=boxes.map(function(b,i){
    if(!cont[i]){return [];}
    return [].slice.call(cont[i].querySelectorAll('input[data-check]')).filter(function(x){return x!==b;}).map(function(x){return idx.get(x);});
  });
  var parent=boxes.map(function(b,i){
    var p=cont[i]&&cont[i].parentElement;
    while(p&&p!==document.body){
      var ph=p.querySelector(':scope > h2 input[data-check], :scope > h3 input[data-check]');
      if(ph&&ph!==b){return idx.get(ph);}
      p=p.parentElement;
    }
    return -1;
  });
  function setBox(i,v){var b=boxes[i]; b.checked=v; if(v){done.add(b.dataset.check);}else{done.delete(b.dataset.check);} markRow(b);}
  function syncUp(i){
    var p=parent[i];
    while(p>=0){
      var all=desc[p].every(function(k){return boxes[k].checked;});
      if(boxes[p].checked!==all){setBox(p,all);}
      p=parent[p];
    }
  }
  boxes.forEach(function(b){b.checked=done.has(b.dataset.check);});
  // Normalise saved progress: a ticked block ticks its steps; a block whose steps are all ticked is ticked.
  (function normalise(){
    var before=JSON.stringify(Array.from(done).sort());
    boxes.forEach(function(b,i){if(b.checked&&desc[i].length){desc[i].forEach(function(k){setBox(k,true);});}});
    for(var i=boxes.length-1;i>=0;i--){
      if(desc[i].length){var all=desc[i].every(function(k){return boxes[k].checked;}); setBox(i,all);}
    }
    if(JSON.stringify(Array.from(done).sort())!==before){save();}
  })();
  boxes.forEach(function(b,i){
    markRow(b);
    b.addEventListener('change',function(){
      setBox(i,b.checked);
      desc[i].forEach(function(k){setBox(k,b.checked);});
      syncUp(i);
      save(); refresh(); updateResume();
    });
  });
  function count(el){
    var all=el.querySelectorAll('input[data-check]'), d=0;
    for(var i=0;i<all.length;i++){if(all[i].checked)d++;}
    return [d,all.length];
  }
  function refresh(){
    document.querySelectorAll('.xpbar').forEach(function(bar){
      var t=bar.getAttribute('data-target');
      var el=(t==='all')?document.body:document.getElementById(t);
      if(!el){return;}
      var c=count(el), pct=c[1]?Math.round(c[0]*100/c[1]):0;
      bar.querySelector('.xpfill').style.width=pct+'%';
      bar.querySelector('.xplabel').textContent=c[1]?(c[0]+' / '+c[1]+' · '+pct+'%'):'';
      bar.style.display=c[1]?'':'none';
    });
  }
  function label(btn,long,short){btn.innerHTML='<span class="lg">'+long+'</span><span class="sm">'+(short||long)+'</span>';}
  var rb=document.getElementById('reset'), armed=false;
  rb.addEventListener('click',function(){
    if(!armed){
      var n=Array.from(done).filter(function(id){return id.indexOf(CH+'-')===0;}).length; if(!n){label(rb,'Nothing to reset','Reset'); setTimeout(function(){label(rb,'Reset chapter','Reset');},1800); return;} armed=true; rb.classList.add('armed'); label(rb,'Clear '+n+' ticks? Click again','Clear '+n+'?'); rb.title='Click again within 4 seconds to clear this chapter';
      rb._t=setTimeout(function(){armed=false; rb.classList.remove('armed'); rb.title=''; label(rb,'Reset chapter','Reset');},4000);
      return;
    }
    clearTimeout(rb._t); armed=false; rb.classList.remove('armed'); rb.title=''; label(rb,'Reset chapter','Reset');
    Array.from(done).forEach(function(id){if(id.indexOf(CH+'-')===0){done.delete(id);}}); save();
    boxes.forEach(function(b){b.checked=false; markRow(b);});
    refresh(); updateResume();
  });
  // Next pending step: the first unticked step that has no steps of its own.
  // If nothing in its block (or section) is ticked yet and it is the first step there,
  // land on the block (or section) heading so the route, kit and requirements are not skipped.
  function findTarget(){
    var t=-1;
    for(var i=0;i<boxes.length;i++){if(!boxes[i].checked&&!desc[i].length){t=i;break;}}
    if(t<0){return null;}
    var cur=t, p=parent[cur];
    while(p>=0&&!boxes[p].checked&&desc[p][0]===cur&&desc[p].every(function(k){return !boxes[k].checked;})){cur=p; p=parent[cur];}
    var el=boxes[cur].closest('h2,h3,h4');
    var c=el.parentElement;
    if(c.classList.contains('block')){
      var sec=c.parentElement, sh=sec&&sec.querySelector(':scope > h2');
      if(sh&&!sh.querySelector('input[data-check]')&&sec.querySelector(':scope > .block')===c&&!sec.querySelector('input[data-check]:checked')){el=sh;}
    }
    return {el:el, step:boxes[t].closest('h2,h3,h4')};
  }
  var rs=document.getElementById('resume'), tb=document.querySelector('.topbar');
  function updateResume(){
    var r=findTarget();
    if(r){label(rs,'Continue where I left off','Continue');}else if(NEXT){label(rs,'Chapter done: next chapter','Next');}else{label(rs,'All steps ticked','All done');}
    rs.title=r?('Next: '+r.step.textContent.trim()):'';
  }
  function jump(el){
    var de=document.documentElement, prev=de.style.scrollBehavior;
    function place(){
      var off=(tb?tb.offsetHeight:0)+14;
      var y=Math.max(0,el.getBoundingClientRect().top+window.pageYOffset-off);
      de.style.scrollBehavior='auto'; window.scrollTo(0,y);
    }
    place();
    requestAnimationFrame(function(){place(); setTimeout(place,250); setTimeout(function(){place(); de.style.scrollBehavior=prev;},900);});
  }
  rs.addEventListener('click',function(){
    var r=findTarget();
    if(!r){if(NEXT){location.href=NEXT;} updateResume(); return;}
    jump(r.el);
    var fl=r.step.parentElement;
    fl.classList.add('flash'); setTimeout(function(){fl.classList.remove('flash');},2600);
  });
  updateResume();
  if(location.hash==='#continue'){setTimeout(function(){rs.click();},60);}
  var mt=document.getElementById('menu-toggle'), sb=document.getElementById('sidebar');
  mt.addEventListener('click',function(){sb.classList.toggle('open');});
  sb.addEventListener('click',function(e){
    if(e.target.tagName==='A' && window.innerWidth<=900){sb.classList.remove('open');}
  });
  refresh();
})();
