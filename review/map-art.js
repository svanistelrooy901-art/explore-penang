/* Original vector map symbols. Symbol sizes are illustrative, not footprints. */
(function (root) {
  'use strict';
  const n = v => Number(v.toFixed(2));
  function at(x,y,body,scale=1){return `<g transform="translate(${n(x)} ${n(y)}) scale(${scale})">${body}</g>`;}
  const shade = '<ellipse cy="7" rx="25" ry="9" fill="#123f39" opacity=".18"/>';
  function tree(x,y,s=1,seed=0){
    const tones=['#428960','#347956','#55966b','#2c6c52'];
    const c=tones[seed%tones.length];
    return at(x,y,`<ellipse cy="5" rx="11" ry="4" fill="#214d3e" opacity=".18"/><path d="M0 4v-22" stroke="#786343" stroke-width="3"/><path d="M0-9l-7-10m7 5l8-10" stroke="#786343" stroke-width="2"/><ellipse cy="-21" rx="13" ry="15" fill="${c}"/><ellipse cx="-7" cy="-18" rx="9" ry="10" fill="${c}"/><ellipse cx="7" cy="-21" rx="8" ry="12" fill="#2a6a4f" opacity=".65"/><ellipse cx="-4" cy="-27" rx="7" ry="6" fill="#9dbe76" opacity=".5"/>`,s);
  }
  function palm(x,y,s=1){return at(x,y,'<ellipse cy="4" rx="13" ry="4" fill="#154c46" opacity=".2"/><path d="M0 4Q6-12 2-34" stroke="#a17f4d" stroke-width="4" fill="none"/><path d="M2-34Q-17-49-26-35Q-8-39 2-34Q-4-57-16-54Q-1-45 2-34Q11-57 23-50Q11-43 2-34Q23-43 30-29Q12-33 2-34Q-12-34-18-19Q-7-24 2-34" fill="#367d57"/><path d="M2-34Q-8-43-21-37M2-34Q11-46 21-47" stroke="#8bb873" fill="none" stroke-width="2"/>',s);}
  function house(x,y,s=1,color='#f4dbad'){
    return at(x,y,`<path d="M-12 0v-25l16-7 16 8V0L4 8Z" fill="${color}"/><path d="M4-32v40l16-8v-24Z" fill="#cda674"/><path d="M-17-25L0-38l25 14L4-15Z" fill="#c37b54"/><path d="M0-38l25 14L4-15 0-20Z" fill="#97563e"/><path d="M-6-15v7m6-11v7m10-2v8m7-11v8" stroke="#397b83" stroke-width="3"/><path d="M-7 0v-6h7v10" fill="#957455"/><path d="M-12-3L4 5 20-3" stroke="#fce6bb" fill="none"/>`,s);
  }
  function shophouses(x,y,s=1){return at(x,y,shade+house(-18,-3,.8,'#e8d7b8')+house(2,5,.8,'#e5d58f')+house(22,13,.8,'#c9dfcf'),s);}
  function temple(x,y,s=1){
    let tiers='';
    for(let i=0;i<5;i++){
      const w=18-i*2.2,yy=-12-i*11;
      tiers+=`<path d="M${-w} ${yy}v-8l${w} -6 ${w} 6v8l${-w} 5Z" fill="${i%2?'#f0dfa6':'#f5e7b5'}"/><path d="M${-w-6} ${yy-8}q8-1 5-7l${w+1} -7 ${w+1} 7q-3 6 5 7l${-w-6} -3Z" fill="#c27d48"/><path d="M-3 ${yy-4}v-5h6v5" fill="#8f6846"/>`;
    }
    return at(x,y,shade+`<path d="M-28 1L-3-12 33 6 7 19Z" fill="#d3b987"/><path d="M-28 1v5L7 24 33 11V6L7 19Z" fill="#a48a62"/>${tiers}<path d="M0-72v-10" stroke="#b2934d" stroke-width="2"/><circle cy="-82" r="3" fill="#e6c46e"/>`,s);
  }
  function clanhouse(x,y,s=1){return at(x,y,shade+'<path d="M-34 1v-26L0-38 34-23V4L0 17Z" fill="#e8d4a0"/><path d="M0-38v55L34 4v-27Z" fill="#c7ad7d"/><path d="M-44-25q10-3 4-12L0-49 40-33q-5 9 5 12L0-31Z" fill="#ad6347"/><path d="M-34-25L0-36 34-22M-23-37L0-45 25-35" fill="none" stroke="#e2bc76" stroke-width="2"/><path d="M-26-9v14m12-19V9M9-12V8m13-17V3" stroke="#b86c44" stroke-width="4"/><path d="M-8 10v-18h13v23" fill="#526d62"/><path d="M-40 9L0 25 42 11" fill="none" stroke="#f6e7ba" stroke-width="4"/>',s);}
  function fort(x,y,s=1){return at(x,y,shade+'<path d="M-32-16L-9-28 3-22 23-28 37-11 28 0 31 13 7 25-7 17-28 19-40 3-29-7Z" fill="#bdac79" stroke="#8e865f" stroke-width="2"/><path d="M-29-8L-9-19 8-12 24-19 28-8 19 1 22 10 7 17-8 9-25 12-30 2-21-3Z" fill="#88a471"/><path d="M-33-16v8m14-15v8m34-1v9m15 1v10m-2 15v-8m-22 13v-8m-31 2v-8m-15-8v-8" stroke="#e0d2a0" stroke-width="4"/><path d="M-2-3V-39" stroke="#806f4b" stroke-width="2"/><path d="M-2-38h17l-4 5 4 5H-2Z" fill="#f1c36c"/>',s);}
  function jetty(x,y,s=1){return at(x,y,'<path d="M-8-5L7 3 38 19" fill="none" stroke="#9d8057" stroke-width="7"/><path d="M-7-7L9 1 39 17" fill="none" stroke="#e5d0a1" stroke-width="3"/><path d="M10 5v13m16-4v13m12-7v10" stroke="#765d45" stroke-width="2"/>'+house(-10,-9,.45)+house(7,1,.45,'#e6d098')+house(24,10,.45,'#c5d6c2'),s);}
  function hill(x,y,s=1){return at(x,y,shade+'<path d="M-68 12Q-61-12-41-20Q-35-47-13-56Q-1-85 18-74Q37-57 35-34Q57-21 62 10Z" fill="#3d8765"/><path d="M-41-20Q-32-44-13-56Q-2-79 18-74L10-25-10 4Z" fill="#72a477"/><path d="M18-74Q37-57 35-34Q57-21 62 10L10 5 10-25Z" fill="#2d6d58"/><path d="M-25 6Q-7-13 1-36" stroke="#d2c294" stroke-width="3" fill="none"/><path d="M-11-7l10-6 8 5-9 7Z" fill="#e3c582"/><path d="M-11-7v-10l10-5 8 5v9l-9 7Z" fill="#eac88b"/><path d="M-10-18l9-5 8 6-9 5Z" fill="#b36345"/><path d="M-8-13v5m5-7v5m6-4v5" stroke="#37757a" stroke-width="3"/>'+tree(-34,-19,.52,1)+tree(32,-10,.6,2),s);}
  function market(x,y,s=1){return at(x,y,shade+'<path d="M-26 1v-22L0-32 30-17V7L4 18Z" fill="#eddaaa"/><path d="M4-25v43L30 7v-24Z" fill="#c3a273"/><path d="M-31-23L-5-39 36-18 5-7Z" fill="#b9714a"/><path d="M-27-8L3 5 31-9v7L3 12-27-1Z" fill="#f0d5a6"/><path d="M-23-6v6m9-2v6m9-2v6m16-1v6m8-10v6m8-11v6" stroke="#aa5441" stroke-width="4"/>',s);}
  function beach(x,y,s=1){return at(x,y,'<ellipse cy="3" rx="32" ry="13" fill="#f3d799" opacity=".8"/>'+palm(-15,-1,.9)+'<path d="M8 9V-14" stroke="#9d7a4e" stroke-width="2"/><path d="M-7-13q15-22 30 0Z" fill="#fbecd1"/><path d="M8-24v11h15Z" fill="#d99b60"/><path d="M-2 9l10 3 12-5" stroke="#8a6b4c" stroke-width="3" fill="none"/>',s);}
  function ferry(x,y,s=1){return at(x,y,'<ellipse cy="8" rx="29" ry="7" fill="#0a4557" opacity=".25"/><path d="M-30 4Q-2 15 29 2L18 15-10 20-27 10Z" fill="#f2e7c6"/><path d="M-30 4Q-2 15 29 2l-5 6Q1 20-25 11Z" fill="#c79348"/><path d="M-21 0l13-8L21 2 5 11Z" fill="#539299"/><path d="M-19-1v-10l12-6 25 10V3L5 9Z" fill="#f7e8c8"/><path d="M-22-12l15-8L22-8 7 0Z" fill="#c37b4e"/><path d="M-15-8v7m7-10v7m8-6v7m9-3v7" stroke="#3b7d86" stroke-width="3"/>',s);}
  function landmark(id,x,y,scale=1){
    const symbols={fort,kho:clanhouse,jetty,hill,kek:temple,beach,food:market,mainland:shophouses};
    return `<g class="landmark-art" data-art="${id}" data-art-x="${n(x)}" data-art-y="${n(y)}" transform="translate(${n(x)} ${n(y)})" aria-hidden="true">${symbols[id](0,0,scale)}</g>`;
  }
  const api={tree,palm,house,shophouses,ferry,landmark};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PenangArt=api;
})(globalThis);
