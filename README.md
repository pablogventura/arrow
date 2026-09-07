# Arrow

Estudio y divulgación del **teorema de imposibilidad de Arrow**: artículo en español (exportable a PDF), formalización pedagógica en Lean 4, y simulaciones web de métodos de elección.

## Capas

| Ruta | Contenido |
|------|-----------|
| [docs/articulo.md](docs/articulo.md) | Artículo de divulgación (fuente) |
| [lean/](lean/) | Preferencias, axiomas, ejemplo de violación de IIA, ciclo canónico; enunciado general residual |
| [web/](web/) | Sitio estático con escenario manual y Monte Carlo (GitHub Pages) |

## Artículo y PDF

```bash
bash scripts/md2pdf.sh
```

Genera `docs/articulo.pdf`, `web/articulo.pdf` y `web/articulo.html`.

## Lean

```bash
cd lean
lake build
```

Sin Mathlib. `Arrow.General.no_arrow_conditions` es un axioma documentado (estrategia Yu 2012); el resto del library se verifica.

## Simulaciones locales

```bash
cd web
python3 -m http.server 8080
```

Abrí `http://localhost:8080`. Métodos: pluralidad, Borda, minimax, IRV, approval, score.

## GitHub Pages

El workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publica el directorio `web/`. En el repo: Settings -> Pages -> Source: GitHub Actions.

## Licencia

Código y texto del proyecto: uso libre con atribución al repo. Las referencias bibliográficas conservan sus derechos.
