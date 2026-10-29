import base64, json, os
from PIL import Image, ImageDraw
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
D = str(ROOT/'src') + '/'
F = D + 'fonts/'
OUT = str(ROOT) + '/'
os.makedirs(OUT, exist_ok=True)
fonts = [("Literata",600,"literata-latin-600-normal.woff2"),
("Literata",700,"literata-latin-700-normal.woff2"),
("Source Sans 3",400,"source-sans-3-latin-400-normal.woff2"),
("Source Sans 3",600,"source-sans-3-latin-600-normal.woff2"),
("Source Sans 3",700,"source-sans-3-latin-700-normal.woff2")]
ff = "".join(f"@font-face{{font-family:'{n}';font-style:normal;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode(open(F+p,'rb').read()).decode()}) format('woff2');}}\n" for n,w,p in fonts)
css = open(D+'style.css', encoding='utf-8').read()
body = open(D+'body.html', encoding='utf-8').read()
js = open(D+'data.js', encoding='utf-8').read() + "\n" + open(D+'topics.js', encoding='utf-8').read() + "\n" + open(D+'app.js', encoding='utf-8').read()
desc = "Glaubenswissen: Lektionen über Jesus, die Bibel und das Evangelium, 137 Bibelgeschichten zum Lesen und Forschen und ein Baukasten für Predigt-Einleitungen."
sw_reg = "\nif ('serviceWorker' in navigator && location.protocol === 'https:') { let reloaded = false; navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded) return; reloaded = true; location.reload(); }); window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', {updateViaCache:'none'}).then(r => r.update()).catch(() => {})); }\n"

site = f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Glaubenswissen</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#10151F">\n<meta http-equiv="Cache-Control" content="no-cache">
<meta property="og:type" content="website">
<meta property="og:title" content="Glaubenswissen">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="icon-512.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Glaubenswissen">
<style>
{ff}{css}</style>
</head>
<body>
{body}<script>
{js}{sw_reg}</script>
</body>
</html>
'''
open(OUT+'index.html','w',encoding='utf-8').write(site)

art = f'''<title>Glaubenswissen</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
{ff}{css}</style>
{body}<script>
{js}</script>
'''
open(D+'vorschau-artefakt.html','w',encoding='utf-8').write(art)
open(D+'check.js','w',encoding='utf-8').write(js)

manifest = {"name":"Glaubenswissen","short_name":"Glaubenswissen","description":desc,"lang":"de","start_url":"./","scope":"./","display":"standalone",
 "background_color":"#10151F","theme_color":"#10151F",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}
json.dump(manifest, open(OUT+'manifest.webmanifest','w',encoding='utf-8'), ensure_ascii=False, indent=1)

sw = '''const CACHE = "glaubenswissen-v5";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache:"reload"})))).catch(() => {})); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, {cache:"no-cache"}).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});
'''
open(OUT+'sw.js','w',encoding='utf-8').write(sw)

def icon(size, pad=0.0):
    s = 4
    S = size*s
    im = Image.new("RGBA",(S,S),(16,21,31,255))
    d = ImageDraw.Draw(im)
    m = int(S*pad)
    r = int((S-2*m)*0.22)
    d.rounded_rectangle([m,m,S-m,S-m], radius=r, fill=(226,183,85,255))
    # offenes Buch
    w = S-2*m
    def P(x,y): return (m+x*w, m+y*w)
    lw = max(2,int(w*0.055))
    left = [P(.20,.33),P(.33,.29),P(.45,.31),P(.5,.36),P(.5,.75),P(.45,.70),P(.33,.68),P(.20,.72)]
    right = [P(.80,.33),P(.67,.29),P(.55,.31),P(.5,.36),P(.5,.75),P(.55,.70),P(.67,.68),P(.80,.72)]
    for poly in (left,right):
        d.line(poly+[poly[0]], fill=(26,20,6,255), width=lw, joint="curve")
    return im.resize((size,size), Image.LANCZOS)
icon(192).save(OUT+'icon-192.png'); icon(512).save(OUT+'icon-512.png'); icon(180, 0).save(OUT+'apple-touch-icon.png')
print("ok", len(site), len(art))
