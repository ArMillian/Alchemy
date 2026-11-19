'use strict';

const stage = document.querySelector('#stage');
const slides = [...document.querySelectorAll('.slide')];
const titles = slides.map(slide => {
  const heading = slide.querySelector('h1, h2');
  // Read hidden headings too, preserving word breaks across lines.
  return Array.from(heading.childNodes, node => node.textContent).join(' ').replace(/\s+/g, ' ').trim();
});
const progress = document.querySelector('#progress');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const overlay = document.querySelector('#overlay');
const panelBody = document.querySelector('#panel-body');
const prev = document.querySelector('#prev');
const next = document.querySelector('#next');
const number = n => String(n).padStart(2, '0');
document.querySelector('#total').textContent = number(slides.length);
let current = -1;
let intro, drawing, focusReturn, metalPulse;
let metal = 0;
const nextIcon = next.innerHTML;
const restartIcon = document.querySelector('#replay svg').outerHTML;

function scaleStage() {
  const viewport = document.getElementById('viewport');
  stage.style.setProperty('--scale', Math.min(viewport.clientWidth / 1600, viewport.clientHeight / 900));
}
scaleStage();
window.addEventListener('resize', scaleStage);

const source = {
  papyrus: ['Լեյդենի պապիրուսը․ մատանիների գունավորումն ու ոսկու փորձարկումը', 'https://en.wikisource.org/wiki/Leyden_Papyrus_X'],
  gold: ['Քիմիայի թագավորական ընկերություն․ ոսկու հատկությունները', 'https://periodic-table.rsc.org/element/79/Gold'],
  tools: ['Մետրոպոլիտեն թանգարան․ թորման անոթի կառուցվածքը', 'https://www.metmuseum.org/de/perspectives/alembics'],
  workshop: ['Գիտության պատմության ինստիտուտ․ Մյուլլերի լաբորատոր տեսարանը', 'https://digital.sciencehistory.org/works/fjlft5q'],
  ripley: ['Ուելքոմի հավաքածու․ Ռիպլիի մագաղաթագլանը', 'https://wellcomecollection.org/works/c6zug9t9'],
  lions: ['Էդինբուրգի բժիշկների թագավորական քոլեջ․ մագաղաթագլանի պատկերները', 'https://www.rcpe.ac.uk/heritage/heritage-blog/ripleys-alchemical-scrolls'],
  basel: ['Բազելի համալսարան․ Պարացելսի դասախոսությունները', 'https://unigeschichte.unibas.ch/fakultaeten-und-faecher/philnat-fakultaet/zur-geschichte-der-philnat-fakultaet/pharmazeutische-wissenschaften/paracelsus'],
  miners: ['ԱՄՆ բժշկության ազգային գրադարան․ հանքափորների հիվանդությունների մասին', 'https://www.ncbi.nlm.nih.gov/nlmcatalog/466131'],
  portrait: ['Ուելքոմի հավաքածու․ Պարացելսի 1538 թ․ դիմանկարը', 'https://wellcomecollection.org/works/fdnjrmkz'],
  cup: ['Գիտության թանգարան․ ծարիրից պատրաստված գավաթը', 'https://collection.sciencemuseumgroup.org.uk/objects/co142080/antimony-cup-europe-1501-1700'],
  formulary: ['Բժիշկների թագավորական քոլեջ․ Լոնդոնի դեղագիրքը', 'https://history.rcp.ac.uk/timeline'],
  foxglove: ['Ուիլյամ Ուիթերինգ․ մատնոցուկի ուսումնասիրությունը, 1785 թ․', 'https://wellcomecollection.org/works/ufv9b2aq'],
  pharmacyArt: ['Գիտության պատմության ինստիտուտ․ իտալական դեղատան պատկերը', 'https://digital.sciencehistory.org/works/0k225b929'],
  bologna: ['Միլանի համալսարան․ Բոլոնիայի լուսարձակող քարի պատմությունը', 'https://air.unimi.it/handle/2434/1173336'],
  phosphorus: ['Քիմիայի թագավորական ընկերություն․ ֆոսֆորի հայտնագործումն ու հատկությունները', 'https://periodic-table.rsc.org/element/15/Phosphorus'],
  brand: ['Ուելքոմի հավաքածու․ Բրանդի և լուսարձակող անոթի փորագրանկարը', 'https://wellcomecollection.org/works/k4gzk252'],
  origins: ['Ալքիմիայի վաղ պատմությունը և Զոսիմոսի գործիքները', 'https://www.sciencehistory.org/stories/magazine/the-secrets-of-alchemy/'],
  planets: ['Երկնային մարմինների անունները ալքիմիական բաղադրատոմսերում', 'https://www.sciencehistory.org/stories/magazine/al-kimiya-notes-on-arabic-alchemy/'],
  medicine: ['Պարացելսի երեք սկզբունքները և քիմիական բժշկությունը', 'https://www.ncbi.nlm.nih.gov/books/NBK583763/'],
  dose: ['Պարացելսը և չափաբաժնի նշանակությունը', 'https://pubmed.ncbi.nlm.nih.gov/32560760/'],
  elements: ['Արիստոտել․ «Առաջացման և ոչնչացման մասին», գիրք երկրորդ', 'https://classics.mit.edu/Aristotle/gener_corr.2.ii.html'],
  ether: ['Արիստոտել․ «Երկնքի մասին», գիրք առաջին', 'https://classics.mit.edu/Aristotle/heavens.1.i.html'],
  maier: ['Միքայել Մայեր․ 21-րդ խորհրդապատկերը, 1618 թ․', 'https://furnaceandfugue.org/atalanta-fugiens/emblem21.html'],
  dee: ['Ջոն Դի․ «Հիերոգլիֆային մոնադ», 1564 թ․ հրատարակություն', 'https://www.loc.gov/resource/rbc.2009fabyan23473/'],
  parts: ['Ջոն Դիի բացատրությունը նշանի բաղադրիչների մասին', 'https://www.esotericarchives.com/dee/monad.htm']
};
const references = [
  ['Լաբորատորիայի տեսարանը գեղարվեստական պատկերազարդում է։', ['origins','medicine']],
  ['Ուրոբորոսի փորագրանկարը ներկայացված է տրամադրված նյութերից։ Նշանների շարքը վերագծվել է դրանց հայերեն նկարազարդման հիման վրա։', ['origins']],
  ['Մետաղների և երկնային մարմինների զույգերը ներկայացված են ըստ պատմական ալքիմիական ավանդույթի։ Նշանները վերագծվել են տրամադրված պատկերների հիման վրա։', ['planets']],
  ['Նշանները վերցված են երեք սկզբունքների մասին տրամադրված նյութից։ Հանքային նմուշների պատկերը գեղարվեստական պատկերազարդում է։', ['medicine','dose']],
  ['Եռանկյունաձև նշանները վերագծվել են տրամադրված նկարազարդման հիման վրա։ Դրանք հետագա ալքիմիական ավանդույթից են։', ['elements','ether']],
  ['Կառուցումը հետևում է Մայերի պատկերագրին։ Ներդրված պատկերների ձևը վերագծվել է տրամադրված գծապատկերից։', ['maier','origins']],
  ['Մոնադը վերագծվել է տրամադրված պատկերից։ Բաղադրիչների անվանումները հետևում են Ջոն Դիի մեկնաբանությանը։', ['dee','parts']],
  ['Պատկերում մասնիկների գունափոխությունը խորհրդանշում է ալքիմիկոսների ակնկալիքը։ Պապիրուսի բաղադրագրերը նկարագրում են նաև ոսկու նմանակումն ու ստուգումը։', ['papyrus','gold']],
  ['Մյուլլերի կտավը ներկայացնում է ալքիմիկոսի աշխատասենյակը հետագա նկարչի հայացքով։ Գծապատկերը ցույց է տալիս գոլորշու ու խտացած հեղուկի ուղին։', ['workshop','tools']],
  ['Մագաղաթագլանի հատվածն ու երկու խոշորացումները Ուելքոմի հավաքածուից են։ Բաղադրատոմսի հերթականությունը թաքցնելու օրինակը արաբական ալքիմիական ավանդույթից է։', ['ripley','lions','planets']],
  ['Աուգուստին Հիրշֆոգելի փայտափոր դիմանկարը ստեղծվել է Պարացելսի կենդանության օրոք։ Բնօրինակը պահվում է Ուելքոմի հավաքածուում։', ['portrait','basel','miners']],
  ['Դեղատան տեսարանը 17-րդ դարի իտալական կտավի հատված է՝ Գիտության պատմության ինստիտուտի հավաքածուից։', ['pharmacyArt','cup','formulary','foxglove']],
  ['Բրանդին պատկերող փորագրանկարը ստեղծվել է հայտնագործությունից ավելի քան մեկ դար անց։ Այն պահվում է Ուելքոմի հավաքածուում։', ['brand','bologna','phosphorus']],
  ['Թորման սարքով լաբորատորիան տվյալ ժամանակաշրջանի գեղարվեստական պատկերազարդում է։', ['medicine','dose']]
];

slides.forEach((slide, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.title = button.ariaLabel = (index + 1) + '․ ' + titles[index];
  button.addEventListener('click', () => showSlide(index));
  progress.append(button);
});

function drawStone() {
  drawing?.kill();
  const shapes = [...document.querySelector('.stone-lines').children];
  gsap.set(shapes, {clearProps: 'strokeDasharray,strokeDashoffset'});
  if (reduced.matches) return;
  drawing = gsap.timeline();
  shapes.forEach(shape => {
    const length = shape.getTotalLength() + 1;
    gsap.set(shape, {strokeDasharray: length, strokeDashoffset: length});
    drawing.to(shape, {strokeDashoffset: 0, duration: .57, ease: 'power1.inOut'}, '>-0.04');
  });
}

function showSlide(index, instant = false) {
  if (index < 0 || index >= slides.length || (index === current && !instant)) return;
  const previous = current;
  const animate = !instant && !reduced.matches;
  intro?.kill();
  drawing?.kill();
  gsap.killTweensOf(slides);
  current = index;
  const active = slides[index];
  slides.forEach((slide, i) => {
    const selected = i === index;
    slide.classList.toggle('active', selected);
    slide.inert = !selected;
    slide.setAttribute('aria-hidden', String(!selected));
    slide.style.zIndex = selected ? 2 : 0;
    if (!selected && (!animate || i !== previous)) gsap.set(slide, {autoAlpha: 0});
  });
  if (animate && previous >= 0 && index !== previous) {
    // Keep the outgoing plate behind the incoming one to avoid a dark flash.
    gsap.set(slides[previous], {autoAlpha: 1, zIndex: 1});
    gsap.to(slides[previous], {autoAlpha: 0, duration: .39, delay: .12, overwrite: true});
  }
  gsap.to(active, {autoAlpha: 1, duration: animate ? .43 : 0, overwrite: true});
  const items = active.querySelectorAll('.intro');
  gsap.set(items, {clearProps: 'opacity,translate,transform'});
  if (animate) {
    intro = gsap.timeline();
    intro.from(items, {opacity: 0, y: 10, duration: .49, stagger: .045, ease: 'power2.out'}, 0);
    if (index === 6) {
      gsap.set('.monad-lines > *', {clearProps: 'opacity,transform'});
      intro.from('.monad-lines > *', {opacity: 0, y: -8, duration: .45, stagger: .16}, .18);
    }
  } else if (index === 6) {
    gsap.set('.monad-lines > *', {clearProps: 'opacity,transform'});
  }
  if (index === 5) drawStone();
  stage.classList.toggle('light', active.classList.contains('paper'));
  prev.disabled = index === 0;
  next.innerHTML = index === slides.length - 1 ? restartIcon : nextIcon;
  next.ariaLabel = next.title = index === slides.length - 1 ? 'Վերադառնալ սկիզբ' : 'Հաջորդ սլայդ';
  document.querySelector('#current').textContent = number(index + 1);
  [...progress.children].forEach((b,i) => i === index ? b.setAttribute('aria-current','step') : b.removeAttribute('aria-current'));
  document.querySelector('#announce').textContent = (index + 1) + '․ ' + titles[index];
}

const metalButtons = [...document.querySelectorAll('[data-metal]')];
const metalRows = [...document.querySelectorAll('.metal-row')];
function selectMetal(index, animate = true) {
  metal = index;
  const row = metalRows[index];
  const hub = document.querySelector('.hub');
  const names = row.querySelectorAll('span');
  hub.querySelector('use').setAttribute('href', row.querySelector('use').getAttribute('href'));
  hub.querySelector('strong').textContent = names[0].textContent;
  hub.querySelector('span').textContent = names[1].textContent;
  hub.style.setProperty('--metal', row.style.getPropertyValue('--metal'));
  for (const btn of metalButtons) btn.setAttribute('aria-pressed', String(+btn.dataset.metal === index));
  metalPulse?.kill();
  if (animate && !reduced.matches) {
    metalPulse = gsap.fromTo(hub.children, {opacity:.45}, {opacity:1, duration:.27, stagger:.025});
  } else gsap.set(hub.children, {opacity:1});
}
metalButtons.forEach(btn => btn.addEventListener('click', () => selectMetal(+btn.dataset.metal)));
selectMetal(0,false);

function openPanel(type, trigger) {
  const isContents = type === 'contents';
  focusReturn = trigger;
  document.querySelector('#panel-title').textContent = isContents ? 'Բովանդակություն' : 'Սլայդի աղբյուրները';
  panelBody.replaceChildren();
  if (isContents) {
    titles.forEach((title, i) => {
      const button = document.createElement('button');
      button.className = 'toc-row';
      const label = document.createElement('span');
      label.textContent = number(i + 1);
      button.append(label, title);
      if (i === current) button.setAttribute('aria-current','step');
      button.addEventListener('click', () => {closePanel(); showSlide(i);});
      panelBody.append(button);
    });
  } else {
    const [note, keys] = references[current];
    const p = document.createElement('p');
    p.textContent = note;
    panelBody.append(p);
    keys.forEach(key => {
      const [title, url] = source[key];
      const link = document.createElement('a');
      link.className = 'ref';
      link.textContent = title;
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      panelBody.append(link);
    });
  }
  overlay.hidden = false;
  for (const el of [slides[current],stage.querySelector('header'),stage.querySelector('footer')]) el.inert = true;
  overlay.querySelector('.close').focus();
}
function closePanel(){
  overlay.hidden = true;
  for (const el of [slides[current],stage.querySelector('header'),stage.querySelector('footer')]) el.inert = false;
  focusReturn?.focus({preventScroll:true});
}
for (const type of ['contents','sources']) {
  document.getElementById(type).addEventListener('click', event => openPanel(type,event.currentTarget));
}
overlay.querySelector('.close').addEventListener('click', closePanel);
overlay.addEventListener('click', event => {if (event.target === overlay) closePanel();});
document.querySelector('#replay').addEventListener('click', drawStone);
prev.addEventListener('click', () => showSlide(current - 1));
next.addEventListener('click', () => showSlide((current + 1) % slides.length));
const fullscreen = document.querySelector('#fullscreen');
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    document.querySelector('#announce').textContent = 'Այս պատուհանում ամբողջ էկրանի ռեժիմն անհասանելի է։';
  }
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.title = fullscreen.ariaLabel = document.fullscreenElement ? 'Փակել ամբողջ էկրանը' : 'Ամբողջ էկրան';
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.metaKey || event.ctrlKey) return;
  if (!overlay.hidden) {
    if (event.key === 'Escape') closePanel();
    if (event.key === 'Tab') {
      const controls = [...overlay.querySelectorAll('button,a[href]')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    }
    return;
  }
  if (event.code === 'Space' && event.target.closest('button,a')) return;
  const target = {ArrowRight:current+1,ArrowDown:current+1,ArrowLeft:current-1,ArrowUp:current-1,Home:0,End:slides.length-1,' ':current+1}[event.key];
  if (target !== undefined) {event.preventDefault();showSlide(target);}
});
stage.addEventListener('pointermove', event => {
  if (reduced.matches || !overlay.hidden || event.pointerType !== 'mouse') return;
  const photo = slides[current]?.querySelector('.photo');
  if (!photo) return;
  const bounds = stage.getBoundingClientRect();
  gsap.to(photo,{x:((event.clientX-bounds.left)/bounds.width-.5)*8, y:((event.clientY-bounds.top)/bounds.height-.5)*6,duration:.65,overwrite:true});
});
reduced.addEventListener('change', () => {
  if (reduced.matches) {gsap.killTweensOf('.photo');gsap.set('.photo',{x:0,y:0});selectMetal(metal,false);}
  showSlide(current,true);
});
showSlide(0);

