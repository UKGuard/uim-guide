if(window.top!==window.self){try{window.top.location.replace(window.location.href);}catch(e){}}
(function(){
  var root=document.documentElement;
  var sun='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>';
  var moon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>';
  var tb=document.getElementById('theme');
  function paint(){var d=root.getAttribute('data-theme')==='dark'; tb.innerHTML=d?sun:moon; tb.setAttribute('aria-label',d?'Switch to light theme':'Switch to dark theme');}
  if(tb){paint(); tb.addEventListener('click',function(){var d=root.getAttribute('data-theme')==='dark'?'light':'dark'; root.setAttribute('data-theme',d); try{localStorage.setItem('uim-theme',d);}catch(e){} paint();});}

  var q=document.getElementById('q'), box=document.getElementById('sresults'), loading=false;
  if(!q||!box){return;}
  function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function load(cb){
    if(window.UIM_SEARCH){cb();return;}
    if(loading){return;} loading=true;
    var s=document.createElement('script'); s.src='assets/search-index.js';
    s.onload=function(){window.UIM_SEARCH.forEach(function(e){e.nt=norm(e.t); e.nx=norm(e.x);}); cb();};
    s.onerror=function(){box.hidden=false; box.innerHTML='<div class="sempty">Search could not load.</div>';};
    document.head.appendChild(s);
  }
  function snippet(x,nx,term){
    var i=term?nx.indexOf(term):-1; if(i<0){i=0;}
    var a=Math.max(0,i-60), b=Math.min(x.length,i+120);
    var s=(a>0?'… ':'')+x.slice(a,b)+(b<x.length?' …':'');
    if(!term){return esc(s);}
    var re=new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'), parts=[], last=0, m;
    while((m=re.exec(s))!==null){parts.push(esc(s.slice(last,m.index)),'<mark>'+esc(m[0])+'</mark>'); last=m.index+m[0].length; if(!m[0].length){re.lastIndex++;}}
    parts.push(esc(s.slice(last)));
    return parts.join('');
  }
  function run(){
    var raw=q.value.trim(), nq=norm(raw);
    if(nq.length<2){box.hidden=true; box.innerHTML=''; return;}
    var terms=nq.split(/\s+/).filter(Boolean), hits=[];
    window.UIM_SEARCH.forEach(function(e){
      var sc=0;
      for(var i=0;i<terms.length;i++){
        var t=terms[i], inT=e.nt.indexOf(t)>=0, inX=e.nx.indexOf(t)>=0;
        if(!inT&&!inX){return;}
        sc+=inT?10:1;
      }
      if(e.nt.indexOf(nq)>=0){sc+=25;}
      hits.push([sc,e]);
    });
    hits.sort(function(a,b){return b[0]-a[0];});
    hits=hits.slice(0,15);
    box.hidden=false;
    if(!hits.length){box.innerHTML='<div class="sempty">Nothing found for “'+esc(raw)+'”.</div>'; return;}
    var lead=terms.slice().sort(function(a,b){return b.length-a.length;})[0];
    box.innerHTML=hits.map(function(h){var e=h[1]; return '<a class="sres" href="'+esc(e.u)+'"><span class="sres-p">'+esc(e.p)+'</span><span class="sres-t">'+esc(e.t)+'</span><span class="sres-x">'+snippet(e.x,e.nx,lead)+'</span></a>';}).join('');
  }
  var timer;
  q.addEventListener('focus',function(){load(function(){if(q.value){run();}});});
  q.addEventListener('input',function(){clearTimeout(timer); timer=setTimeout(function(){load(run);},120);});
  q.addEventListener('keydown',function(e){
    if(e.key==='Escape'){box.hidden=true; q.blur();}
    if(e.key==='ArrowDown'){var f=box.querySelector('.sres'); if(f){e.preventDefault(); f.focus();}}
    if(e.key==='Enter'){var f2=box.querySelector('.sres'); if(f2){e.preventDefault(); f2.click();}}
  });
  box.addEventListener('keydown',function(e){
    var a=document.activeElement; if(!a.classList.contains('sres')){return;}
    if(e.key==='ArrowDown'&&a.nextElementSibling){e.preventDefault(); a.nextElementSibling.focus();}
    if(e.key==='ArrowUp'){e.preventDefault(); (a.previousElementSibling||q).focus();}
    if(e.key==='Escape'){box.hidden=true; q.focus();}
  });
  box.addEventListener('click',function(e){if(e.target.closest('.sres')){box.hidden=true;}});
  document.addEventListener('click',function(e){if(!e.target.closest('.search')){box.hidden=true;}});
  document.addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement.tagName!=='INPUT'){e.preventDefault(); q.focus();}});
})();
