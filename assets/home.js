(function(){
  var done=[]; try{done=JSON.parse(localStorage.getItem('uim-guide-progress-v1')||'[]');}catch(e){}
  var cards=[].slice.call(document.querySelectorAll('[data-ch]')), first=null, sum=0, tot=0;
  function bar(el,d,t){var p=t?Math.round(d*100/t):0; el.querySelector('.xpfill').style.width=p+'%'; el.querySelector('.xplabel').textContent=d+' / '+t+' · '+p+'%';}
  cards.forEach(function(c){
    var k=c.getAttribute('data-ch'), t=+c.getAttribute('data-total');
    var d=Math.min(t,done.filter(function(x){return x.indexOf(k+'-')===0;}).length);
    bar(c.querySelector('.xpbar'),d,t); sum+=d; tot+=t;
    var b=c.querySelector('.btn'); if(d>0&&d<t){b.textContent='Continue Chapter '+k.slice(2); b.href=b.getAttribute('href')+'#continue';}
    if(d>=t){b.textContent='Chapter done';}
    if(first===null&&d<t){first=c;}
  });
  bar(document.getElementById('allbar'),sum,tot);
  var go=document.getElementById('go');
  if(first){go.href=first.querySelector('.btn').getAttribute('href').split('#')[0]+(sum?'#continue':''); go.textContent=sum?'Continue where I left off':'Start with Chapter 1';}
  else{go.textContent='Every chapter is ticked'; go.removeAttribute('href');}
})();
