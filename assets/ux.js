/* UIM Progression Guide: reading and progress helpers.
   Copied to assets/ux.js by build_site.py. Loaded last on every page.
   Never changes the saved ticks except through Import, which asks first. */
(function(){
  'use strict';
  var KEY='uim-guide-progress-v1', HIDE='uim-hide-done';
  var doc=document, body=doc.body;
  function $(s,c){return (c||doc).querySelector(s);}
  function $$(s,c){return Array.prototype.slice.call((c||doc).querySelectorAll(s));}
  function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function put(k,v){try{if(v===null){localStorage.removeItem(k);}else{localStorage.setItem(k,v);}return true;}catch(e){return false;}}
  var reduced=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  function topOffset(){var tb=$('.topbar');return (tb?tb.offsetHeight:0)+16;}
  var main=$('#main'), sb=$('#sidebar'), chapter=body.getAttribute('data-chapter');
  var spy={measure:function(){},reveal:function(){}};

  /* ---------- Back to top ---------- */
  var top=doc.createElement('button');
  top.type='button'; top.className='to-top'; top.hidden=true; top.setAttribute('aria-label','Back to top');
  top.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  body.appendChild(top);
  top.addEventListener('click',function(){
    window.scrollTo({top:0,behavior:reduced.matches?'auto':'smooth'});
    if(main){main.focus({preventScroll:true});}
  });

  /* ---------- Sidebar drawer (below 900px) ---------- */
  var mt=$('#menu-toggle');
  if(sb&&mt){
    mt.setAttribute('aria-controls','sidebar'); mt.setAttribute('aria-expanded','false');
    var scrim=doc.createElement('div'); scrim.className='scrim'; scrim.hidden=true; body.appendChild(scrim);
    var wasOpen=false, closedByUser=false;
    new MutationObserver(function(){
      var open=sb.classList.contains('open'); if(open===wasOpen){return;} wasOpen=open;
      mt.setAttribute('aria-expanded',String(open)); scrim.hidden=!open; body.classList.toggle('drawer-open',open);
      if(open){requestAnimationFrame(function(){requestAnimationFrame(function(){var f=$('.side-chapters a[aria-current], .side-chapters a, a',sb); if(f){f.focus({preventScroll:true});}});}); spy.reveal();}
      else if(closedByUser){mt.focus({preventScroll:true});}
      closedByUser=false;
    }).observe(sb,{attributes:true,attributeFilter:['class']});
    function close(){closedByUser=true; sb.classList.remove('open');}
    scrim.addEventListener('click',close);
    doc.addEventListener('keydown',function(e){if(e.key==='Escape'&&sb.classList.contains('open')){close();}});
  }

  /* ---------- Hide finished steps (chapter pages) ---------- */
  var hideBtn=null;
  function hiddenCount(){
    var blocks=$$('.block > h3.done'), n=blocks.length;
    $$('.step > h4.done').forEach(function(h){var b=h.closest('.block'); if(!b||!$(':scope > h3.done',b)){n++;}});
    return n;
  }
  function paintHide(){
    if(!hideBtn){return;}
    var on=body.classList.contains('hiding-done'), n=hiddenCount();
    hideBtn.setAttribute('aria-pressed',String(on));
    hideBtn.textContent=(on?'Show finished':'Hide finished')+(n?' ('+n+')':'');
  }
  function setHide(on,save){
    body.classList.toggle('hiding-done',on);
    if(save){put(HIDE,on?'1':null);}
    paintHide(); spy.measure();
  }
  if(chapter&&sb){
    var tools=doc.createElement('div'); tools.className='side-tools';
    hideBtn=doc.createElement('button'); hideBtn.type='button'; hideBtn.className='hide-done';
    hideBtn.title='Hide the steps and blocks you have already ticked';
    tools.appendChild(hideBtn);
    var title=$('.side-title',sb); sb.insertBefore(tools,title||sb.firstChild);
    hideBtn.addEventListener('click',function(){setHide(!body.classList.contains('hiding-done'),true);});
    body.classList.toggle('hiding-done',get(HIDE)==='1'); paintHide();
    doc.addEventListener('change',function(e){if(e.target.matches&&e.target.matches('input[data-check]')){paintHide(); markToc(); spy.measure();}});
  }
  // A link to something hidden shows the finished steps again, so the jump lands.
  function unhideFor(hash,save){
    if(!hash||hash.length<2||!body.classList.contains('hiding-done')){return;}
    var el=doc.getElementById(decodeURIComponent(hash.slice(1)));
    if(el&&el.offsetParent===null&&getComputedStyle(el).position!=='fixed'){setHide(false,save);}
  }
  doc.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]'); if(!a){return;}
    var u; try{u=new URL(a.getAttribute('href'),location.href);}catch(err){return;}
    if(u.pathname===location.pathname&&u.hash){unhideFor(u.hash,true);}
  },true);
  unhideFor(location.hash,false);

  /* ---------- Contents: finished marks and scrollspy ---------- */
  function markToc(){
    if(!sb){return;}
    $$('.toc-sec li a[href^="#"]',sb).forEach(function(a){
      var el=doc.getElementById(a.getAttribute('href').slice(1)); var h=el&&$(':scope > h3',el);
      a.classList.toggle('is-done',!!(h&&h.classList.contains('done')));
    });
  }
  if(sb){
    markToc();
    var map=[], tops=[], current=null, ticking=false;
    $$('.toc-sec a[href^="#"]',sb).forEach(function(a){
      var el=doc.getElementById(a.getAttribute('href').slice(1));
      if(el){map.push({a:a,el:el,det:a.closest('details')});}
    });
    var dets=$$('.toc-sec',sb);
    dets.forEach(function(d){var s=$('summary',d); if(s){s.addEventListener('click',function(){delete d.dataset.auto;});}});
    spy.measure=function(){
      var y=window.pageYOffset;
      tops=map.map(function(m){return m.el.offsetParent===null?Infinity:m.el.getBoundingClientRect().top+y;});
      update(true);
    };
    spy.reveal=function(){
      if(!current){return;}
      var r=current.a.getBoundingClientRect(), s=sb.getBoundingClientRect();
      if(r.top<s.top+48||r.bottom>s.bottom-48){sb.scrollTop+=r.top-s.top-s.height/3;}
    };
    function update(force){
      var line=window.pageYOffset+topOffset()+48, best=-1;
      for(var i=0;i<map.length;i++){if(tops[i]<=line&&(best<0||tops[i]>=tops[best])){best=i;}}
      var m=best>=0?map[best]:null;
      if(m===current&&!force){return;}
      $$('.toc-sec a.active, .toc-sec a.active-sec',sb).forEach(function(a){a.classList.remove('active','active-sec'); a.removeAttribute('aria-current');});
      current=m; if(!m){return;}
      m.a.classList.add('active'); m.a.setAttribute('aria-current','location');
      if(m.det){
        var sa=$('summary a',m.det); if(sa&&sa!==m.a){sa.classList.add('active-sec');}
        if(!m.det.open){m.det.open=true; m.det.dataset.auto='1';}
        dets.forEach(function(d){if(d!==m.det&&d.dataset.auto==='1'){d.open=false; delete d.dataset.auto;}});
      }
      if(getComputedStyle(sb).position!=='fixed'){spy.reveal();}
    }
    window.addEventListener('scroll',function(){
      if(ticking){return;} ticking=true;
      requestAnimationFrame(function(){ticking=false; update(false); top.hidden=window.pageYOffset<window.innerHeight*1.5;});
    },{passive:true});
    window.addEventListener('resize',function(){spy.measure();});
    window.addEventListener('load',function(){spy.measure();});
    if(doc.fonts&&doc.fonts.ready){doc.fonts.ready.then(function(){spy.measure();});}
    spy.measure();
  } else {
    window.addEventListener('scroll',function(){top.hidden=window.pageYOffset<window.innerHeight*1.5;},{passive:true});
  }

  /* ---------- Export and import progress ---------- */
  var ex=$('[data-progress="export"]'), im=$('[data-progress="import"]'), file=$('#progress-file'), status=$('#progress-status');
  function readTicks(){try{var a=JSON.parse(get(KEY)||'[]'); return Array.isArray(a)?a.filter(function(x){return typeof x==='string';}):[];}catch(e){return [];}}
  function say(msg){if(status){status.textContent=msg;}}
  function parseTicks(text){
    var j; try{j=JSON.parse(text);}catch(e){return null;}
    var a=Array.isArray(j)?j:(j&&typeof j==='object'&&Array.isArray(j.progress)?j.progress:null);
    if(!a){return null;}
    var re=/^ch\d{1,2}-[a-z0-9][a-z0-9-]{0,160}$/, seen={}, out=[];
    a.forEach(function(x){if(typeof x==='string'&&re.test(x)&&!seen[x]){seen[x]=1; out.push(x);}});
    return (out.length||a.length===0)?out:null;
  }
  if(ex&&im&&file){
    ex.addEventListener('click',function(){
      var ticks=readTicks(), day=new Date().toISOString().slice(0,10);
      var data={app:'uim-progression-guide',version:1,exported:new Date().toISOString(),progress:ticks};
      var url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      var a=doc.createElement('a'); a.href=url; a.download='uim-guide-progress-'+day+'.json';
      body.appendChild(a); a.click();
      setTimeout(function(){URL.revokeObjectURL(url); a.remove();},1500);
      say('Saved '+ticks.length+' ticked '+(ticks.length===1?'item':'items')+' to a file.');
    });
    var confirmBox=null, pending=null;
    function closeConfirm(){if(confirmBox){confirmBox.remove(); confirmBox=null;} pending=null;}
    im.addEventListener('click',function(){closeConfirm(); file.value=''; file.click();});
    file.addEventListener('change',function(){
      var f=file.files&&file.files[0]; if(!f){return;}
      if(f.size>2000000){say('That file is too large to be a progress file from this guide.'); return;}
      var r=new FileReader();
      r.onerror=function(){say('The file could not be read.');};
      r.onload=function(){
        var ticks=parseTicks(String(r.result));
        if(!ticks){say('That file is not a progress file from this guide. Nothing was changed.'); return;}
        pending=ticks; var now=readTicks().length;
        confirmBox=doc.createElement('div'); confirmBox.className='sf-confirm'; confirmBox.setAttribute('role','alertdialog'); confirmBox.setAttribute('aria-label','Replace your progress');
        var p=doc.createElement('p');
        p.textContent='Replace the '+now+' ticked '+(now===1?'item':'items')+' in this browser with the '+ticks.length+' in the file? This can’t be undone, so export first if you want a copy.';
        var yes=doc.createElement('button'); yes.type='button'; yes.className='danger'; yes.textContent='Replace my progress';
        var no=doc.createElement('button'); no.type='button'; no.textContent='Cancel';
        confirmBox.appendChild(p); confirmBox.appendChild(yes); confirmBox.appendChild(no);
        im.parentNode.parentNode.insertBefore(confirmBox,status);
        yes.addEventListener('click',function(){
          if(!put(KEY,JSON.stringify(pending))){say('Your browser refused to save the progress. Nothing was changed.'); closeConfirm(); return;}
          say('Imported '+pending.length+' ticked items. Reloading…'); closeConfirm();
          setTimeout(function(){location.reload();},400);
        });
        no.addEventListener('click',function(){closeConfirm(); say('Import cancelled. Nothing was changed.'); im.focus();});
        yes.focus();
      };
      r.readAsText(f);
    });
  }

  /* ---------- Search: announce results, wrap the arrow keys ---------- */
  var q=$('#q'), box=$('#sresults');
  if(q&&box){
    q.setAttribute('aria-controls','sresults'); q.setAttribute('aria-expanded','false'); q.setAttribute('aria-describedby','search-status');
    box.setAttribute('aria-label','Search results');
    var live=doc.createElement('div'); live.id='search-status'; live.className='sr'; live.setAttribute('role','status'); live.setAttribute('aria-live','polite');
    box.parentNode.appendChild(live);
    var head=doc.createElement('div'); head.className='scount';
    function sync(){
      var open=!box.hidden; q.setAttribute('aria-expanded',String(open));
      if(!open){live.textContent=''; return;}
      var n=$$('.sres',box).length, empty=$('.sempty',box);
      var msg=empty?empty.textContent:(n===1?'1 result':(n>=15?'Top 15 results':n+' results'));
      live.textContent=msg;
      if(n){head.textContent=msg+' · ↑↓ to move, Enter to open, Esc to close'; if(box.firstChild!==head){box.insertBefore(head,box.firstChild);}}
    }
    new MutationObserver(sync).observe(box,{attributes:true,attributeFilter:['hidden'],childList:true});
    box.addEventListener('keydown',function(e){
      var items=$$('.sres',box), i=items.indexOf(doc.activeElement); if(i<0){return;}
      if(e.key==='ArrowDown'&&i===items.length-1){e.preventDefault(); e.stopPropagation(); items[0].focus();}
      if(e.key==='ArrowUp'&&i===0){e.preventDefault(); e.stopPropagation(); q.focus();}
      if(e.key==='Home'){e.preventDefault(); e.stopPropagation(); items[0].focus();}
      if(e.key==='End'){e.preventDefault(); e.stopPropagation(); items[items.length-1].focus();}
    },true);
  }
})();
