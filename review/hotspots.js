/* Presentation anchors only; not approved destinations, entrances or navigation data.
   OSM-derived centres checked 20 October 2026. Existing places reuse protected coordinates. */
(function(root){
  'use strict';
  const areas=[
    {id:'georgetown',name:'George Town · Komtar',short:'Komtar',coordinates:[100.32981,5.41456],scale:9,art:true,crop:[0,0,512,533],size:[80,110],source:'https://www.openstreetmap.org/way/993213417',note:'Modern city landmark beside the heritage quarter. Explore the numbered places for their stories.'},
    {id:'gurney',name:'Gurney · Tanjung Tokong',short:'Gurney',coordinates:[100.30947,5.43729],scale:5,art:true,crop:[518,0,506,533],size:[110,120],source:'https://www.openstreetmap.org/way/261334959',note:'Waterfront skyline, hotels and shopping. The miniature represents the wider urban district; its towers are illustrative.'},
    {id:'batu-kawan',name:'Batu Kawan',short:'Batu Kawan',coordinates:[100.44067,5.23374],scale:4,art:true,crop:[1024,0,512,533],size:[125,110],source:'https://www.openstreetmap.org/way/689407664',note:'IKEA and outlet shopping anchor a modern mainland district. This retail montage is a regional symbol, not a site plan.'},
    {id:'ferringhi',name:'Batu Ferringhi',coordinates:[100.2485887,5.4708863],scale:4,place:'beach',source:'https://www.openstreetmap.org/relation/11203462',note:'Northern coast, beachfront resorts and a slower afternoon. Select place 6 for visitor information.'},
    {id:'penang-hill',name:'Penang Hill',coordinates:[100.2656972,5.4228655],scale:4.5,place:'hill',source:'https://www.openstreetmap.org/node/1387210299',note:'A focused hilltop miniature. The anchor is the hill reference point, not the lower funicular station.'},
    {id:'air-itam',name:'Air Itam · Kek Lok Si',coordinates:[100.2737956,5.3988748],scale:4.5,place:'kek',source:'https://www.openstreetmap.org/way/768570111',note:'Temple architecture in Air Itam. Select place 5 for official visitor information.'},
    {id:'teluk-bahang',name:'Teluk Bahang',short:'Teluk Bahang',coordinates:[100.214838,5.450207],scale:4,art:true,crop:[0,538,524,486],size:[96,100],source:'https://www.entopia.com/faq/',note:'Entopia and ESCAPE represent the area’s nature and adventure experiences. This combined symbol is not a shared site or entrance.'},
    {id:'queensbay',name:'Queensbay · Bayan Baru',short:'Queensbay',coordinates:[100.30678,5.33327],scale:4,art:true,crop:[524,538,500,486],size:[105,108],source:'https://www.openstreetmap.org/way/205876332',note:'Modern malls, homes and business districts in southeast Penang. The skyline is illustrative, anchored around Queensbay.'},
    {id:'butterworth',name:'Butterworth waterfront',short:'Butterworth',coordinates:[100.36536,5.39484],scale:4,art:true,crop:[1024,538,512,486],size:[100,90],source:'https://www.openstreetmap.org/way/384800420',note:'Penang Sentral and the waterfront connect island and mainland. Ferry routes remain the approved source alignments.'},
    {id:'bukit-mertajam',name:'Bukit Mertajam',coordinates:[100.4609867,5.3642519],scale:4,place:'mainland',source:'https://www.openstreetmap.org/relation/7013106',note:'Mainland old town and local discoveries. The miniature is anchored to the approved town reference point.'}
  ];
  const api={areas:Object.freeze(areas.map(a=>Object.freeze({...a,coordinates:Object.freeze(a.coordinates)})))};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PenangHotspots=api;
})(globalThis);
