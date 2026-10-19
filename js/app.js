/* Bússola: painel de tráfego pago white-label.
   Esta cópia é exclusiva do Instituto Lumière: abre sempre a Lumière e não tem seletor de cliente.
   O app é neutro; cada cliente vive em clients/<slug>/ (client.json, data.json, logos).
   Cada data.json traz "visoes" (geral, mensagens, vendas, leads): a barra do topo troca entre elas. */
const NS='http://www.w3.org/2000/svg';
const brl=(n,d=2)=>'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const num=n=>n.toLocaleString('pt-BR');
const pct=(n,d=2)=>n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})+'%';
const fmtDay=d=>{const [m,dd]=d.split('-');return dd+'/'+m};
const dmy=s=>s.split('-').reverse().join('/');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Visões e o que cada uma chama de "resultado" */
const VISOES={
  geral:{rotulo:'Todos os anúncios',ordem:0,icone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>'},
  mensagens:{rotulo:'Mensagens',ordem:1,plural:'Conversas',singular:'conversa',kpi:'Conversas iniciadas',icone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.3A8.4 8.4 0 1 1 21 11.5Z"/></svg>'},
  vendas:{rotulo:'Vendas',ordem:2,plural:'Compras',singular:'compra',kpi:'Compras',icone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.6 8.2H8z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/></svg>'},
  leads:{rotulo:'Leads',ordem:3,plural:'Leads',singular:'lead',kpi:'Leads captados',icone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>'}
};
const RES_PADRAO=VISOES.mensagens; // geral usa o vocabulário do objetivo do cliente

const app=document.getElementById('app');
const tip=document.createElement('div');tip.className='tip';document.body.appendChild(tip);tip.style.position='absolute';
const el=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e};
const showTip=(e,html)=>{tip.innerHTML=html;tip.style.left=(e.clientX+scrollX)+'px';tip.style.top=(e.clientY+scrollY-6)+'px';tip.style.opacity=1};
const hideTip=()=>{tip.style.opacity=0};
function niceScale(v){const p=Math.pow(10,Math.floor(Math.log10((v||1)/5)));const step=[1,2,5,10,20].map(m=>m*p).find(x=>Math.ceil(v/x)<=5);const ticks=Math.max(Math.ceil(v/step),1);return {max:step*ticks,ticks}}

/* tema */
function setTheme(t,persist){document.documentElement.setAttribute('data-theme',t);if(persist){try{localStorage.setItem('bussola-tema',t)}catch(_){}}}
function initTheme(pref){let t=null;try{t=localStorage.getItem('bussola-tema')}catch(_){}
  if(!t)t=pref||(matchMedia('(prefers-color-scheme: light)').matches?'claro':'escuro');
  setTheme(t==='claro'||t==='light'?'light':'dark')}
const ICON_SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const ICON_MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';

/* gráficos */
function barChart(host,days,vals,{color,fmtTick,fmtTip,label}){
  const W=560,H=240,L=46,R=8,T=10,B=26;
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':label});
  const {max,ticks}=niceScale(Math.max(...vals));
  for(let i=0;i<=ticks;i++){const y=T+(H-T-B)*(1-i/ticks);el('line',{x1:L,x2:W-R,y1:y,y2:y,class:'grid-l'},svg);el('text',{x:L-8,y:y+4,'text-anchor':'end'},svg).textContent=fmtTick(max*i/ticks)}
  const bw=(W-L-R)/vals.length;
  vals.forEach((v,i)=>{
    const h=(H-T-B)*v/max;
    el('rect',{x:L+i*bw+1,y:H-B-h,width:Math.max(bw-2,2),height:Math.max(h,0),rx:3,fill:color},svg);
    const hit=el('rect',{x:L+i*bw,y:T,width:bw,height:H-T-B,fill:'transparent'},svg);
    hit.addEventListener('mousemove',e=>showTip(e,`<b>${fmtDay(days[i])}</b>${fmtTip(v)}`));
    hit.addEventListener('mouseleave',hideTip);
    if(i%5===0)el('text',{x:L+i*bw+bw/2,y:H-8,'text-anchor':'middle'},svg).textContent=fmtDay(days[i]);
  });
  host.appendChild(svg);
}
function spark(vals,color){
  if(vals.length<2)return ''; // um dia só (início do mês) não forma linha
  const W=120,H=34,max=Math.max(...vals,1),n=vals.length;
  const pts=vals.map((v,i)=>[i/(n-1)*W,H-2-(H-6)*v/max]);
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L${W} ${H} L0 ${H}Z" fill="${color}" opacity=".16"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
function donut(host,itens,totalLabel){
  const total=itens.reduce((a,i)=>a+i.v,0);
  const S=170,r=62,c=2*Math.PI*r,cx=S/2,cy=S/2;
  const svg=el('svg',{viewBox:`0 0 ${S} ${S}`,role:'img','aria-label':'Participação de cada anúncio nos resultados',class:'donut'});
  el('circle',{cx,cy,r,fill:'none',stroke:'var(--surface-2)','stroke-width':22},svg);
  let acc=0;
  itens.forEach(it=>{
    const len=it.v/total*c, gap=itens.length>1?2.5:0;
    const seg=el('circle',{cx,cy,r,fill:'none',stroke:it.cor,'stroke-width':22,'stroke-dasharray':`${Math.max(len-gap,0)} ${c}`,'stroke-dashoffset':-acc,transform:`rotate(-90 ${cx} ${cy})`},svg);
    seg.addEventListener('mousemove',e=>showTip(e,`<b>${esc(it.nome)}</b>${num(it.v)} (${pct(it.v/total*100,1)})`));
    seg.addEventListener('mouseleave',hideTip);
    acc+=len;
  });
  const t1=el('text',{x:cx,y:cy+2,'text-anchor':'middle',style:'font-size:24px;font-weight:800;fill:var(--ink)'},svg);t1.textContent=num(total);
  const t2=el('text',{x:cx,y:cy+20,'text-anchor':'middle',style:'font-size:11px'},svg);t2.textContent=totalLabel;
  host.appendChild(svg);
}
const table=(id,head,rows)=>{document.getElementById(id).innerHTML=`<thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>`};

/* variação vs período anterior. baixo=true: cair é bom (custos) */
function delta(atual,ant,baixo){
  if(!ant||ant===0)return '';
  const p=(atual-ant)/ant*100, bom=baixo?p<0:p>0, neutro=Math.abs(p)<0.5;
  const cls=neutro?'flat':(bom?'up':'down');
  return `<em class="delta ${cls}" title="vs período anterior">${p>0?'▲':p<0?'▼':'■'} ${Math.abs(p).toLocaleString('pt-BR',{maximumFractionDigits:1})}%</em>`;
}

/* dados */
const getJSON=u=>fetch(u,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(u);return r.json()});
/* períodos: últimos 30 dias (data.json) ou mês atual até o dia da atualização (data-mes.json) */
const PERIODOS={'30d':{rotulo:'Últimos 30 dias',sufixo:''},mes:{rotulo:'Mês atual',sufixo:'-mes'}};
async function carregar(slug){
  const base=`clients/${slug}/`,sf=PERIODOS[estado.periodo].sufixo;
  const [C,D,capas]=await Promise.all([getJSON(base+'client.json'),getJSON(base+`data${sf}.json`),getJSON(base+`capas${sf}.json`).catch(()=>({}))]);
  return {C,D,base,slug,capas};
}
function vazio(msg){app.innerHTML=`<div class="empty"><img src="assets/bussola-mark.svg" alt=""><h1>Bússola</h1><p>${msg}</p></div>`}


/* ===== Métricas: sempre recalculadas a partir de somas (nunca média de médias) ===== */
function metricas(R){
  const link=R.cliquesLink, linkObj=R.cliquesLinkObj||R.cliquesLink;
  return {
    investimento:R.investimento, resultados:R.resultados, custoRes:R.custoPorResultado,
    taxaRes:R.resultados/linkObj*100,            // conversa por clique no link (campanhas do objetivo)
    impressoes:R.impressoes, alcance:R.alcance||null,
    frequencia:R.alcance?R.impressoes/R.alcance:null,
    cpm:R.investimento/R.impressoes*1000,
    ctrLink:link/R.impressoes*100,
    cpcLink:R.investimento/link,
    cliquesLink:link, cliques:R.cliques
  };
}
const soma=(a,k)=>a.reduce((s,x)=>s+(x[k]||0),0);
const pc=(a,b)=>b?((a-b)/b*100):null;
const fmtPc=(v,d=1)=>(v>0?'+':v<0?'−':'')+Math.abs(v).toLocaleString('pt-BR',{maximumFractionDigits:d})+'%';

/* Leitura do período: observações calculadas por regra, sem inventar causa */
function leitura(V,C,D,O){
  const R=metricas(V.resumo),A=metricas(V.anterior),out=[];
  const dr=pc(R.resultados,A.resultados),dc=pc(R.custoRes,A.custoRes);
  const estavel=x=>Math.abs(x)<3;
  const sentRes=dr==null?'':(estavel(dr)?`${O.plural} estáveis`:`${O.plural} ${dr>0?'subiram':'caíram'} ${pct(Math.abs(dr),1)}`);
  const sentCusto=dc==null?'':(estavel(dc)?`custo por ${O.singular} estável`:`custo por ${O.singular} ${dc>0?'subiu':'caiu'} ${pct(Math.abs(dc),1)}`);
  if(sentRes)out.push({t:(dr>=3&&dc<=3)||(estavel(dr)&&dc<-3)?'good':(dr<-3&&dc>3)?'bad':'neutral',
    h:`${sentRes[0].toUpperCase()+sentRes.slice(1)} e ${sentCusto}`,
    d:`${num(A.resultados)} → ${num(R.resultados)} ${O.plural.toLowerCase()}; ${brl(A.custoRes)} → ${brl(R.custoRes)} por ${O.singular}, comparado ao período anterior.`});

  // últimos 7 dias contra os 7 anteriores (ritmo recente)
  const dd=V.diario;if(dd.length>=14){
    const u=dd.slice(-7),a=dd.slice(-14,-7),ur=soma(u,'resultados'),ar=soma(a,'resultados'),ug=soma(u,'gasto'),ag=soma(a,'gasto');
    if(ur>0&&ar>0){const cu=ug/ur,ca=ag/ar,v=pc(cu,ca);
      out.push({t:v<-3?'good':v>3?'bad':'neutral',h:`Ritmo dos últimos 7 dias: ${brl(cu)} por ${O.singular}`,
        d:`${num(ur)} ${O.plural.toLowerCase()} com ${brl(ug)} investidos, contra ${num(ar)} com ${brl(ag)} nos 7 dias anteriores (${fmtPc(v)} no custo).`})}
  }

  // criativos: só os com volume mínimo, para não premiar sorte de amostra pequena
  const vol=V.anuncios.filter(a=>a.resultados>=10&&a.custoResultado);
  if(vol.length>=2){
    const melhor=[...vol].sort((a,b)=>a.custoResultado-b.custoResultado)[0],pior=[...vol].sort((a,b)=>b.custoResultado-a.custoResultado)[0];
    out.push({t:'neutral',h:`Criativo mais eficiente: ${melhor.nome}`,d:`${brl(melhor.custoResultado)} por ${O.singular} com ${num(melhor.resultados)} ${O.plural.toLowerCase()}. O mais caro com volume é ${pior.nome}, a ${brl(pior.custoResultado)}. (Só entram anúncios com 10 ou mais ${O.plural.toLowerCase()}.)`});
  }
  const meta=C.metaCustoResultado;
  if(meta){
    const caro=V.anuncios.filter(a=>a.custoResultado&&a.custoResultado>meta);
    const g=soma(caro,'gasto'),tot=soma(V.anuncios,'gasto');
    if(caro.length&&tot)out.push({t:g/tot>.3?'bad':'neutral',h:`${pct(g/tot*100,0)} do investimento está em anúncios acima da meta de ${brl(meta)}`,d:`${caro.length} ${caro.length===1?'anúncio passa':'anúncios passam'} da meta de custo por ${O.singular}: ${caro.map(a=>a.nome).join('; ')}.`});
  }

  // frequência
  const lim=C.limiteFrequencia||3.5;
  if(R.frequencia&&R.frequencia>=lim)out.push({t:'bad',h:`Frequência alta: ${R.frequencia.toLocaleString('pt-BR',{maximumFractionDigits:1})} impressões por pessoa`,d:`Cada pessoa alcançada viu os anúncios em média ${R.frequencia.toLocaleString('pt-BR',{maximumFractionDigits:1})} vezes (limite de atenção: ${lim.toLocaleString('pt-BR')}). Vale renovar criativos ou ampliar o público.`});

  // dias sem entrega
  const zero=dd.filter((x,i)=>x.gasto<1&&!(D.periodo.parcial&&i===dd.length-1)); // o dia da atualização ainda está em andamento
  if(zero.length)out.push({t:'bad',h:`${zero.length} ${zero.length===1?'dia':'dias'} sem entrega`,d:`Sem investimento em ${zero.map(x=>fmtDay(x.d)).join(' e ')}. Conferir saldo (conta pré-paga) e se os anúncios estavam ativos.`});

  // concentração por idade
  const tot=soma(D.idade.map(i=>({g:i.mulheres.gasto+i.homens.gasto})),'g');
  const topI=[...D.idade].sort((a,b)=>(b.mulheres.gasto+b.homens.gasto)-(a.mulheres.gasto+a.homens.gasto))[0];
  if(topI&&tot){const sh=(topI.mulheres.gasto+topI.homens.gasto)/tot*100;if(sh>=30)out.push({t:'neutral',h:`A faixa de ${topI.faixa} anos recebe ${pct(sh,0)} do investimento`,d:`Dado da conta inteira. Confira se é o público que mais converte, não apenas o que mais recebe entrega.`})}
  return out;
}

/* texto de "Como calculamos" */
function metodologia(O){return `
  <p>Todas as taxas são recalculadas a partir das somas do período. Nunca fazemos média de médias.</p>
  <dl>
  <dt>Investimento</dt><dd>Soma do valor gasto nas campanhas no período.</dd>
  <dt>${O.kpi}</dt><dd>Resultado informado pela Meta para o objetivo da campanha (para mensagens, conversas iniciadas, janela padrão de 7 dias após o clique). Mede o início da conversa, não a venda.</dd>
  <dt>Custo por ${O.singular}</dt><dd>Investimento das campanhas de ${O.plural.toLowerCase()} ÷ ${O.plural.toLowerCase()}. Em todos os anúncios, campanhas de alcance, vídeo e perfil ficam fora desta conta.</dd>
  <dt>Taxa de ${O.singular}</dt><dd>${O.plural} ÷ cliques no link das campanhas de ${O.plural.toLowerCase()}. Diz quantos cliques viram ${O.singular}.</dd>
  <dt>CTR (link)</dt><dd>Cliques no link ÷ impressões. Usamos clique no link e não "todos os cliques", porque este inclui curtidas, perfil e fotos.</dd>
  <dt>CPC (link)</dt><dd>Investimento ÷ cliques no link.</dd>
  <dt>CPM</dt><dd>Investimento ÷ impressões × 1.000.</dd>
  <dt>Alcance e frequência</dt><dd>Alcance é de pessoas únicas na conta inteira (não somamos entre campanhas, senão a mesma pessoa contaria duas vezes). Frequência = impressões ÷ alcance. Na aba de mensagens a frequência aparece por campanha.</dd>
  <dt>Variações (▲ ▼)</dt><dd>Período atual contra o período anterior de mesma duração: nos últimos 30 dias, os 30 dias antes deles; no mês atual, os mesmos dias do mês anterior (por exemplo, 1 a 19 contra 1 a 19). Para custos, cair é bom (verde); para volume, subir é bom.</dd>
  <dt>Leitura do período</dt><dd>Observações geradas por regras sobre os números da tela. Elas descrevem o que aconteceu e não explicam a causa. Anúncios só entram em comparação com 10 ou mais resultados.</dd>
  </dl>`}

/* estado da tela */
const params=new URLSearchParams(location.search);
const CLIENTE='lumiere-jx9gyu';
let estado={slug:CLIENTE,visao:params.get('v'),periodo:params.get('p')==='mes'?'mes':'30d'};
function sincUrl(){const p=new URLSearchParams();if(estado.periodo==='mes')p.set('p','mes');if(estado.visao)p.set('v',estado.visao);history.replaceState(null,'','?'+p.toString())}

async function abrir(slug,visao){
  estado.slug=slug;estado.visao=visao||null;
  try{const ctx=await carregar(slug);render(ctx)}catch(e){vazio('Relatório não encontrado.')}
}

function render(ctx){
  const {C,D,base}=ctx; const capas=ctx.capas||{};
  const chaves=Object.keys(D.visoes).sort((a,b)=>(VISOES[a]?.ordem??9)-(VISOES[b]?.ordem??9));
  if(!estado.visao||!D.visoes[estado.visao])estado.visao=chaves[0];
  const V=D.visoes[estado.visao], ant=V.anterior;
  const obj=VISOES[estado.visao].plural?VISOES[estado.visao]:(VISOES[C.objetivo]||RES_PADRAO);
  const O=obj;
  const M=metricas(V.resumo), A=metricas(ant);
  document.title=`${C.nome} | Relatório de tráfego`;
  document.documentElement.style.setProperty('--client-accent',C.corDestaque||'var(--accent)');
  initTheme(C.tema);
  sincUrl();

  const periodos=`<div class="tabs periodos" role="tablist" aria-label="Período do relatório">${Object.keys(PERIODOS).map(k=>`<button role="tab" class="tab" data-p="${k}" aria-selected="${k===estado.periodo}">${PERIODOS[k].rotulo}</button>`).join('')}</div>`;
  const abas=chaves.length>1?`<div class="tabs" role="tablist" aria-label="Tipo de campanha">${chaves.map(k=>`<button role="tab" class="tab" data-v="${k}" aria-selected="${k===estado.visao}" title="${VISOES[k].rotulo}">${VISOES[k].icone}<span>${VISOES[k].rotulo}</span></button>`).join('')}</div>`:'';

  app.innerHTML=`
  <div class="top">
    <div class="client">
      <span class="bar"></span>
      <img id="logo" alt="${esc(C.nome)}">
      <span class="cname" id="cname" hidden>${esc(C.nome)}</span>
    </div>
    <div class="tools">${periodos}${abas}
      <button class="iconbtn" id="tema" aria-label="Alternar entre tema claro e escuro" title="Alternar tema"></button>
    </div>
  </div>
  <div class="sub-top"><b>Relatório de tráfego pago · ${VISOES[estado.visao].rotulo}</b><span>${D.periodo.rotulo} · ${dmy(D.periodo.inicio)} a ${dmy(D.periodo.fim)} <span class="vs">comparado com ${dmy(D.anterior.inicio)} a ${dmy(D.anterior.fim)}</span></span></div>

  <div class="kpis" id="kpis"></div>
  <div class="kpis kpis-2" id="kpis2"></div>

  <section>
    <h2>Leitura do período</h2>
    <p class="sub">O que mudou e o que merece atenção, calculado a partir dos números desta tela.</p>
    <div class="card"><ul class="insights" id="insights"></ul></div>
  </section>

  <section>
    <h2>Evolução diária</h2>
    <p class="sub">Investimento e ${O.plural.toLowerCase()} por dia, em gráficos separados porque têm escalas diferentes.</p>
    <div class="grid2">
      <div class="card"><h3>Investimento por dia</h3><div class="note">R$ gastos em anúncios</div><div id="c-gasto"></div></div>
      <div class="card"><h3>${O.kpi} por dia</h3><div class="note">${estado.visao==='geral'?'Nas campanhas de '+O.plural.toLowerCase():'Nas campanhas selecionadas'}</div><div id="c-res"></div></div>
    </div>
  </section>

  <section>
    <h2>Funil de tráfego</h2>
    <p class="sub">Da impressão do anúncio até o resultado.</p>
    <div class="grid2">
      <div class="card"><div class="funnel" id="funil"></div></div>
      <div class="card"><h3>Melhores anúncios por resultado</h3><div class="note">Participação nas ${O.plural.toLowerCase()}</div><div class="donutbox"><div id="c-donut"></div><ul class="dl" id="dl"></ul></div></div>
    </div>
  </section>

  <section>
    <h2>Campanhas</h2>
    <p class="sub">Resultado conforme o objetivo de cada campanha.</p>
    <div class="card"><div class="tablewrap"><table id="t-camp"></table></div></div>
  </section>

  <section>
    <h2>Criativos</h2>
    <p class="sub">A capa de cada anúncio com o resultado dele no período. Custo por ${O.singular} só nos anúncios que geram ${O.plural.toLowerCase()}.</p>
    <div class="adbar"><div class="chips" role="group" aria-label="Filtrar anúncios"><button class="chip" data-f="rodando" aria-pressed="true">Rodando</button><button class="chip" data-f="todos" aria-pressed="false">Todos do período</button></div><span class="adcount" id="adcount"></span></div>
    <div class="ads" id="ads"></div>
    <details class="card metodo"><summary>Ver como tabela</summary><div class="tablewrap"><table id="t-ads"></table></div></details>
  </section>

  <section>
    <h2>Público e região</h2>
    <p class="sub">Para quem o investimento está indo. Dados da conta inteira, independente da aba.</p>
    <div class="grid2">
      <div class="card"><h3>Investimento por idade e gênero</h3><div class="note">R$ no período</div><div class="legend" id="leg-idade"></div><div id="c-idade"></div></div>
      <div class="card"><h3>Região</h3><div class="note">Investimento e alcance por estado</div><div id="c-regiao"></div></div>
      <div class="card" id="card-plat" hidden><h3>Plataforma</h3><div class="note">Onde os anúncios foram exibidos</div><div id="c-plat"></div></div>
    </div>
  </section>

  <details class="card metodo"><summary>Como calculamos cada número</summary><div id="metodo"></div></details>

  <footer>
    <span>Fonte: ${esc(D.fonte)} · atualizado em ${dmy(D.atualizadoEm)}</span>
    <span class="brand"><img src="assets/bussola-mark.svg" alt="">Bússola</span>
  </footer>`;

  /* topo */
  const logo=document.getElementById('logo'),cname=document.getElementById('cname');
  const aplicaLogo=()=>{const claro=document.documentElement.getAttribute('data-theme')==='light';const f=C.logo&&(claro?C.logo.claro:C.logo.escuro);
    if(f){logo.src=base+f;logo.hidden=false;cname.hidden=true}else{logo.hidden=true;cname.hidden=false}};
  aplicaLogo();
  const btn=document.getElementById('tema');
  const pintaBtn=()=>{btn.innerHTML=document.documentElement.getAttribute('data-theme')==='light'?ICON_MOON:ICON_SUN};
  pintaBtn();
  btn.onclick=()=>{setTheme(document.documentElement.getAttribute('data-theme')==='light'?'dark':'light',true);pintaBtn();aplicaLogo()};
  app.querySelectorAll('.tab[data-v]').forEach(b=>b.onclick=()=>{estado.visao=b.dataset.v;render(ctx)});
  app.querySelectorAll('.tab[data-p]').forEach(b=>b.onclick=()=>{if(b.dataset.p!==estado.periodo){estado.periodo=b.dataset.p;abrir(estado.slug,estado.visao)}});

  /* KPIs: 4 principais + métricas de apoio */
  const dia=k=>V.diario.map(d=>d[k]);
  const temDia=k=>V.diario[0][k]!==undefined;
  const lim=C.limiteFrequencia||3.5;
  const card=(rot,val,dl,sp,cls,nota)=>`<div class="kpi ${cls||''}"><small>${rot}</small><strong>${val}</strong><div class="kfoot">${dl}${sp||''}</div>${nota?`<span class="knota">${nota}</span>`:''}</div>`;
  document.getElementById('kpis').innerHTML=[
    card('Investimento',brl(M.investimento),delta(M.investimento,A.investimento,false),spark(dia('gasto'),'var(--s1)')),
    card(O.kpi,num(M.resultados),delta(M.resultados,A.resultados,false),spark(dia('resultados'),'var(--s2)'),'hero'),
    card('Custo por '+O.singular,brl(M.custoRes),delta(M.custoRes,A.custoRes,true),'','', estado.visao==='geral'?'só campanhas de '+O.plural.toLowerCase():''),
    card('Taxa de '+O.singular,pct(M.taxaRes,1),delta(M.taxaRes,A.taxaRes,false),'','','cliques no link que viram '+O.singular)
  ].join('');
  const sec=[
    card('Impressões',num(M.impressoes),delta(M.impressoes,A.impressoes,false),temDia('imp')?spark(dia('imp'),'var(--ink-3)'):''),
    M.alcance?card('Alcance',num(M.alcance),delta(M.alcance,A.alcance,false),'', '', 'pessoas únicas'):'',
    M.frequencia?card('Frequência',M.frequencia.toLocaleString('pt-BR',{maximumFractionDigits:2}),delta(M.frequencia,A.frequencia,true),'', M.frequencia>=lim?'alert':'', M.frequencia>=lim?'acima de '+lim.toLocaleString('pt-BR')+', atenção':'impressões por pessoa'):'',
    card('CPM',brl(M.cpm),delta(M.cpm,A.cpm,true),'','','custo por mil impressões'),
    card('CTR (link)',pct(M.ctrLink),delta(M.ctrLink,A.ctrLink,false),'','','cliques no link ÷ impressões'),
    card('CPC (link)',brl(M.cpcLink),delta(M.cpcLink,A.cpcLink,true),'','','custo por clique no link'),
    card('Cliques no link',num(M.cliquesLink),delta(M.cliquesLink,A.cliquesLink,false),temDia('link')?spark(dia('link'),'var(--ink-3)'):'','',`${num(M.cliques)} cliques no total`)
  ].filter(Boolean);
  document.getElementById('kpis2').innerHTML=sec.join('');

  /* leitura do período */
  const LT=leitura(V,C,D,O);
  document.getElementById('insights').innerHTML=LT.map(x=>`<li class="${x.t}"><i aria-hidden="true">${x.t==='good'?'▲':x.t==='bad'?'!':'•'}</i><div><b>${esc(x.h)}</b><span>${esc(x.d)}</span></div></li>`).join('')||'<li class="neutral"><i>•</i><div><b>Sem alertas no período</b></div></li>';
  document.getElementById('metodo').innerHTML=metodologia(O);

  /* diário */
  const dias=V.diario.map(d=>d.d);
  barChart(document.getElementById('c-gasto'),dias,dia('gasto'),{color:'var(--s1)',fmtTick:v=>'R$ '+Math.round(v),fmtTip:brl,label:'Investimento diário'});
  barChart(document.getElementById('c-res'),dias,dia('resultados'),{color:'var(--s2)',fmtTick:v=>String(Math.round(v)),fmtTip:v=>v+' '+(v===1?O.singular:O.plural.toLowerCase()),label:O.plural+' por dia'});

  /* funil: só campanhas do objetivo; "todos os cliques" não é etapa, é um conjunto maior */
  const F=V.funil||{impressoes:V.resumo.impressoes,cliquesLink:V.resumo.cliquesLink,resultados:V.resumo.resultados};
  const passos=[['Impressões',F.impressoes],['Cliques no link',F.cliquesLink],[O.kpi,F.resultados]];
  let h='';
  passos.forEach((st,i)=>{
    const w=Math.max(st[1]/passos[0][1]*100,6);
    h+=`<div class="fstep ${i===passos.length-1?'last':''}"><div class="fill" style="width:${w}%;opacity:${i===passos.length-1?1:.45+i*.25}"></div><span>${st[0]}</span><b>${num(st[1])}</b></div>`;
    if(i<passos.length-1)h+=`<div class="rate">↓ <em>${pct(passos[i+1][1]/st[1]*100,i===0?2:1)}</em> ${i===0?'clicam no link (CTR)':'viram '+O.singular}</div>`;
  });
  document.getElementById('funil').innerHTML=h;

  /* donut por anúncio */
  const cores=['var(--r1)','var(--r2)','var(--r3)','var(--r4)','var(--r5)'];
  const rank=[...V.anuncios].filter(a=>a.resultados>0).sort((a,b)=>b.resultados-a.resultados);
  const top=rank.slice(0,5).map((a,i)=>({id:a.id,nome:a.nome,v:a.resultados,cor:cores[i]}));
  const resto=rank.slice(5).reduce((s,a)=>s+a.resultados,0);
  if(resto>0)top.push({nome:'Outros',v:resto,cor:'var(--s3)'});
  const totalD=top.reduce((s,i)=>s+i.v,0);
  donut(document.getElementById('c-donut'),top,O.plural.toLowerCase());
  document.getElementById('dl').innerHTML=top.map(i=>{const c=capas[i.id]||capas[i.nome];return `<li><i style="background:${i.cor}"></i>${c&&c.url?`<img class="mini" src="${c.url}" alt="" referrerpolicy="no-referrer" loading="lazy">`:''}<span>${esc(i.nome)}</span><b>${pct(i.v/totalD*100,0)}</b></li>`}).join('');

  /* tabelas */
  table('t-camp',['Campanha','Investido','Impressões','Freq.','Cliques no link','CTR (link)','CPC (link)','Resultado','Custo/result.'],
    V.campanhas.map(c=>`<tr><td>${esc(c.nome)}</td><td>${brl(c.gasto)}</td><td>${num(c.imp)}</td><td>${c.freq?c.freq.toLocaleString('pt-BR',{maximumFractionDigits:2}):'–'}</td><td>${c.link?num(c.link):'–'}</td><td>${c.link?pct(c.link/c.imp*100):'–'}</td><td>${c.link?brl(c.gasto/c.link):'–'}</td><td>${num(c.resultado)} <span class="muted">${esc(c.tipo.toLowerCase())}</span></td><td>${c.custoResultado?brl(c.custoResultado):'–'}</td></tr>`));
  const maxG=Math.max(...V.anuncios.map(a=>a.gasto));
  const vol=V.anuncios.filter(a=>a.resultados>=10&&a.custoResultado);
  const melhor=vol.length?Math.min(...vol.map(a=>a.custoResultado)):null;
  const meta=C.metaCustoResultado;
  table('t-ads',['Anúncio','Investido','Impressões','Cliques no link','CTR (link)',O.plural,'Custo/'+O.singular],
    V.anuncios.map(a=>`<tr><td>${esc(a.nome)}</td><td>${brl(a.gasto)}<span class="spendbar" style="width:${a.gasto/maxG*60}px"></span></td><td>${num(a.imp)}</td><td>${a.link!=null?num(a.link):'–'}</td><td>${(a.ctrLink??a.ctr)?pct(a.ctrLink??a.ctr):'–'}</td><td>${num(a.resultados)}</td><td>${a.custoResultado?brl(a.custoResultado):'<span class="muted">sem resultado</span>'}${a.custoResultado&&a.custoResultado===melhor?'<span class="pill">menor custo</span>':(meta&&a.custoResultado>meta?'<span class="pill warn">acima da meta</span>':'')}</td></tr>`));

  /* criativos com capa */
  const STAT={ACTIVE:['Rodando','on'],PAUSED:['Pausado','off'],CAMPAIGN_PAUSED:['Campanha pausada','off'],ADSET_PAUSED:['Conjunto pausado','off']};
  const infoAd=a=>capas[a.id]||capas[a.nome]||{};
  const rodando=a=>(infoAd(a).status||'ACTIVE')==='ACTIVE';
  let filtro='rodando';
  const desenhaAds=()=>{
    const lista=[...V.anuncios].filter(a=>filtro==='todos'||rodando(a)).sort((a,b)=>(rodando(b)-rodando(a))||(b.gasto-a.gasto));
    document.getElementById('adcount').textContent=`${lista.length} ${lista.length===1?'anúncio':'anúncios'} · ${V.anuncios.filter(rodando).length} rodando de ${V.anuncios.length}`;
    document.getElementById('ads').innerHTML=lista.map(a=>{
      const c=infoAd(a),st=STAT[c.status||'ACTIVE']||['—','off'];
      const caro=meta&&a.custoResultado&&a.custoResultado>meta;
      const fmt=c.tipo?(c.tipo+(c.duracao?` · ${c.duracao}s`:'')):'';
      return `<article class="ad ${rodando(a)?'':'parado'}"><div class="thumb">${c.url?`<img src="${c.url}" alt="Capa do anúncio ${esc(a.nome)}" decoding="async" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'nocapa',textContent:'sem capa'}))">`:'<div class="nocapa">sem capa</div>'}<span class="st ${st[1]}">${st[0]}</span>${fmt?`<span class="fmt">${fmt}</span>`:''}</div>
        <div class="ab"><h4>${esc(a.nome)}</h4>
        <div class="am"><div><small>Investido</small><b>${brl(a.gasto)}</b></div><div><small>${O.plural}</small><b>${num(a.resultados)}</b></div><div><small>Custo/${O.singular}</small><b>${a.custoResultado?brl(a.custoResultado):'–'}</b></div><div><small>CTR (link)</small><b>${(a.ctrLink??a.ctr)?pct(a.ctrLink??a.ctr):'–'}</b></div></div>
        ${a.custoResultado&&a.custoResultado===melhor?'<span class="pill">menor custo</span>':''}${caro?'<span class="pill warn">acima da meta</span>':''}</div></article>`}).join('')||'<p class="sub">Nenhum anúncio neste filtro.</p>';
  };
  desenhaAds();
  app.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{filtro=b.dataset.f;app.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===b));desenhaAds()});

  /* idade e gênero (só desenha o que existe) */
  const temH=D.idade.some(i=>i.homens.gasto>0), temM=D.idade.some(i=>i.mulheres.gasto>0);
  const series=[temM&&['mulheres','Mulheres','var(--s1)'],temH&&['homens','Homens','var(--s2)']].filter(Boolean);
  document.getElementById('leg-idade').innerHTML=series.map(s=>`<span><i style="background:${s[2]}"></i>${s[1]}</span>`).join('');
  const W=560,H=250,L=46,Rr=8,T=10,B=26;
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Investimento por idade e gênero'});
  const sc=niceScale(Math.max(...D.idade.flatMap(i=>series.map(s=>i[s[0]].gasto)))),mx=sc.max;
  for(let i=0;i<=sc.ticks;i++){const y=T+(H-T-B)*(1-i/sc.ticks);el('line',{x1:L,x2:W-Rr,y1:y,y2:y,class:'grid-l'},svg);el('text',{x:L-8,y:y+4,'text-anchor':'end'},svg).textContent='R$ '+Math.round(mx*i/sc.ticks)}
  const gw=(W-L-Rr)/D.idade.length, ns=series.length;
  D.idade.forEach((g,i)=>{
    series.forEach((s,j)=>{
      const v=g[s[0]].gasto,hh=(H-T-B)*v/mx,bw=(gw-22)/ns,x=L+i*gw+11+j*bw;
      el('rect',{x:x+(j?1:0),y:H-B-hh,width:bw-1,height:hh,rx:3,fill:s[2]},svg);
    });
    const hit=el('rect',{x:L+i*gw,y:T,width:gw,height:H-T-B,fill:'transparent'},svg);
    hit.addEventListener('mousemove',e=>showTip(e,`<b>${g.faixa} anos</b>`+series.map(s=>`${s[1]} ${brl(g[s[0]].gasto)} · ${num(g[s[0]].cliques)} cliques`).join('<br>')));
    hit.addEventListener('mouseleave',hideTip);
    el('text',{x:L+i*gw+gw/2,y:H-8,'text-anchor':'middle'},svg).textContent=g.faixa;
  });
  document.getElementById('c-idade').appendChild(svg);

  /* plataforma */
  if(D.plataforma&&D.plataforma.length){
    document.getElementById('card-plat').hidden=false;
    const tp=D.plataforma.reduce((a,x)=>a+x.gasto,0);
    document.getElementById('c-plat').innerHTML=D.plataforma.map(x=>`<div class="reg"><div class="l"><span>${esc(x.nome)}</span><span>${brl(x.gasto)} · ${pct(x.gasto/tp*100,0)}</span></div><div class="t"><i style="width:${x.gasto/tp*100}%"></i></div><div class="m">${num(x.imp)} impressões${x.link?` · ${num(x.link)} cliques no link`:''}</div></div>`).join('');
  }

  /* região */
  const tot=D.regiao.reduce((a,r)=>a+r.gasto,0);
  document.getElementById('c-regiao').innerHTML=D.regiao.map(r=>`<div class="reg"><div class="l"><span>${esc(r.uf)}</span><span>${brl(r.gasto)} · ${pct(r.gasto/tot*100,0)}</span></div><div class="t"><i style="width:${r.gasto/tot*100}%"></i></div><div class="m">${num(r.alcance)} contas alcançadas · ${num(r.cliques)} cliques</div></div>`).join('');
}

/* início */
(async()=>{
  initTheme();
  abrir(estado.slug,estado.visao);
})();
