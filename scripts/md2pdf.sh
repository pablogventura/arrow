#!/usr/bin/env bash
# Generate PDF and HTML copies of the article for docs/ and web/.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/docs/articulo.md"
CSS="$ROOT/docs/articulo.css"

mkdir -p "$ROOT/docs" "$ROOT/web"

pandoc "$SRC" \
  --from markdown \
  --to html5 \
  --standalone \
  --metadata title="Agregar preferencias: el teorema de Arrow" \
  --css articulo.css \
  -o "$ROOT/web/articulo.html"

# pdflatex handles this project's Spanish + ASCII math markers reliably here
pandoc "$SRC" \
  --from markdown \
  --pdf-engine=pdflatex \
  -V geometry:margin=2.5cm \
  -V documentclass=article \
  -o "$ROOT/docs/articulo.pdf"

cp "$ROOT/docs/articulo.pdf" "$ROOT/web/articulo.pdf"
cp "$CSS" "$ROOT/web/articulo.css"

echo "Wrote web/articulo.html, docs/articulo.pdf, web/articulo.pdf"
