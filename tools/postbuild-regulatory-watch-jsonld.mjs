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
const unique = (values) => [...new Set(values.filter(Boolean))]
const analytes = unique(feed.events.flatMap((event) => event.analytes || []))
const jurisdictions = unique(feed.events.flatMap((event) => event.jurisdictions || []))
const citations = unique(feed.events.flatMap((event) => (event.official_sources || []).map((source) => source.url)))
const graph = {
  "@context":"https://schema.org",
  "@graph":[
    {"@type":"CollectionPage","@id":`${url}#collection`,url,name:"Regulatory Watch: Q2 2026 Compliance Brief",description:"Verified Q2 2026 heavy-metal regulatory actions, effective dates and direct comparisons with published HMTc standards for food, supplements and testing.",dateModified:feed.generated,isPartOf:{"@id":`${base}/articles#collection`},publisher:{"@id":`${base}/#organization`},mainEntity:{"@id":`${url}#items`},about:[...analytes,...jurisdictions].map((name)=>({"@type":"Thing",name})),isBasedOn:{"@type":"Dataset",name:"Heavy Metal Index regulatory evidence",url:"https://heavymetalindex.com/regulations"},citation:citations.map((item)=>({"@type":"CreativeWork",url:item}))},
    {"@type":"ItemList","@id":`${url}#items`,numberOfItems:feed.events.length,itemListElement:feed.events.map((event,index)=>({"@type":"ListItem",position:index+1,url:`${url}#${event.event_id}`,name:event.title}))},
    {"@type":"BreadcrumbList","@id":`${url}#breadcrumbs`,itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:base},{"@type":"ListItem",position:2,name:"Research",item:`${base}/articles`},{"@type":"ListItem",position:3,name:"Regulatory Watch",item:url}]}
  ]
}
let html = fs.readFileSync(htmlPath,"utf8")
if (!html.includes(`${url}#collection`)) html = html.replace("</head>",`<script type="application/ld+json">${JSON.stringify(graph)}</script></head>`)
fs.writeFileSync(htmlPath,html)
console.log(`postbuild-regulatory-watch-jsonld: injected CollectionPage + ItemList for ${feed.events.length} events`)
