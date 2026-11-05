# La Virginia — rediseño conceptual

Concepto de rediseño **no oficial** para la marca de té y café de Cafés La Virginia S.A. (Rosario, desde 1915), hecho como pieza de portfolio.

- **Sitio:** https://federico-schwindt.github.io/La-Virginia-Redesign/
- **Propuesta:** https://federico-schwindt.github.io/La-Virginia-Redesign/pitch/

> Este proyecto no está afiliado, avalado ni patrocinado por Cafés La Virginia S.A. “La Virginia”, su logotipo, nombres de productos, imágenes de packaging y textos pertenecen a sus titulares y se muestran solo con fines ilustrativos. El sitio no vende nada ni guarda datos: el pedido mayorista es una demostración. Tiene `noindex` para no competir con el sitio oficial.

## Qué incluye

- **Catálogo real:** 62 productos de té y café sincronizados desde la tienda WooCommerce pública de lavirginia.com.ar, con ficha sensorial (color, sabor, aroma, intensidad), presentaciones e imágenes optimizadas.
- **Pedido mayorista (B2B):** el sitio no tiene precios, así que el carrito se convierte en una solicitud con razón social, CUIT, rubro y provincia.
- **Páginas:** inicio, té, café, 62 fichas de producto, pedido, historia, para empresas, sustentabilidad, guía "Conocé tu café", 404 y `/pitch`.
- **Films:** cinco loops cortos generados con IA sobre el azul de la marca, cargados solo cuando aparecen en pantalla.

## Stack

- [Astro](https://astro.build) 7, salida estática, CSS propio sin framework.
- [Motion](https://motion.dev) para contadores, parallax y animaciones con scroll; View Transitions nativas entre páginas.
- Fraunces Variable + Hanken Grotesk Variable, autoalojadas con Fontsource.
- `sharp` para optimizar imágenes del catálogo y `qrcode` para el QR del pitch, ambos solo en desarrollo.
- GitHub Actions + GitHub Pages.

## Desarrollo

```bash
npm install
npm run dev
```

Volver a sincronizar el catálogo (detrás de un proxy, agregar `NODE_USE_ENV_PROXY=1`):

```bash
npm run sync
```

El deploy corre solo en cada push a `main` (`.github/workflows/deploy.yml`).

## Autor

Diseño y desarrollo: **Federico Schwindt** · [portfolio](https://federico-schwindt.github.io/portfolio-FEDERICOSCH/) · leonel.sch2003@gmail.com
