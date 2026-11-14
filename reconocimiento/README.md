# Reconocimiento de mascotas — prototipo

¿La foto de este perro que alguien encontró en la calle es la de la mascota que
otra persona reportó como perdida? Este prototipo responde eso **sin entrenar
ningún modelo**.

## Cómo funciona

1. **Recorte.** OWL-ViT (`google/owlvit-base-patch32`) busca «a photo of a dog»
   o «a photo of a cat» y recorta al animal, para que el fondo no cuente. Si no
   ve ninguno, usa la foto entera.
2. **Vector.** DINOv2 (`facebook/dinov2-base`) convierte el recorte en 768
   números. Dos fotos del mismo animal dan vectores parecidos aunque cambien la
   luz, el fondo o la pose. Se promedia con la versión en espejo.
3. **Búsqueda.** Para la foto encontrada se calcula la similitud coseno con todas
   las fotos de registro, se descartan las de otra especie y cada mascota se
   puntúa con **su foto más parecida**. Se devuelven las 5 primeras.

Los dos modelos son Apache-2.0, así que se pueden usar comercialmente. La primera
ejecución descarga unos 0,9 GB de pesos. Después, cada foto tarda centésimas de
segundo en un Mac con Apple Silicon (MPS).

**El sistema propone candidatos y un humano confirma.** Nunca debe declarar una
coincidencia por su cuenta.

## Instalar

```bash
cd reconocimiento
uv sync
```

## El servicio

La API de PawConnect no carga los modelos: le pasa cada foto a este servicio (RF-03, RNF-10).

```bash
uv run uvicorn servicio:app --port 8001
```

- `POST /procesar` con la foto en el campo `foto` (multipart). Devuelve la especie detectada, la confianza del detector, el vector de 768 números y el recorte en JPEG (base64).
- Si no ve un perro o un gato, responde **422** con `codigo: "sin_animal"` y un mensaje para la persona. Una foto que no se puede abrir da **415**; una de más de 10 MB, **413**.
- `GET /salud` dice qué modelos usa y si ya están cargados.
- Documentación interactiva en `http://localhost:8001/docs`.

El servicio no guarda nada. La foto original se queda en memoria y se descarta (RN-04); la API guarda el recorte y el vector.

## Las fotos

```
fotos/
├── canela/
│   ├── registro/      3–5 fotos que el dueño tomaría al reportarla
│   └── encontrada/    3–5 fotos «de calle»
├── max/
│   ├── registro/
│   └── encontrada/
└── …
```

El nombre de la carpeta es el identificador de la mascota. Sirven JPG, PNG, WEBP
y HEIC (iPhone).

### Protocolo para el equipo

Cada integrante fotografía **su propia mascota** (o la de un familiar). Hacen
falta al menos 5 mascotas para que el número signifique algo; con 10 ya se ve
bien.

**Registro** (como si el dueño la reportara): de lado derecho, de lado izquierdo,
la cara de frente y el cuerpo entero. Con buena luz.

**Encontrada** (como la tomaría un desconocido): desde lejos (3–5 m), con poca
luz o de noche, desde arriba o en ángulo, con el animal moviéndose, y de un lado
distinto al de las fotos de registro. No uses fotos tomadas en la misma sesión que
las de registro, porque el fondo y la luz idénticos inflan el resultado.

Si hay dos mascotas de la misma raza y color en el equipo, inclúyanlas. Ese es el
caso difícil y el que hay que medir.

## Evaluar

```bash
uv run pawmatch evaluar fotos/
```

Imprime y deja en `fotos/informe.html`:

- **recall@1**: cuántas fotos encontradas tienen la mascota correcta en el puesto 1.
- **recall@5**: cuántas la tienen entre las 5 primeras. Es la cifra que importa,
  porque el dueño revisa 5 candidatos.
- **MRR**: promedio de 1/puesto. 1,0 significa todas en el puesto 1.
- **azar @5**: lo que daría escoger 5 mascotas al azar. Hay que estar muy por
  encima de ese número.

El informe muestra cada foto encontrada junto a sus 5 candidatos, con el correcto
en verde. Sirve para ver **por qué** falla: mala detección, otro lado del
animal, dos animales parecidos.

Para una foto suelta:

```bash
uv run pawmatch buscar fotos/ ruta/a/foto.jpg
```

Los vectores se guardan en `fotos/.cache-pawmatch/`, así que volver a evaluar
después de añadir fotos solo procesa las nuevas.

## Prueba con fotos públicas

`prueba-commons/` tiene fotos de Wikimedia Commons de cinco animales conocidos:
los gatos Larry, Palmerston y Gladstone, del gobierno británico, y los perros Bo y
Sunny, de los Obama. Bo y Sunny son dos perros de agua portugueses negros, así
que distinguirlos es el caso difícil. Autores y licencias están en
`prueba-commons/FUENTES.md`. Son fotos de prensa, no fotos «de calle», así que
este resultado es una **cota optimista**: el número real sale de las fotos del
equipo.

```bash
uv run pawmatch evaluar prueba-commons/
```

### Resultado (11 de noviembre de 2026)

49 fotos, 4 de registro por animal y 29 de consulta. **Recall@1: 24 de 29 (83 %)**,
contra 20 % al azar. Recall@5 da 100 %, pero con 5 mascotas eso no prueba nada.

Las 5 fallas:

| Foto | Qué pasó | ¿Falla del modelo? |
|---|---|---|
| palmerston-04, -05 | El gato va dentro de un guacal y no se ve | No: la foto no sirve |
| palmerston-07 | El único «gato» visible es el pintado en una camioneta | No: la foto no sirve |
| larry-07 | Larry ocupa unos pocos píxeles en la puerta | Sí: foto tomada de lejos |
| sunny-09 | La confundió con Bo, por 0,651 contra 0,635 | Sí: misma raza, mismo color |

Sin las 3 fotos en las que no se ve el animal: **24 de 26 (92 %)**. Bo contra
Sunny, el caso difícil, sale 11 de 12.

Dos lecciones para la app:

- **Rechazar la foto si no se detecta un animal** («sin animal detectado» en el
  informe) y pedirle a quien la encontró que la tome de más cerca o que la
  recorte en la pantalla.
- **La especie la declaran las personas, no el detector.** OWL-ViT etiquetó 2 de
  48 fotos con la especie equivocada. Por eso `--filtro-especie` viene apagado.

### DINOv2 contra DINOv3 (mismo día, mismas fotos)

```bash
uv run pawmatch --modelo dinov3-base evaluar prueba-commons/
```

| | DINOv2-base | DINOv3-base |
|---|---|---|
| Recall@1, todas (29) | 24 (83 %) | 24 (83 %) |
| Recall@1, fotos en las que se ve el animal (25) | **24** | 22 |
| Bo contra Sunny (12) | **11** | 9 |

Los dos empatan en el total, pero DINOv3 suma sus aciertos extra en dos fotos que
no sirven (el guacal y la camioneta), así que ahí acertó por suerte. En las fotos
válidas falla dos fotos más de Sunny, justo el caso difícil. Con 25 fotos válidas,
una diferencia de dos no prueba que DINOv3 sea peor. Lo que sí muestra es que
aquí no gana, así que **el modelo por defecto sigue siendo DINOv2**, que además
es Apache-2.0 y no exige registro. Hay que repetir la comparación con las fotos
del equipo.

### Fotos del equipo (11 de noviembre de 2026)

Diez mascotas en `fotos-equipo/`: seis perros y cuatro gatos, 64 fotos en total
(28 de registro y 30 «encontradas», más 7 apartadas). Las 7 fotos con dos
animales juntos están en `varias-mascotas/` y no entran en la prueba, porque no
hay una respuesta correcta única. Ninguna de estas carpetas va a git: son fotos
personales.

**Los dos modelos aciertan las 30 en el puesto 1.** El número no basta: hay que
mirar por cuánto gana la mascota correcta a la siguiente en su foto más difícil.

| Mascota | Margen mínimo, DINOv2 | Margen mínimo, DINOv3 |
|---|---|---|
| mig-gato-ojos-azules | 0,034 | **0,007** |
| mig-gato-atigrado | 0,093 | **0,015** |
| sof-gata | 0,154 | **0,007** |
| perros (el peor de los seis) | 0,214 | 0,202 |

- **Los gatos son el caso difícil.** Los dos atigrados de Miguel se confunden más
  entre sí que con cualquier otro animal. Con DINOv3, tres gatos ganan por menos
  de 0,02, casi una moneda al aire. DINOv2 los separa entre 5 y 20 veces mejor.
- **Los perros son fáciles** con los dos modelos.
- Se confirma lo de Commons: **DINOv2 sigue como modelo por defecto.**

Una advertencia: las fotos de Sebastián, Sofía y Ricardo llegaron por WhatsApp,
sin fecha, y parecen de una sola sesión por mascota. El mismo piso y la misma luz
en registro y en encontrada inflan sus márgenes (similitudes de 0,85). Las de
Miguel abarcan dos años y son las más realistas. Por eso también es ahí donde los
márgenes se encogen.

Una prueba pendiente: aquí se usa solo el vector CLS. Con DINOv3 puede rendir
más combinarlo con el promedio de los vectores de parche.

## Si el número no alcanza

En orden de costo:

1. **Más fotos de registro por mascota.** Es lo más barato y suele ser lo que más
   ayuda.
2. **Filtros estructurados**: tamaño, color, sexo, collar, zona y fecha de la
   pérdida. En la app estos filtros reducen los candidatos antes de comparar
   imágenes, y hacen tanto trabajo como el modelo.
3. **Otro modelo de vectores**: `--modelo dinov3-base` o `dinov3-small`
   (DINOv3 exige acceso aprobado en Hugging Face y tiene licencia propia), o
   añadir uno más grande al diccionario `EMBEDDERS` de `pawmatch.py`. La caché
   guarda los vectores por modelo, así que no se mezclan.
4. **Ajuste fino** con aprendizaje métrico (pérdida triplet o ArcFace) sobre un
   conjunto de identidades como PetFace. Antes, revisar su licencia: estos
   conjuntos suelen ser solo para investigación, lo que no cubre el producto
   comercial.

## Llevarlo a la app

En producción, el paso 3 pasa a una base de datos vectorial (pgvector en
Postgres, por ejemplo). Cada reporte de pérdida guarda los vectores de sus fotos.
Cada reporte de hallazgo consulta los vecinos más cercanos, filtrando por
especie, radio y fechas, y notifica a los dueños de los candidatos.
