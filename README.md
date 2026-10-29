# Glaubenswissen

Lektionen über Jesus, die Bibel und das Evangelium, 137 Bibelgeschichten mit Links zu Hoffnung für alle, eine Themensuche und ein Baukasten für Predigt-Einleitungen.

## Aufbau
- `index.html`, `manifest.webmanifest`, `sw.js`, Icons: die fertige Website (wird von GitHub Pages ausgeliefert)
- `src/`: Quelldateien
  - `data.js`: Lektionen und Bibelgeschichten
  - `topics.js`: Themen für die Suche
  - `app.js`, `style.css`, `body.html`: Aufbau und Design
  - `fonts/`: eingebettete Schriften (Literata, Source Sans 3, SIL Open Font License)

## Ändern
Quelldateien in `src/` bearbeiten, dann `python3 src/build.py` ausführen. Das erzeugt `index.html` und die übrigen Dateien neu. Danach committen und pushen.
