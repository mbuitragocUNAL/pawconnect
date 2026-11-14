# PawConnect: captura del prototipo Figma y revisión de requisitos

Fuentes:

- **Requisitos:** *PawConnect – Documento técnico de requisitos* (PDF, 16 págs.).
- **Prototipo:** Figma Make «Mockup Flujos Documento Técnico». Es una sola app React (`src/App.tsx`, 1.428 líneas) sin rutas: todo cambia por estado. Leí el código fuente completo desde el source map de la vista previa y recorrí los flujos en el navegador a 375 px.
- Capturas en [`figma-make/`](figma-make/).

---

## 1. Lo que hay en el prototipo

### 1.1 Mapa de pantallas

```
Inicio (landing pública)
├── [modal] Crear reporte ── Tipo → Foto → Datos → Analizando → Resultados → …
├── [modal] Buscar por foto ─────── Foto → Analizando → Resultados → Candidato → Contacto → Enviado
├── Ingresar ── Celular → Código SMS ──→ Panel de usuario
│                                         ├── Resumen
│                                         ├── Mis casos
│                                         ├── Alertas de zona
│                                         └── Mi perfil
└── (anclas #reportes #como-funciona #comunidad #servicios: solo bajan por la misma página)
```

Tres páginas (`home`, `login`, `dashboard`) y nueve estados del modal (`type`, `upload`, `details`, `searching`, `results`, `candidate`, `contact`, `success`, `idle`).

### 1.2 Pasos, pantalla por pantalla

**Inicio** — `00-inicio-escritorio.jpg`, `01-inicio-movil.jpg`

1. Barra: logo, Reportes · Cómo funciona · Comunidad · Servicios (anclas), campana (sin acción), **Ingresar**.
2. Hero: «Que la foto lo encuentre, *no la suerte.*» Botones **Crear un reporte** y **Buscar por foto**. Fila de confianza «15 reencuentros logrados esta semana». Foto de perro con dos tarjetas flotantes: «¡Posible coincidencia!» y «Tu ubicación está protegida · Solo mostramos un área de 500 m».
3. Accesos rápidos: *Perdí a mi mascota* (abre reporte en el paso Tipo), *Encontré una mascota* (salta directo al paso Foto como «encontrada»), *Buscar por foto*.
4. «Así funciona»: 01 Sube una foto · 02 Comparamos reportes · 03 Tú confirmas · 04 Los conectamos.
5. «La comunidad está buscando»: 2 tarjetas de reportes recientes. «Ver todos los reportes» abre la búsqueda por foto, no un listado.
6. «Más formas de cuidar»: tres tarjetas sin acción (Información y trámites, Adopción y comunidad, Servicios cercanos).
7. Pie: «Pequeñas acciones, grandes reencuentros. · Prototipo TRL 4 · Bogotá y la Sabana».

**Flujo A — Crear reporte** (modal; en móvil es hoja inferior)

| Paso | Pantalla | Contenido |
|---|---|---|
| 1 de 3 | ¿Qué ocurrió? | Perdí a mi mascota / Encontré una mascota. Nota de privacidad. |
| 2 de 3 | Sube una foto clara | Zona de arrastre, «JPG o PNG · máx. 10 MB», «Usar una foto de ejemplo». **Procesar foto** → «¡Foto lista!» con insignia *Animal detectado* y «Solo guardaremos el recorte del animal». |
| 3 de 3 | Cuéntanos un poco más | Nombre, Especie (Perro/Gato), Fecha, Zona aproximada, Rasgos. Casilla «Autorizo el uso de la ubicación… área aproximada de 500 m». **Publicar y buscar coincidencias**. |
| — | Analizando | Sigue con el mismo camino del flujo B desde «Analizando». |

**Flujo B — Buscar por foto** — `02` a `05`

| Paso | Pantalla | Contenido |
|---|---|---|
| 1 de 2 | Sube una foto clara | Igual que el paso de foto del flujo A. Botón final: **Buscar coincidencias**. |
| — | Analizando rasgos | Animación; «misma especie en un radio de 15 km y los últimos 60 días»; tres pasos (Animal detectado ✓, Comparando rasgos, Ordenando candidatos); «menos de 5 segundos». Pasa solo a resultados a los 1,8 s. |
| — | ¿Reconoces a tu mascota? | Rótulo «5 posibles coincidencias», miniatura «Tu foto», aviso «**Tú decides, no el sistema.** … sin porcentajes de certeza». Lista numerada 01, 02, 03 con foto, lugar, fecha y rasgos. |
| — | Posible coincidencia 01 | Foto grande con etiqueta *Encontrado*, nombre, «Chía · área aproximada», fecha, rasgos, «Ubicación protegida». Barra de decisión: **No es** (vuelve a la lista) / **Sí, puede ser**. |
| — | Contacto protegido | «Primero, ambas partes aceptan». Esquema Tú (aprobado) ↔ Quien encontró (esperando). Mensaje opcional. **Enviar solicitud de contacto**. |
| — | Solicitud enviada | «¡Estás un paso más cerca!» Tarjeta *Estado del caso: En seguimiento*. Volver al inicio. |

**Ingreso** — `06-ingreso.jpg`

1. Celular: prefijo +57, número → **Enviar código por SMS**.
2. Código: 6 casillas, temporizador 01:42, Reenviar código, Cambiar número → **Verificar e ingresar**.
3. «¿Primera vez? **Crear una cuenta**» solo regresa al paso 1. Texto legal: «Al continuar aceptas los Términos de uso y la Política de tratamiento de datos».
4. En escritorio, columna izquierda con historia de marca («Cada alerta suma. *Cada persona cuenta.*») y promesa «Tu teléfono y ubicación nunca se muestran sin autorización».

**Panel de usuario** — `07-panel-usuario.jpg`. Barra lateral en escritorio, barra de pestañas inferior en móvil.

- **Resumen:** 4 indicadores (Casos activos 2 · Coincidencias 5 por revisar · Alertas cerca 3 · Reencuentros 1). «Tus casos activos»: Toby *En seguimiento* con 5 coincidencias y **Revisar ahora**; Mascota encontrada *Activo*. «Actividad reciente»: nueva coincidencia, solicitud aceptada («Ya puedes contactar a Juan R.»), alerta en tu zona. Consejo «Mantén tus reportes actualizados».
- **Mis casos:** filtros Todos / Activos / Resueltos, 3 casos con «Ver caso» (sin destino).
- **Alertas de zona:** interruptor activo, «Alertas activas en Suba… radio de 5 km», mapa decorativo con anillos y huellas.
- **Mi perfil:** nombre, celular verificado (bloqueado), zona principal, alertas, Guardar cambios.
- «Explorar» (Buscar reportes, Guías y trámites, Servicios cercanos) y la búsqueda superior llevan al inicio o no hacen nada.

### 1.3 Lenguaje visual actual (la marca del pitch 2)

| Elemento | Valor |
|---|---|
| Títulos | **Baloo 2** (redondeada, 600–800) |
| Texto | **Nunito Sans** |
| Tinta | `#2d1659` morado muy oscuro |
| Primario | `#cc2f70` magenta (botones principales, «no la suerte.») |
| Secundario | `#6d3bad` morado (rótulos en mayúsculas espaciadas) |
| Estados | verde `#21845e` / `#daf1e7` · azul `#2d66ac` / `#deebfa` · amarillo `#b88400` / `#fff1c5` · rosa suave `#f9dfe9` |
| Fondo | lavanda `#f8f5fc`; gris de texto `#675d78` |
| Formas | radios de 12–26 px, marcos de foto tipo «blob», corazones ♡ dibujados, iconos de trazo 1,8 px |
| Patrones | rótulo pequeño + título grande, tarjetas con tinte suave por categoría, notas de privacidad con escudo verde, modal como hoja inferior en móvil |

Nota: el deck del pitch (fuera de este repositorio) usa otro sistema («fotocopia sobre asfalto»: Bricolage Grotesque, rojo `#C4261C`, amarillo resaltador). Este documento toma el morado/magenta del Figma como la marca, por decisión del equipo.

---

## 2. Los requisitos, en lo que afecta al diseño

**Alcance del semestre.** Solo el Módulo 1 (perdidas y encontradas) es **funcional** (TRL 4). Los módulos 2 (información y trámites), 3 (conexión entre actores) y 4 (mapa de servicios) se entregan como **interfaz navegable con datos de ejemplo**. Las pantallas de los cuatro módulos tienen que existir.

**Actores y niveles de verificación**

| Nivel | Actor | Puede |
|---|---|---|
| 0 | Visitante | Ver reportes con ubicación aproximada y guías |
| 1 | Usuario (SMS) | Publicar, buscar por foto, confirmar candidatos, pedir contacto, activar alertas |
| 2 | Fundación (documentos + aval) | Publicar adopciones con sello de fundación |
| 3 | Prestador (RUES + RUT) | Aparecer en el mapa con sello, perfil con servicios y horarios |
| — | Administrador | Verificar, moderar, atender borrados, auditoría |

**Reglas que la interfaz tiene que hacer visibles**

- **RN-01** El sistema propone, una persona decide. Nada pasa a «resuelto» sin confirmación humana.
- **RN-02** Nunca mostrar porcentaje de certeza.
- **RN-03** Un hallazgo se compara con pérdidas de la misma especie, y al revés.
- **RN-04** Solo se guarda el recorte del animal.
- **RN-05 / RF-07** El teléfono se revela solo cuando ambas partes aceptan.
- **RF-15 / RNF-03** Reportes en el mapa como círculo de 500 m, nunca punto exacto.
- **RF-19** Filtros de 15 km y 60 días antes de comparar.
- **4.1 / RNF-04** Consentimiento con casilla **no marcada por defecto**; la ubicación pide una autorización aparte al publicar.
- **RF-13 / RNF-05** Eliminar cuenta y datos desde el perfil.
- **RF-17** Límite de reportes por día por cuenta.

**Metas no funcionales con efecto en el diseño:** búsqueda ≤ 5 s (RNF-02); un usuario nuevo publica un reporte en ≤ 3 min sin ayuda (RNF-07); Chrome y Safari móviles desde **360 px** (RNF-08).

**Ciclo de vida del caso (RF-06):** activo → en seguimiento → resuelto / cerrado, con fecha en cada cambio. De ahí sale la tasa de reencuentro.

---

## 3. Cruce: requisito → pantalla del prototipo

✅ cubierto · ◐ parcial · ✗ falta

| Req. | Qué pide | Estado | Detalle |
|---|---|---|---|
| RF-01 / HU-01 | Registro con SMS | ◐ | Hay ingreso por SMS. No hay registro propio (nombre, consentimiento), ni estados de código incorrecto o número ya registrado. |
| RF-13 / HU-01 | Consentimiento con fecha y versión | ✗ | «Al continuar aceptas…» es aceptación implícita. Falta la casilla sin marcar. |
| RF-13 / HU-07 | Eliminar cuenta y datos | ✗ | No aparece en Mi perfil. |
| RF-02 / HU-02-03 | Reporte con 1 a 5 fotos, especie, rasgos, zona, fecha | ◐ | Hay formulario. La carga es de **una** foto: no hay manejo de 1 a 5, ni orden, ni quitar. |
| HU-02 | Autorización específica de ubicación | ◐ | Está, pero la casilla viene **marcada por defecto**, contra la sección 4.1. |
| RF-03 / HU-02 | Rechazo de foto sin perro ni gato | ✗ | Solo existe el camino feliz («Animal detectado»). |
| RF-17 | Límite diario de reportes | ✗ | Sin estado de error. |
| RF-04 / HU-04 | Top-5 filtrado por especie, zona, fecha | ◐ | Dice «5 posibles coincidencias» y muestra **3**. La búsqueda no pregunta especie ni si perdiste o encontraste (RN-03), y no deja ver ni ajustar zona y fechas. |
| RN-02 | Sin porcentaje | ✅ | Aviso «Tú decides, no el sistema». |
| RF-05 / HU-05 | Confirmar o descartar | ◐ | «No es» vuelve a la lista pero el candidato sigue ahí (HU-05 pide que desaparezca). En móvil la barra de decisión queda bajo el pliegue. |
| RF-06 / HU-06 | Estados del caso con historial | ◐ | Hay etiquetas de estado. «Ver caso» no lleva a nada: falta la ficha del caso con historial, cambio de estado y «marcar como reencontrado» (RN-01). |
| RF-07 / HU-08 | Contacto intermediado | ◐ | Se ve el lado de quien pide. Faltan el lado de quien recibe (aceptar o rechazar), la revelación del contacto cuando ambos aceptan y los mensajes. |
| RF-11 / HU-09 | Alertas por zona, opt-in | ✅ | Interruptor y radio en el panel. Falta el aviso de alerta en sí (la campana no hace nada). |
| RF-15 / HU-16 | Mapa público con círculos de 500 m | ✗ | No hay listado ni mapa público de reportes. «Ver todos» abre la búsqueda por foto. |
| RF-16 | Reportar perfil sospechoso | ✗ | |
| RF-08 / HU-11-12 | Adopción: publicar (fundación) y filtrar | ✗ | Solo una tarjeta de texto en el inicio. |
| RF-09 / HU-13 | Guías con fuente oficial y fecha | ✗ | Solo una tarjeta de texto. |
| RF-10 / HU-14 | Mapa de servicios por categoría y urgencias 24 h | ✗ | Solo una tarjeta de texto. |
| RF-14 / HU-10 | Perfil verificado de fundación o prestador | ✗ | No hay roles distintos de usuario ni sellos. |
| RF-12 / RF-18 / HU-15 | Panel de administración y auditoría | ✗ | |
| RNF-08 | 360 px | ◐ | Se adapta bien a 375 px (hoja inferior, barra de pestañas). Falta probar a 360 px. |
| *(nuevo)* | Avistamiento: animal visto solo en la calle | ✗ | No está en los requisitos ni en el prototipo. Propuesta en la sección 6. |

**Balance:** el prototipo cubre bien el camino feliz del Módulo 1 desde quien busca. Falta todo lo que no es camino feliz (errores, rechazos, límites), la otra parte de cada conversación (quien encontró, quien recibe la solicitud) y los módulos 2, 3 y 4 con los roles de fundación, prestador y administrador.

### 3.1 Inconsistencias de datos de ejemplo

- La tarjeta «Milo» del inicio dice *Perdido*, pero su fecha dice «Encontrado el 12 nov.», y en el detalle de candidato sale como *Encontrado*.
- El caso de Toby en el panel usa la foto de Milo.
- «5 posibles coincidencias» con 3 en la lista.
- «Solicitud aceptada · Ya puedes contactar a Juan R.» no tiene pantalla de destino.

### 3.2 Lo que vale la pena conservar

- La frase del hero. Dice el producto en siete palabras.
- La privacidad como elemento visible y constante (escudo + «área de 500 m»), no escondida en un pie de página.
- «Tú decides, no el sistema» en los resultados. Es la regla RN-01/RN-02 dicha en voz de producto.
- La pantalla de contacto con las dos partes y la línea entre ellas: explica RF-07 sin texto legal.
- Los flujos cortos con «Paso n de 3». Ayudan a la meta de 3 minutos (RNF-07).
- Hoja inferior en móvil y barra de pestañas en el panel.

---

## 4. Inventario de pantallas que necesita el rediseño

Para la siguiente etapa (lenguaje de diseño y pantallas nuevas). Las ✱ no existen hoy.

**Público (Visitante)**
1. Inicio
2. ✱ Reportes: listado + mapa con círculos de 500 m, filtros especie / zona / fecha / perdido-encontrado
3. ✱ Ficha pública de un reporte
4. ✱ Guías y trámites (lista + guía con fuente y fecha)
5. ✱ Adopción (lista con filtros + ficha del animal con sello de fundación)
6. ✱ Mapa de servicios (categorías, urgencias 24 h) + perfil de prestador con sello

**Cuenta**
7. Ingreso por SMS + ✱ registro con consentimiento sin marcar + ✱ estados de error (código incorrecto, número ya registrado, código vencido)

**Módulo 1 (funcional)**
8. Crear reporte: tipo (perdido / encontrado / ✱ visto en la calle, ver sección 6) → ✱ 1 a 5 fotos → datos → ✱ autorización de ubicación aparte y sin marcar → publicado
9. ✱ Rechazo de foto (sin perro ni gato, borrosa, muy pequeña) · ✱ límite diario alcanzado
10. Buscar por foto: ✱ ¿perdiste o encontraste? + especie → foto → analizando → top-5 → candidato → confirmar / ✱ descartar (desaparece)
11. Contacto: solicitud → ✱ recibir y aceptar o rechazar → ✱ contacto revelado
12. ✱ Ficha del caso: historial con fechas, cambio de estado, «marcar como reencontrado»
13. Panel: resumen, mis casos, alertas, perfil + ✱ eliminar cuenta + ✱ centro de notificaciones

**Roles (interfaz)**
14. ✱ Fundación: verificación (subir documentos, estado), publicar animal en adopción
15. ✱ Prestador: verificación, perfil con servicios y horarios
16. ✱ Administrador: cola de verificación, moderación de reportes y perfiles denunciados, solicitudes de borrado, registro de auditoría

**Estados transversales:** vacío, cargando, error, sin conexión, sello pendiente / aprobado / retirado.

---

## 5. Lo que el lenguaje de diseño tiene que resolver

Estas son las tensiones que salen de los requisitos. No son decisiones todavía; son lo que el sistema nuevo debe poder expresar.

1. **Perdido y encontrado** necesitan un código propio, distinto al de los estados del caso. Hoy los dos usan rosa y verde y se confunden.
2. **Cuatro estados del caso** (activo, en seguimiento, resuelto, cerrado) legibles de un vistazo y en una línea de tiempo.
3. **Cuatro niveles de confianza** (visitante, celular verificado, fundación, prestador): un sistema de sellos que se pueda retirar.
4. **Parecido sin certeza:** ordenar candidatos sin números ni barras que se lean como porcentaje (RN-02).
5. **Privacidad como material:** el círculo de 500 m, el teléfono oculto y el recorte del animal como elementos gráficos que se repiten, no como notas al pie.
6. **Urgencia sin alarma:** alguien que acaba de perder a su animal está angustiado; el tono tiene que ser rápido y claro sin ser estridente. Urgencias 24 h en el mapa sí es una alarma real.
7. **La foto como protagonista:** fotos de calle, mal iluminadas y de celular. El sistema tiene que verse bien con fotos malas, no solo con las de Unsplash.
8. **Dos modos de uso:** el público (móvil, con prisa, a 360 px) y el de trabajo (panel de fundación, prestador y administrador, con tablas y colas).

---

## 6. Cambio propuesto: tercer tipo de reporte, «Visto en la calle»

*Añadido durante el diseño de las pantallas. Ya está en el canvas: prototipo «Encontré o vi un animal», en móvil y en web.*

### 6.1 Por qué

Los requisitos solo tienen dos tipos de reporte: perdido y encontrado. HU-03 describe a una persona que *encontró* al animal, es decir, que lo tiene. Falta el caso más común y de menor esfuerzo: alguien ve un perro o un gato solo en la calle, no lo puede agarrar y quiere avisar.

Hoy esa persona tiene dos salidas, y las dos son malas:

- **No reporta.** Se pierde justo el dato que la familia necesita: por dónde anda el animal y a qué hora.
- **Lo reporta como «encontrado».** La familia cree que alguien lo tiene a salvo, pide el contacto y descubre que no. Eso rompe la confianza en el sistema.

### 6.2 Cómo lo resuelve el diseño

| Aspecto | Encontrado (alguien lo tiene) | Visto en la calle (nadie lo tiene) |
|---|---|---|
| Etiqueta | *Encontrado*, relleno en tinta | *Visto en la calle*, solo contorno en tinta: nadie lo tiene |
| Fotos | 1 a 5, obligatorias | 0 a 5. «Aunque sea de lejos» |
| Sin foto | No se puede publicar | Se publica y avisa por zona, pero no entra en la comparación por foto |
| Datos propios | Cuánto tiempo puede cuidarlo (Solo hoy / Unos días / Hasta que aparezca su familia) | Cuándo lo vio (Ahora / Hace 1 hora / Hoy más temprano) y hacia dónde iba (Norte / Sur / Oriente / Occidente / No sé) |
| Comparación | Con pérdidas de la misma especie | Igual, si tiene foto |
| Contacto | Dos llaves (RN-05) | Igual: la familia puede pedirle detalles a quien lo vio |
| Vigencia | Hasta que se cierre el caso | 7 días; quien lo publicó lo puede renovar |
| En el mapa | Círculo de 500 m | Igual |

### 6.3 Cambios al documento de requisitos

| Dónde | Texto actual | Texto propuesto |
|---|---|---|
| 1.5 Definiciones · Reporte | Publicación de una mascota perdida o encontrada | Publicación de una mascota **perdida**, **encontrada** (alguien la tiene) o **vista en la calle** (alguien la vio sola y nadie la tiene) |
| 1.5 Definiciones · *(nuevo)* Avistamiento | — | Reporte de un animal visto solo en la calle. Lleva lugar, hora aproximada y, si se sabe, dirección. La foto es opcional. Se ve 7 días y se puede renovar. |
| RF-02 | Publicar un reporte de pérdida o hallazgo con 1 a 5 fotos, especie, rasgos, zona y fecha | Publicar un reporte de pérdida, hallazgo o avistamiento con especie, rasgos, zona y fecha. Pérdida y hallazgo llevan de 1 a 5 fotos; el avistamiento, de 0 a 5, y además hora aproximada y dirección opcional. **Criterio añadido:** un avistamiento sin foto aparece en el listado y genera alertas de zona (RF-11), pero no entra en la comparación por foto. |
| RN-03 | Un hallazgo se compara con pérdidas (y al revés), de la misma especie | Un hallazgo o un avistamiento se compara con pérdidas de la misma especie. Una pérdida se compara con hallazgos y avistamientos. |
| *(nueva)* HU-03b · Reportar un animal visto en la calle (RF-02, RF-11) · S | — | Como persona que vio un animal solo en la calle y no pudo llevárselo, quiero avisar dónde y cuándo lo vi, para que su familia sepa por dónde buscar. **Dado** un avistamiento sin foto, **cuando** lo publico, **entonces** se avisa a quienes tienen alertas en la zona. **Dado** un avistamiento con foto, **cuando** lo publico, **entonces** se compara con pérdidas de la misma especie (RN-03). **Dado** un avistamiento, **entonces** su etiqueta dice «Visto en la calle», nunca «Encontrado». **Dado** que pasan 7 días, **entonces** deja de verse salvo que lo renueve. |
| HU-09 | Recibir un aviso cuando se publique un reporte cerca de mi zona | Sin cambio de texto. Los avistamientos cuentan como reporte, así que también generan aviso. |
| 7.1 Modelo de datos · Reporte | Tipo (perdido / encontrado), especie, rasgos, zona, fecha, coordenada exacta (privada), estado | Tipo (perdido / encontrado / **visto**), especie, rasgos, zona, fecha, **hora aproximada y dirección (solo visto)**, **vence el (solo visto)**, coordenada exacta (privada), estado |
| 8 · Trazabilidad *(fila nueva)* | — | Persona que vio un animal solo · Avisar sin tener que llevárselo · F1.1, F1.3 · RF-02, RF-11 |

**Prioridad propuesta: S (debería).** El Módulo 1 tiene que ser funcional este semestre, y ponerlo como M ampliaría ese alcance. El tipo nuevo reutiliza casi todo lo que ya existe (formulario, recorte, comparación, alertas, contacto); lo nuevo es la foto opcional, los dos campos y el vencimiento.

### 6.4 Lo que falta decidir

1. **Ciclo de vida.** ¿El avistamiento tiene los cuatro estados de RF-06, o solo *activo* → *vencido* / *cerrado*? El diseño asume lo segundo: nadie le hace seguimiento a un avistamiento como a un caso.
2. **Ventana de comparación.** RF-19 compara 60 días hacia atrás. Para una pérdida, ¿un avistamiento de hace 50 días sirve de algo? Propuesta: comparar solo avistamientos vigentes (7 días).
3. **Varios avistamientos del mismo animal.** Si tres personas lo ven en la misma calle, ¿se agrupan en el mapa como un rastro? Sería útil, pero no es para este semestre.
4. **Límite diario (RF-17).** ¿Los avistamientos cuentan en el mismo límite? Al no exigir foto, son más fáciles de abusar.
