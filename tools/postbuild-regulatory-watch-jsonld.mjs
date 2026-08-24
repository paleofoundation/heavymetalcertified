#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const repo = process.cwd()
const htmlPath = path.join(repo, "public/articles/regulatory-watch.html")
const feedPath = path.join(repo, "content/static/data/regulatory-watch.json")
if (!fs.existsSync(htmlPath) || !fs.existsSync(feedPath)) { console.log("postbuild-regulatory-watch-jsonld: hub or feed missing; skipping"); process.exit(0) }
const feed = JSON.parse(fs.readFileSync(feedPath, "utf8"))
const base = "https://heavymetalcertified.com"
const url = `${base}/articles/regulatory-watch`
const graph = {
  "@context":"https://schema.org",
  "@graph":[
    {"@type":"CollectionPage","@id":`${url}#collection`,url,name:"Regulatory Watch",description:"Verified heavy-metal regulatory developments, deadlines, evidence gaps, and HMTc consequences.",dateModified:feed.generated,isPartOf:{"@id":`${base}/articles#collection`},publisher:{"@id":`${base}/#organization`},mainEntity:{"@id":`${url}#items`}},
    {"@type":"ItemList","@id":`${url}#items`,numberOfItems:feed.events.length,itemListElement:feed.events.map((event,index)=>({"@type":"ListItem",position:index+1,url:`${url}#${event.event_id}`,name:event.title}))},
    {"@type":"BreadcrumbList","@id":`${url}#breadcrumbs`,itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:base},{"@type":"ListItem",position:2,name:"Research",item:`${base}/articles`},{"@type":"ListItem",position:3,name:"Regulatory Watch",item:url}]}
  ]
}
let html = fs.readFileSync(htmlPath,"utf8")
if (!html.includes(`${url}#collection`)) html = html.replace("</head>",`<script type="application/ld+json">${JSON.stringify(graph)}</script></head>`)
fs.writeFileSync(htmlPath,html)
console.log(`postbuild-regulatory-watch-jsonld: injected CollectionPage + ItemList for ${feed.events.length} events`)
