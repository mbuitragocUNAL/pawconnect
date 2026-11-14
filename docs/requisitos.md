_Transcripción en Markdown del documento técnico de requisitos (PDF). Si hay diferencias, manda el PDF._

# PawConnect – Documento técnico de requisitos

## 1. Introducción

### 1.1 Propósito

Este documento especifica qué debe hacer PawConnect, para quién y bajo qué restricciones. Sirve como referencia para el desarrollo, las pruebas y la validación con usuarios, y organiza los requisitos funcionales, no funcionales, actores, historias de usuario y reglas de negocio.

### 1.2 Problema y solución

En Bogotá y Cundinamarca la información sobre animales de compañía perdidos, encontrados y en adopción está dispersa en redes sociales, carteles y portales distintos, lo que dificulta el reencuentro. El IDPYBA reportó 671 casos y 114 reencuentros en su portal entre agosto de 2025 y marzo de 2026.

PawConnect es una plataforma web adaptada a celular que centraliza reportes de mascotas perdidas y encontradas, **propone coincidencias comparando fotos** (con confirmación humana), intermedia el primer contacto y reúne información de adopción, trámites y servicios. Complementa al IDPYBA, no lo reemplaza. La alternativa seleccionada en el documento es **A4: reencuentro asistido por imágenes**.

### 1.3 Alcance del semestre

| Módulo | Estado al cierre | Qué se entrega |
|---|---|---|
| 1. Mascotas perdidas y encontradas | **Funcional (TRL 4)** | Reportes, búsqueda por foto y seguimiento del caso, probados en entorno controlado |
| 2. Información y trámites | Interfaz navegable | Pantallas con contenido de ejemplo, sin lógica de negocio |
| 3. Conexión entre actores | Interfaz navegable | Pantallas con datos de ejemplo |
| 4. Mapa de servicios | Interfaz navegable | Pantallas con servicios de ejemplo |

### 1.4 Fuera de alcance (este semestre)

- Red de refugios integrada y alianzas operativas con entidades (fase posterior).
- Verificación automática de documentos (la verificación es manual).
- Almacenamiento de certificados de animales de apoyo emocional (datos sensibles de salud).
- Entrenamiento de modelos propios de visión (se usan modelos preentrenados).
- Pruebas en operación real con usuarios (TRL 5 o superior).

### 1.5 Definiciones

| Término | Significado |
|---|---|
| Reporte | Publicación de una mascota **perdida** o **encontrada** |
| Caso | Ciclo de vida de un reporte: activo, en seguimiento, resuelto o cerrado |
| Candidato | Reporte propuesto por el sistema como posible coincidencia |
| Vector de rasgos | Lista de números generada por un modelo de visión que resume el aspecto del animal |
| Top-5 | Los 5 candidatos más parecidos devueltos por una búsqueda |
| TRL 4 | Componentes integrados y validados en laboratorio |
| IDPYBA | Instituto Distrital de Protección y Bienestar Animal |
| RUES / RUT | Registro Único Empresarial y Social / Registro Único Tributario |

## 2. Actores

### 2.1 Actores del sistema

| Actor | Descripción | Nivel de verificación | Qué puede hacer |
|---|---|---|---|
| **Visitante** | Persona sin cuenta | 0 – ninguna | Ver reportes con ubicación aproximada y guías de trámites |
| **Usuario** | Propietario, quien perdió o encontró un animal, adoptante | 1 – código SMS al celular, una cuenta por número | Publicar reportes, buscar por foto, confirmar candidatos, pedir contacto, activar alertas |
| **Fundación o refugio** | Organización que publica animales en adopción | 2 – revisión documental (certificado de existencia o RUT) y aval de una fundación verificada o entidad de protección animal | Publicar animales en adopción con sello de fundación, tener perfil verificado |
| **Prestador de servicios** | Veterinarias, guarderías, hoteles, paseadores, entrenadores | 3 – matrícula en el RUES y RUT; personas naturales: RUT y referencia verificable | Aparecer en el mapa con sello de verificación, tener perfil con servicios y horarios |
| **Administrador** | Equipo de PawTeam | Interno | Verificar prestadores y fundaciones, moderar reportes, atender solicitudes de borrado de datos |

### 2.2 Actores externos y sistemas

| Actor | Rol |
|---|---|
| Proveedor de SMS | Envío del código de un solo uso (proveedor con cuota gratuita, por confirmar) |
| OpenStreetMap (Leaflet o MapLibre) | Cartografía sin costo por consulta |
| Servicio de reconocimiento | Componente propio, separado de la API: detecta, recorta y genera el vector |
| IDPYBA y entidades de protección animal | Fuente de información oficial de trámites y posibles avales (articulación en OE3) |
| Asesoría jurídica | Define el registro de la base de datos ante el RNBD (Ley 1581 de 2012) |

### 2.3 Stakeholders clave (interés / poder, escala 1–10)

| Stakeholder | Interés | Poder |
|---|---|---|
| Propietarios de mascotas | 10 | 7 |
| Personas que perdieron una mascota | 10 | 6 |
| Fundaciones y refugios | 9 | 7 |
| Equipo de desarrollo | 9 | 9 |
| Centros de atención médica | 8 | 8 |
| Entidades gubernamentales | 6 | 10 |
| Entidades regulatorias, inversionistas | 6 | 9 |
| Proveedores tecnológicos | 5 | 8 |

## 3. Requisitos funcionales

La columna _Semestre_ indica si el requisito se **construye y prueba** (Funcional) o solo se **representa en el prototipo** (Interfaz).

| ID | Requisito | Función | Criterio de verificación | Semestre |
|---|---|---|---|---|
| RF-01 | Registrar usuarios con celular verificado mediante un código de un solo uso | Transversal | La cuenta solo se activa con el código correcto | Funcional |
| RF-02 | Publicar un reporte de pérdida o hallazgo con 1 a 5 fotos, especie, rasgos, zona y fecha | F1.1 | Los campos obligatorios se validan y el reporte aparece en el listado | Funcional |
| RF-03 | Procesar cada foto: detectar el animal, recortarlo y generar su vector de rasgos | F1.1, F1.2 | Una foto sin perro ni gato se rechaza con un mensaje; las demás generan vector | Funcional |
| RF-04 | Buscar por foto y devolver los 5 reportes más parecidos, filtrados por especie, zona y fecha | F1.2 | La respuesta trae 5 candidatos ordenados, sin porcentaje de certeza | Funcional |
| RF-05 | Mostrar cada candidato y permitir confirmarlo o descartarlo | F1.3 | Ningún caso se marca como resuelto sin una confirmación humana | Funcional |
| RF-06 | Gestionar el estado del caso (activo, en seguimiento, resuelto, cerrado) y registrar los reencuentros | F1.3 | Cada cambio queda con fecha; se calcula la tasa de reencuentro | Funcional |
| RF-07 | Intermediar el primer contacto sin mostrar el teléfono hasta que ambas partes aceptan | F3.1 | El teléfono no aparece en pantalla ni en la respuesta de la API antes de la aceptación | Interfaz |
| RF-08 | Publicar animales en adopción (fundaciones verificadas) y filtrarlos | F2.2 | Solo cuentas con sello de fundación pueden publicar | Interfaz |
| RF-09 | Consultar guías de trámites y requisitos con fuente y fecha de actualización | F2.1, F2.3 | Cada guía muestra su fuente oficial y la fecha | Interfaz |
| RF-10 | Mostrar un mapa de servicios filtrable por categoría, con urgencias 24 horas | F4.1 | Cada categoría filtra el mapa | Interfaz |
| RF-11 | Enviar alertas por zona a quien las autorice | F3.3 | Solo reciben alerta los usuarios que activaron la opción | Interfaz |
| RF-12 | Ofrecer un panel administrativo para verificar prestadores, moderar reportes y atender solicitudes de borrado | F4.3 | Un administrador puede aprobar, rechazar y registrar cada acción | Interfaz |
| RF-13 | Registrar el consentimiento del usuario y permitir eliminar la cuenta y sus datos | Transversal | Cada cuenta tiene fecha y versión del texto aceptado; la eliminación borra los datos personales | Funcional |
| RF-14 | Mantener perfiles verificados de fundaciones y prestadores con servicios y horarios | F3.2 | El sello aparece solo tras la aprobación de un administrador | Interfaz |

### 3.1 Requisitos adicionales derivados de las reglas del documento (propuesto)

| ID | Requisito | Origen | Criterio de verificación |
|---|---|---|---|
| RF-15 | Mostrar los reportes en el mapa como un círculo de 500 m, nunca como punto exacto | F4.2, RNF-03 | La API pública y el mapa no exponen la coordenada exacta |
| RF-16 | Permitir que cualquier usuario reporte un perfil sospechoso; el sello se retira tras reportes fundados | Sección 12.6.2 | Un administrador puede retirar el sello y queda registrado |
| RF-17 | Limitar el número de reportes por día por cuenta | Sección 12.6.2 | Al superar el límite se rechaza la publicación (valor definido en el plan de pruebas) |
| RF-18 | Registrar cada acceso de administradores a documentos y mensajes | Principio de confidencialidad | Existe un registro de auditoría consultable |
| RF-19 | Aplicar filtros de zona (radio inicial 15 km) y ventana de fechas (60 días) antes de comparar vectores | Sección 12.5 | Los valores son configurables; no se comparan reportes fuera de ellos |

### 3.2 Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | El sistema **propone**, una persona **decide**: ningún caso pasa a «resuelto» sin confirmación humana |
| RN-02 | No se muestra porcentaje de certeza, porque aparentaría una precisión que el sistema no tiene |
| RN-03 | Un hallazgo se compara con pérdidas (y al revés), de la misma especie |
| RN-04 | Solo se conserva el recorte del animal; la foto original se descarta |
| RN-05 | El teléfono solo se revela cuando ambas partes aceptan el contacto |
| RN-06 | Los documentos de verificación se borran tras la revisión; solo se conserva el resultado y la fecha |
| RN-07 | La plataforma no recibe ni almacena certificados de animales de apoyo emocional |
| RN-08 | La coordenada exacta se elimina 30 días después de cerrar el caso; el recorte y el vector, 12 meses después (propuestas del equipo) |
| RN-09 | Una cuenta por número de celular |

## 4. Requisitos no funcionales

| ID | Categoría | Requisito | Meta | Cómo se verifica |
|---|---|---|---|---|
| RNF-01 | Precisión | El animal correcto aparece entre los 5 candidatos | ≥ 70 % de las consultas de prueba (perros y gatos medidos por separado) | Banco de fotos de prueba, propuesta: ≥ 40 animales con foto de registro y de consulta |
| RNF-02 | Desempeño | Tiempo de búsqueda por foto | ≤ 5 s desde la subida hasta mostrar candidatos | Pruebas funcionales con hasta 10.000 reportes simulados |
| RNF-03 | Privacidad de ubicación | Ubicación pública de los reportes | Margen de 500 m; la coordenada exacta no sale del servidor | Inspección de la API pública y del mapa |
| RNF-04 | Consentimiento | Ningún dato personal sin autorización previa, expresa e informada | 100 % de las cuentas con registro de consentimiento | Revisión de la base de datos |
| RNF-05 | Borrado | Eliminación de cuenta y datos personales | ≤ 15 días hábiles (en el prototipo, desde el perfil) | Prueba de eliminación |
| RNF-06 | Seguridad | Transmisión cifrada, roles con acceso mínimo, fotos sin enlaces listables | HTTPS en todo el tráfico; 3 roles (usuario, prestador, administrador) | Informe de validación de seguridad |
| RNF-07 | Usabilidad | Un usuario nuevo publica un reporte sin ayuda | ≥ 80 % lo logra en ≤ 3 min (propuesta) | Pruebas de usabilidad con 15 usuarios y 2 fundaciones |
| RNF-08 | Compatibilidad | Celulares y navegadores actuales | Chrome y Safari móviles, desde 360 px de ancho | Pruebas en dispositivos reales |
| RNF-09 | Costo | Operación dentro del presupuesto | ≤ $440.000 COP de costos directos; código abierto o planes gratuitos | Comparación con la EDT |
| RNF-10 | Mantenibilidad | Componentes desacoplados y documentados | API documentada; servicio de reconocimiento separado | Documentación técnica |

### 4.1 Restricciones y cumplimiento legal

- **Ley 1581 de 2012** (protección de datos): PawTeam S.A.S. actúa como responsable del tratamiento. Aplican los ocho principios: legalidad, finalidad, libertad, veracidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad.
- Las fotos y vectores de animales no son datos personales; el teléfono, la ubicación y los mensajes de sus cuidadores sí lo son.
- Plazos al titular: consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles.
- El consentimiento se acepta con una casilla **no marcada por defecto**; la ubicación exige autorización adicional al publicar.
- El microchip es voluntario en Colombia: la foto suele ser el único dato de identificación.
- No existe un banco colombiano de fotos de animales; el equipo debe construir uno propio para pruebas.

## 5. Historias de usuario

Prioridad según MoSCoW: **M** (debe), **S** (debería), **C** (podría). Los criterios de aceptación usan el formato Dado / Cuando / Entonces.

### Módulo 1 – Mascotas perdidas y encontradas (funcional)

**HU-01 · Registro con celular verificado (RF-01, RF-13) · M**

_Como_ persona nueva, _quiero_ crear una cuenta con mi celular, _para_ poder publicar y buscar.

- Dado un número válido, cuando solicito el código, entonces recibo un SMS de un solo uso.
- Dado un código incorrecto, cuando lo ingreso, entonces la cuenta no se activa.
- Dado el formulario de registro, cuando acepto la política con la casilla (no marcada por defecto), entonces se guarda la fecha y la versión del texto aceptado.
- Dado un número ya registrado, cuando intento crear otra cuenta, entonces el sistema lo impide.

**HU-02 · Reportar mascota perdida (RF-02, RF-03) · M**

_Como_ propietario que perdió a su mascota, _quiero_ publicar un reporte con fotos y datos, _para_ no tener que difundirlo en varias redes y grupos.

- Dado un reporte con especie, rasgos, zona, fecha y de 1 a 5 fotos, cuando lo envío, entonces aparece en el listado.
- Dado una foto sin perro ni gato, cuando la subo, entonces se rechaza con un mensaje claro.
- Dado que publico la ubicación, cuando confirmo, entonces se me pide una autorización específica de ubicación.

**HU-03 · Reportar mascota encontrada (RF-02, RF-03) · M**

_Como_ persona que encontró un animal, _quiero_ reportarlo, _para_ saber quién lo busca.

- Mismos criterios que HU-02, con tipo de reporte «encontrado».
- Dado que subo mi foto, cuando se procesa, entonces solo se conserva el recorte del animal (RN-04).

**HU-04 · Buscar por foto (RF-04, RF-19) · M**

_Como_ usuario, _quiero_ subir una foto y ver los reportes más parecidos, _para_ encontrar rápido una coincidencia.

- Dado una foto válida, cuando busco, entonces recibo 5 candidatos ordenados con foto, zona aproximada y fecha.
- Dado el resultado, entonces no se muestra ningún porcentaje de certeza.
- Dado un hallazgo, entonces solo se comparan pérdidas de la misma especie (y al revés).
- Dado que la búsqueda se lanza, entonces los candidatos se muestran en ≤ 5 s (RNF-02).

**HU-05 · Confirmar o descartar candidatos (RF-05) · M**

_Como_ usuario que busca, _quiero_ revisar cada candidato y confirmarlo o descartarlo, _para_ decidir yo si es mi mascota.

- Dado un candidato, cuando lo descarto, entonces deja de aparecer en mis resultados.
- Dado un candidato, cuando lo confirmo, entonces se habilita el contacto con la otra parte.
- Dado cualquier caso, entonces no pasa a «resuelto» sin una confirmación humana.

**HU-06 · Seguimiento del caso (RF-06) · M**

_Como_ autor de un reporte, _quiero_ ver y actualizar el estado de mi caso, _para_ mantener la información al día.

- Dado un caso, entonces su estado es activo, en seguimiento, resuelto o cerrado.
- Dado un cambio de estado, entonces queda registrado con fecha.
- Dado un caso resuelto, entonces cuenta para la tasa de reencuentro.

**HU-07 · Eliminar mi cuenta y mis datos (RF-13) · M**

_Como_ usuario, _quiero_ eliminar mi cuenta, _para_ ejercer mi derecho de supresión.

- Dado mi perfil, cuando pulso eliminar y confirmo, entonces se borran mis datos personales.
- Dado una solicitud real, entonces se atiende en ≤ 15 días hábiles.

### Módulo 3 – Conexión entre actores (interfaz)

**HU-08 · Contacto intermediado (RF-07) · S**

_Como_ usuario, _quiero_ contactar a la otra parte sin exponer mi teléfono, _para_ proteger mi privacidad.

- Dado una solicitud de contacto, entonces el teléfono no aparece en pantalla ni en la API.
- Dado que ambas partes aceptan, entonces se revela el método de contacto autorizado.

**HU-09 · Alertas por zona (RF-11) · C**

_Como_ usuario, _quiero_ recibir un aviso cuando se publique un reporte cerca de mi zona, _para_ poder ayudar o reconocer a un animal.

- Dado que activé las alertas, entonces recibo avisos de reportes en mi zona.
- Dado que no las activé, entonces no recibo ninguna.

**HU-10 · Perfil verificado de prestador (RF-14) · S**

_Como_ veterinaria, guardería o paseador, _quiero_ un perfil con servicios, horarios y sello, _para_ conseguir clientes y mostrar confianza.

- Dado un perfil nuevo, entonces no muestra el sello hasta que un administrador lo apruebe.
- Dado un perfil aprobado, entonces muestra servicios y horarios.

### Módulo 2 – Información y trámites (interfaz)

**HU-11 · Publicar animales en adopción (RF-08) · S**

_Como_ fundación o refugio verificado, _quiero_ publicar fichas de animales y requisitos, _para_ llegar a adoptantes.

- Dado una cuenta sin sello de fundación, entonces no puede publicar.
- Dado una ficha publicada, entonces muestra especie, zona, características y requisitos.

**HU-12 · Buscar animales en adopción (RF-08) · S**

_Como_ adoptante potencial, _quiero_ filtrar por especie, zona y características, _para_ hallar un animal que se ajuste a mí.

- Dado filtros aplicados, entonces el listado se actualiza según ellos.

**HU-13 · Consultar guías de trámites (RF-09) · S**

_Como_ propietario, _quiero_ consultar requisitos de tenencia, vacunación, viajes y transporte, _para_ cumplir la norma.

- Dado una guía, entonces muestra su fuente oficial y la fecha de actualización.

### Módulo 4 – Mapa de servicios y administración

**HU-14 · Mapa de servicios (RF-10) · S**

_Como_ propietario, _quiero_ ver veterinarias, urgencias 24 horas, guarderías y tiendas en un mapa, _para_ encontrar servicios cercanos y confiables.

- Dado una categoría seleccionada, entonces el mapa filtra por ella.
- Dado la opción de urgencias, entonces se muestran los servicios 24 horas.

**HU-15 · Administrar y moderar (RF-12, RF-16, RF-18) · S**

_Como_ administrador, _quiero_ verificar organizaciones, moderar reportes y atender borrados, _para_ mantener la confianza en la plataforma.

- Dado una solicitud de verificación, cuando apruebo o rechazo, entonces la acción queda registrada.
- Dado reportes fundados contra un perfil, entonces puedo retirar su sello.
- Dado un acceso a documentos o mensajes, entonces queda en el registro de auditoría.

**HU-16 · Ver reportes en el mapa sin exponer ubicación exacta (RF-15) · M**

_Como_ visitante, _quiero_ ver dónde hay reportes, _para_ orientarme, sin comprometer la privacidad de nadie.

- Dado un reporte, entonces se muestra como un círculo de 500 m.
- Dado cualquier consulta pública a la API, entonces no devuelve la coordenada exacta.

## 6. Flujo de reconocimiento de imágenes

1. **Foto.** El usuario sube de 1 a 5 fotos; el sistema revisa tamaño y nitidez.
2. **Recorte.** Un detector preentrenado (por ejemplo, YOLO) localiza al perro o gato y recorta; sin animal, la foto se rechaza.
3. **Vector de rasgos.** CLIP o DINOv2 convierten el recorte en un vector (384 a 1.024 valores). El equipo adopta el modelo que logre mejor RNF-01.
4. **Búsqueda por parecido.** Se filtra por especie, zona (15 km) y fecha (60 días) en SQL y luego se compara con pgvector.
5. **Cinco candidatos.** Se muestran ordenados, sin porcentaje de certeza.
6. **Confirmación humana.** La persona confirma o descarta; solo entonces el caso pasa a «resuelto».

Justificación de la confirmación humana: la precisión publicada (84,94 % en condiciones controladas con 42 perros) baja con fotos de calle, no hay evidencia equivalente para gatos y un error tiene consecuencias reales.

## 7. Arquitectura y tecnología

Seis componentes: interfaz web, API, servicio de reconocimiento, base de datos con vectores, almacenamiento de imágenes y servicio de mapas. La interfaz solo habla con la API; la API pide al servicio de reconocimiento procesar la foto; este guarda el vector en la base de datos y el recorte en el almacenamiento.

| Componente | Elección | Razón |
|---|---|---|
| Interfaz | Next.js (React), mobile-first | Un solo código para el módulo funcional y los prototipos (RNF-08) |
| API | Django REST Framework | Autenticación y panel administrativo listos (cubre RF-12) |
| Detección y recorte | Detector preentrenado (p. ej. YOLO) | Reconoce perros y gatos sin entrenamiento propio |
| Vector de rasgos | CLIP o DINOv2 | No requiere entrenamiento |
| Base de datos | PostgreSQL + pgvector | Datos y vectores juntos; filtros SQL antes de comparar |
| Mapas | OpenStreetMap con Leaflet o MapLibre | Gratuito, sin licencias |
| Almacenamiento | Almacenamiento de objetos del proveedor | Solo el recorte del animal (Ley 1581) |
| Código por SMS | Proveedor con cuota gratuita (por confirmar) | Verificación sin costo fijo (RF-01) |
| Despliegue | Contenedores (Docker) en servicio de bajo costo | Cabe en $150.000 COP previstos |

### 7.1 Modelo de datos preliminar (propuesto)

| Entidad | Contenido principal | Dato personal |
|---|---|---|
| Usuario | Nombre, celular verificado, rol, nivel de verificación | Sí |
| Consentimiento | Usuario, fecha, versión del texto, tipo (cuenta / ubicación) | Sí |
| Reporte | Tipo (perdido / encontrado), especie, rasgos, zona, fecha, coordenada exacta (privada), estado | Ubicación |
| FotoRecorte | Reporte, ruta del recorte, vector de rasgos | No |
| Caso | Reporte, estado, historial de cambios con fecha | No |
| Candidato | Reporte consulta, reporte propuesto, posición (1 a 5), decisión (confirmado / descartado) | No |
| SolicitudContacto | Partes, estado de aceptación de cada una, mensajes | Sí |
| Organización | Tipo (fundación / prestador), servicios, horarios, sello, resultado y fecha de verificación | Parcial |
| AnimalAdopción | Organización, ficha, requisitos | No |
| SuscripciónAlerta | Usuario, zona, activa | Ubicación |
| GuíaTrámite | Contenido, fuente oficial, fecha de actualización | No |
| ReportePerfil | Perfil reportado, autor, motivo, estado | Sí |
| Auditoría | Administrador, acción, objeto, fecha | Sí |

## 8. Trazabilidad necesidad → función → requisito

| Perfil | Necesidad | Función | Requisitos |
|---|---|---|---|
| Propietario que perdió su mascota | Encontrarla sin publicar en varias redes | F1.1, F1.2, F3.3 | RF-02, RF-04, RNF-01 |
| Persona que encontró una mascota | Saber dónde reportarla y quién la busca | F1.1, F1.3 | RF-02, RF-05 |
| Propietario que busca servicios | Servicios confiables y cercanos | F4.1, F3.2 | RF-10, RF-14 |
| Adoptante potencial | Ver animales y requisitos en un solo sitio | F2.2, F2.1 | RF-08, RF-09 |
| Fundación o refugio | Visibilidad y contacto con adoptantes | F2.2, F3.1, F3.2 | RF-08, RF-07, RF-14 |
| Veterinaria, guardería, paseador | Clientes y confianza | F3.2, F4.1, F3.1 | RF-14, RF-10, RF-07 |
| Entidad gubernamental o reguladora | Cumplimiento legal e información oficial | F2.1, F4.3 | RF-09, RF-12, RNF-04, RNF-05 |
| Proveedor tecnológico y desarrollo | Costos controlados, arquitectura por módulos | Arquitectura | RNF-09, RNF-10 |

## 9. Criterios de éxito del semestre

| Objetivo | Meta | Responsable |
|---|---|---|
| OE1 – Validación técnica | ≥ 70 % de acierto top-5 con el banco de fotos | CTO |
| OE2 – Usabilidad | 15 usuarios y 2 fundaciones en pruebas | COO |
| OE3 – Articulación | 1 carta de intención firmada antes del 15 de diciembre de 2026 | CEO |
| OE4 – Directorio | 30 prestadores registrados | CMO |

## 10. Riesgos y supuestos

| Riesgo o supuesto | Mitigación |
|---|---|
| Las fotos reales de calle tienen peor calidad que las de la literatura | Medir precisión con banco propio; confirmación humana; cambiar de modelo si no se alcanza RNF-01 |
| No se alcanza RNF-02 con los recursos del despliegue | Cambiar a un modelo más pequeño antes de cambiar la arquitectura |
| El acceso institucional (IDPYBA, IPYBAC, Cajicá) no depende solo del equipo | Iniciar el contacto temprano; la carta de intención es la meta mínima |
| Información falsa o publicación masiva | Verificación por niveles, límite diario por cuenta, reporte de perfiles |
| El alcance excede el tiempo del semestre | Un solo módulo funcional; los demás como interfaz |
| Datos personales mal tratados | Privacidad desde el diseño; asesoría jurídica sobre el RNBD |
| Valores marcados como «propuesta» (tamaño del banco, usabilidad, plazos de retención) | Son supuestos iniciales; se ajustan en el plan de pruebas |
