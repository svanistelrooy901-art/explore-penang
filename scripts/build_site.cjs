// Build the visitor-facing site from the same protected map and interaction code.
const fs=require('node:fs'),path=require('node:path');
const {buildPage}=require('./page-builder.cjs');
fs.writeFileSync(path.resolve(__dirname,'../index.html'),buildPage('site/template.html',true));
console.log('Built visitor-facing index.html; no publication performed.');
