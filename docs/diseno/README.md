# Diseño de PawConnect

| Archivo | Qué es |
|---|---|
| `01-captura-figma-y-requisitos.md` | Captura del prototipo de Figma Make y cruce con el documento de requisitos |
| `lenguaje-de-diseno.html` | **La que se abre y se comparte.** Generada, con las fotos embebidas |
| `lenguaje-de-diseno.src.html` | La que se edita |
| `assets/img/` | Fotos de muestra (Wikimedia Commons), en 400 px para las pantallas |
| `scripts/build.mjs` | Genera cada `.html` a partir de su `.src.html` |
| `figma-make/` | Capturas del prototipo anterior |
| `canvas/project/` | Fuente del canvas de pantallas por rol ([abrirlo](https://claude.ai/artifact/RcCaJKD7shuT9pbPqvFKYd)) |

## Regla: ninguna página sale con fotos rotas

1. Se edita solo el `.src.html`. Las fotos van en `assets/img/` y se enlazan con ruta relativa (`assets/img/…`), nunca desde internet.
2. Después de cada cambio:

   ```bash
   node scripts/build.mjs
   ```

   El script embebe cada foto en el `.html` final. Si falta una foto, si alguna apunta a internet o si queda una ruta sin embeber, **falla y no escribe nada**. Así la página se ve igual en el panel de archivos, un correo, un adjunto o un artifact.
3. Si aun así una foto no carga (por ejemplo, al abrir el `.src.html` suelto), la página muestra el recuadro neutro del recorte, nunca el icono roto ni el texto alternativo encima.

En la app (`web/`) la regla sigue igual: fotos locales en `public/img/`, nada desde internet. Los componentes del sistema de diseño están en `web/src/components/` y se ven en la ruta `/sistema`.
