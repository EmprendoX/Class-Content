# Paquete Docente: Semana de Inteligencia Artificial (Preparatoria)

## Visión general
- **Enfoque pedagógico:** Montessori/constructivista: exploración guiada, materiales manipulables (tarjetas de ejemplo, post-its, hojas de cálculo), autocorrección con claves entregadas, elección de caminos de aprendizaje (con/sin internet), reflexión constante.
- **Duración:** 5 sesiones de 50 minutos.
- **Objetivos semanales:**
  - Diferenciar IA, automatización y Machine Learning (ML) con ejemplos cotidianos.
  - Explicar el ciclo de datos → entrenamiento → modelo → predicción y riesgos de sobreajuste.
  - Analizar sesgo, precisión, falsos positivos/negativos y equidad en contextos reales (contratación, crédito, vigilancia, salud).
  - Argumentar con fundamento sobre privacidad, datos personales y consentimiento en IA.
  - Diseñar una solución sencilla con IA, identificando problema, usuarios, datos, riesgos y mitigaciones.

---
## Lección 1: IA y aplicaciones cotidianas
### Idea central
La IA ya nos rodea: recomendadores, asistentes de voz y filtros; entender qué hace y qué no hace.

### Qué aprenderán hoy
- Diferenciar IA vs automatización programada.
- Reconocer ejemplos reales y sus beneficios/limitaciones.

### Guion minuto a minuto (50 min)
- 0–5 Bienvenida, pregunta generadora: «¿Qué tarea cotidiana crees que ya hace una IA?»
- 5–12 Mini-clase guiada (lectura en voz alta y ejemplos locales).
- 12–22 Demostración rápida: clasificador de imágenes simplificado en papel.
- 22–32 Actividad en parejas: mapa de IA cotidiana (tarjetas y post-its).
- 32–40 Chequeo de comprensión (preguntas dirigidas y mini-quiz oral).
- 40–47 Discusión breve + salida (exit ticket escrito).
- 47–50 Presentar tarea opcional y recoger materiales.

### Mini-clase (guion para decir)
1. «IA es un conjunto de técnicas para que una máquina aprenda patrones y tome decisiones. Automatización es seguir reglas fijas: si pasa A, entonces haz B. Un semáforo programado es automatización; un recomendador de música que aprende tus gustos es IA.»
2. «Machine Learning: la máquina aprende de datos. Damos ejemplos (entradas) y etiquetas (salidas) para que ajuste un modelo. Luego predice con nuevos datos.»
3. «Ejemplos cotidianos: filtros de spam, teclado predictivo, traducción automática, asistencia de mapas. Limitaciones: no entienden contexto como humanos, pueden equivocarse o tener sesgos si los datos están desequilibrados.»
4. «Generative AI (como chatbots): predicen texto plausible, pero pueden inventar hechos (alucinaciones). Uso responsable: citar fuentes, verificar datos sensibles.»

### Demostración/actividad guiada
- **Material:** 12 tarjetas con imágenes simples (gato, perro, coche, árbol) y etiquetas “gato/perro/otro”.
- **Paso a paso:**
  1) Reparte 8 tarjetas “de entrenamiento” (con etiqueta correcta) a la clase; 4 quedan como “prueba”.
  2) Pide a los estudiantes que definan reglas para distinguir gato vs perro (número de orejas, bigotes, tamaño). Escríbelo en pizarrón.
  3) Prueben las reglas con las 4 tarjetas de prueba. Cuenta errores → introduce idea de precisión.
- **Qué observar:** si las reglas son demasiado específicas (solo gatos grises) → sobreajuste.
- **Si falla:** si no encuentran reglas, guíalos: «¿cola larga? ¿orejas puntiagudas?»; si aciertan todo, cambia una tarjeta ambigua para mostrar límite.

### Preguntas de chequeo (con respuestas esperadas)
- ¿En qué se diferencia automatización de IA? → Automatización sigue reglas fijas; IA ajusta su comportamiento a partir de datos.
- Da un ejemplo de IA en tu teléfono. → Predicción de texto, filtro de spam, recomendador.
- ¿Por qué una IA puede equivocarse? → Datos incompletos/sesgados, patrones ambiguos, falta de contexto.

### Discusión (3–5 preguntas + criterios)
1) ¿Deberíamos confiar en recomendaciones automáticas para decidir qué leer? → Respuesta sólida: menciona utilidad, necesidad de criterio humano, sesgos de popularidad.
2) ¿Qué tareas preferirías que sigan siendo humanas? → Menciona empatía/ética, explica por qué.
3) ¿Hay alguna tarea donde la automatización sea mejor que una persona? → Resalta velocidad/consistencia, pero limita por contexto.

### Evaluación rápida (exit ticket) + clave
- Pregunta: «Escribe una frase que diferencie IA de automatización y da un ejemplo de cada una.»
- Clave: IA aprende de datos (ej. recomendador de música); automatización sigue reglas fijas (ej. temporizador de riego).

### Tarea/opcional + solución breve
- Pide a estudiantes listar 3 apps usadas en 24 h, marcar si usan IA y por qué. **Solución esperada:** identifica IA en teclado predictivo, filtros de spam, mapas; justifica con aprendizaje de datos.

### Diferenciación
- **Apoyo:** ofrecer tarjetas con pistas visuales; ejemplos concretos en la mini-clase.
- **Extensión:** pedir que agreguen un ejemplo de IA generativa (imagen o texto) y discutan riesgos.

### Materiales
Tarjetas impresas o dibujos, post-its, plumones, pizarrón, reloj.

---
## Lección 2: Machine Learning mediante simulación
### Idea central
El ML aprende de datos; demasiadas reglas específicas llevan a sobreajuste.

### Qué aprenderán hoy
- Ciclo completo: datos → entrenamiento → modelo → predicción.
- Conceptos de entrenamiento/prueba, precisión, falsos positivos/negativos.

### Guion minuto a minuto
- 0–5 Activación: repaso de lección 1 con 3 preguntas rápidas.
- 5–15 Mini-clase sobre ciclo de ML y tipos (supervisado, no supervisado, refuerzo).
- 15–30 Simulación de entrenamiento con dados/hoja de cálculo.
- 30–38 Discusión de resultados: precisión, sobreajuste.
- 38–45 Chequeo de comprensión (preguntas guiadas).
- 45–50 Exit ticket y asignación breve.

### Mini-clase (guion)
1. «En ML supervisado, tenemos datos con etiqueta: foto → gato/perro. La máquina aprende a mapear entrada a salida.»
2. «No supervisado: no hay etiquetas; la máquina agrupa por similitud (ej. clúster de clientes por hábitos).»
3. «Refuerzo: un agente prueba acciones, recibe recompensas y mejora (ej. aprender a jugar un videojuego).»
4. «Ciclo: recolectar datos → limpiarlos → dividir en entrenamiento (para aprender) y prueba (para evaluar) → ajustar modelo → medir errores.»
5. «Falsos positivos: predice “gato” y era perro. Falsos negativos: dice “no es gato” cuando sí lo era.»
6. «Sobreajuste: el modelo memoriza los datos de entrenamiento y falla en nuevos casos.»

### Actividad/simulación
- **Material:** dados o generador de números, tabla en papel o hoja de cálculo offline/online.
- **Paso a paso:**
  1) Genera 12 números (dados o RAND). Objetivo: predecir si el número es “alto” (>3) o “bajo” (≤3).
  2) Divide datos: 8 para entrenamiento, 4 para prueba.
  3) Regla inicial (modelo): “si número >3, predice alto”. Evalúa en entrenamiento.
  4) Cambia la regla para intentar mejorar (ej. “si ≥4 entonces alto, excepto si es 4”, regla absurda) y observa si empeora en prueba → sobreajuste.
  5) Calcula precisión: (aciertos/total) en prueba. Identifica falsos positivos/negativos.
- **Qué observar:** si crean reglas muy específicas para memorizar entrenamiento, mostrar cómo baja precisión en prueba.
- **Si falla:** si precisión es 100% por azar, repite con nuevos datos o añade ruido (ej. «si el número es 2 pero venía con nota 'favorito', clasifícalo alto»).

### Preguntas de chequeo
- ¿Qué es un conjunto de prueba? → Datos nuevos para evaluar el modelo.
- ¿Qué es un falso positivo? → Predijo positivo cuando era negativo.
- ¿Por qué dividir datos? → Para verificar que el modelo generaliza.

### Discusión
1) ¿Preferirías un modelo con pocas reglas generales o muchas reglas específicas? → Buscar referencia a generalización.
2) ¿En qué casos un falso negativo es peor que un falso positivo? → Ej. detección de enfermedades (falso negativo más grave).
3) ¿Cómo afecta el tamaño y diversidad de datos a la precisión? → Más y diversos datos reducen sesgo y sobreajuste.

### Evaluación rápida (exit ticket) + clave
- Pregunta: «Define sobreajuste en una frase y da un ejemplo de clase.»
- Clave: cuando el modelo memoriza entrenamiento y falla en nuevos datos; ejemplo: regla que solo funciona con los números vistos.

### Tarea/opcional
- Crear un diagrama manual del ciclo de ML con flechas y notas personales. **Criterio de éxito:** incluye datos, entrenamiento, prueba, ajuste, predicción.

### Diferenciación
- **Apoyo:** proporcionar tabla prellenada con algunos cálculos; guiar con ejemplos de falsos positivos/negativos.
- **Extensión:** pedir cálculo de precisión y error para dos modelos distintos y comparar.

### Materiales
Dados o generador de números, hojas cuadriculadas, lápices, calculadora opcional, computadora opcional.

---
## Lección 3: Ética del uso de IA
### Idea central
La IA impacta decisiones humanas; debemos evaluar sesgo, equidad y consecuencias.

### Qué aprenderán hoy
- Identificar sesgos en datos/modelos y su efecto en grupos.
- Analizar precisión vs equidad; falsos positivos/negativos en contextos sensibles.

### Guion minuto a minuto
- 0–6 Caso inicial breve (contratación automática) y reacciones.
- 6–15 Mini-clase sobre sesgo, datos desequilibrados y métricas básicas.
- 15–30 Análisis de casos (crédito, vigilancia, salud) en equipos.
- 30–40 Puesta en común y discusión guiada.
- 40–47 Chequeo de comprensión + exit ticket.
- 47–50 Cierre y tarea.

### Mini-clase (guion)
1. «Sesgo en IA: resultado sistemáticamente injusto para un grupo por datos o diseño.»
2. «Ejemplo: si un dataset de contratación tiene pocas mujeres en puestos técnicos, el modelo puede penalizar currículos de mujeres.»
3. «Métricas: precisión general vs impacto diferenciado. Falsos positivos en vigilancia facial pueden acusar a inocentes.»
4. «Equidad: revisar quién se beneficia y quién carga el riesgo. Minimizar daño: revisar datos, auditar resultados, permitir apelaciones.»
5. «IA responsable: transparencia (explicar qué datos usa), privacidad (usar solo lo necesario), consentimiento informado y derecho a corregir.»

### Actividad de análisis de casos
- **Material:** fichas con tres casos escritos (1 página cada uno) y tabla de análisis (preguntas guiadas).
- **Casos incluidos:**
  - Contratación técnica con CV filtrados automáticamente (pocas mujeres en datos).
  - Préstamos rápidos usando historial de móvil (poca información de ingreso formal).
  - Detección facial en cámaras escolares (iluminación desigual y menor precisión en piel oscura).
- **Paso a paso:**
  1) Equipos de 3 leen un caso (8 min).
  2) Responden tabla: a) datos usados, b) posible sesgo, c) riesgo mayor (FP/FN), d) mitigación (recopilar datos más equilibrados, revisión humana, explicación al usuario).
  3) Rotan caso o exponen hallazgos (7 min).
- **Qué observar:** si identifican quién es afectado; si solo hablan de precisión, preguntar por equidad.
- **Si falla:** entregar pistas: «¿Quién queda fuera de los datos?», «¿qué pasa si el modelo se equivoca con X grupo?»

### Preguntas de chequeo
- ¿Cómo puede el sesgo en datos afectar decisiones automatizadas? → Replicar desigualdades previas.
- ¿Por qué la precisión promedio no garantiza equidad? → Puede funcionar peor para un grupo minoritario.
- Ejemplo de mitigación de sesgo. → Balancear datos, revisión humana, probar por subgrupos.

### Discusión
1) ¿Debe informarse a las personas cuando una IA evalúa su solicitud? → Respuestas sólidas mencionan transparencia y derecho a apelar.
2) ¿Quién es responsable si un modelo da un resultado injusto? → Considerar equipo de desarrollo, organización, supervisión humana.
3) ¿Cuándo es legítimo usar reconocimiento facial? → Necesidad, proporcionalidad, consentimiento, supervisión legal.

### Evaluación rápida (exit ticket) + clave
- Pregunta: «Menciona un riesgo de sesgo en IA y una forma de mitigarlo.»
- Clave: riesgo: penalizar a un grupo por datos desequilibrados; mitigación: balancear dataset, auditorías, revisión humana.

### Tarea/opcional
- Breve reflexión (150 palabras): «Describe una situación en la que un falso positivo sería injusto.» **Criterio:** identifica contexto y por qué es injusto.

### Diferenciación
- **Apoyo:** glosario visible y frases iniciales para argumentar.
- **Extensión:** pedir propuesta de métrica de equidad y cómo recolectar evidencia.

### Materiales
Fichas impresas de casos, tablas de análisis, marcadores, pizarrón.

---
## Lección 4: Debate — IA y privacidad de datos
### Idea central
La privacidad es un derecho; las decisiones sobre datos deben considerar consentimiento, minimización y seguridad.

### Qué aprenderán hoy
- Argumentar a favor y en contra de usos de datos en IA.
- Evaluar riesgos de seguimiento, reidentificación y uso secundario de datos.

### Guion minuto a minuto
- 0–7 Activación: ejemplos de rastreo (cookies, apps de ubicación).
- 7–15 Mini-clase sobre datos personales, minimización, consentimiento y almacenamiento seguro.
- 15–20 Preparación de debate (roles, reglas).
- 20–40 Debate estructurado (formato pro/con, 2 rondas).
- 40–47 Conclusión escrita (parágrafo) + exit ticket.
- 47–50 Cierre y anuncio de proyecto final.

### Mini-clase (guion)
1. «Datos personales: cualquier información que identifique o pueda identificar (nombre, ubicación, hábitos de navegación).»
2. «Minimización: recolectar solo lo necesario. Si una app de linterna pide ubicación, cuestiona por qué.»
3. «Consentimiento informado: claro, revocable, específico. Evitar casillas pre-marcadas.»
4. «Riesgos: fuga de datos, reidentificación (cruzar bases), uso secundario no consentido.»
5. «Buenas prácticas: cifrado, accesos limitados, políticas claras, opción de borrar datos.»

### Preparación y debate
- **Material:** dos posturas predefinidas y tarjetas con evidencias.
- **Propuesta de moción:** «Las escuelas deberían usar sistemas de IA que analicen cámaras para seguridad.»
- **Paso a paso:**
  1) Divide clase en Pro y Contra (o grupos pequeños).
  2) Reparte tarjetas con argumentos y datos (ej.: reducción de incidentes vs riesgo de vigilancia excesiva; casos de error en reconocimiento facial).
  3) Formato: Apertura 2 min por lado, Ronda de refutación 2 min, Preguntas cruzadas 4 min, Cierre 2 min.
  4) Observadores usan rúbrica de debate (en “Claves y Rúbricas”).
- **Qué observar:** respeto de turnos, uso de evidencia, referencia a privacidad/consentimiento.
- **Si falla:** ofrecer frases guía: «Nuestro argumento principal es…», «La evidencia muestra…»

### Preguntas de chequeo
- ¿Qué es minimización de datos? → Recoger solo lo necesario para el propósito.
- Menciona un riesgo de seguimiento constante. → Perfilamiento, pérdida de anonimato.
- ¿Por qué el consentimiento debe ser revocable? → Para que el usuario recupere control sobre sus datos.

### Discusión
1) ¿Aceptarías compartir datos de salud con una IA médica? ¿bajo qué condiciones? → Busca mencionar consentimiento, seguridad, beneficio claro.
2) ¿Es diferente privacidad en público vs en línea? → Resalta persistencia y trazabilidad digital.
3) ¿Quién debería auditar sistemas de vigilancia con IA? → Autoridades independientes, comunidad, expertos técnicos.

### Evaluación rápida (exit ticket) + clave
- Pregunta: «Escribe una regla de privacidad que toda app deba cumplir.»
- Clave: consentimiento claro, minimización, opción de borrar datos, seguridad.

### Tarea/opcional
- Leer un artículo corto sobre protección de datos escolares (sugerido: noticias locales o guías oficiales) y escribir 3 recomendaciones aplicables al centro. **Criterio:** recomendaciones específicas (cifrado, acceso restringido, informar a familias).

### Diferenciación
- **Apoyo:** tarjetas con definiciones; permitir notas durante el debate.
- **Extensión:** incluir argumento sobre reidentificación y técnicas de anonimización.

### Materiales
Tarjetas de argumentos, cronómetro, rúbrica de debate, pizarrón.

---
## Lección 5: Crear una solución con IA (proyecto final)
### Idea central
Diseñar con responsabilidad: definir problema, usuarios, datos, riesgos y mitigaciones.

### Qué aprenderán hoy
- Plantear un problema realista y cómo una IA podría ayudar.
- Identificar datos necesarios, riesgos (sesgo, privacidad) y cómo mitigarlos.

### Guion minuto a minuto
- 0–8 Presentación del reto y ejemplos de proyectos sencillos.
- 8–18 Mini-clase sobre pasos del proyecto (descubrir problema, prototipo conceptual, riesgos).
- 18–35 Trabajo en equipos: lienzo de proyecto IA.
- 35–45 Presentaciones rápidas (pitch de 2 min) con feedback.
- 45–50 Exit ticket y recordatorio de entrega final (puede extenderse a otra sesión si se requiere).

### Mini-clase (guion)
1. «Elegir problema cercano: mejorar reciclaje escolar, tutor de estudio, alerta de clima.»
2. «Definir usuarios: quién usa la solución y qué necesitan.»
3. «Datos: qué datos se necesitan, cómo obtenerlos de forma ética (consentimiento, anonimización).»
4. «Modelo: ¿es clasificación, recomendación, chatbot? No necesitamos código, sí lógica.»
5. «Riesgos y mitigaciones: sesgo (datos equilibrados), privacidad (minimización), uso indebido (límites y avisos).»
6. «Métricas de éxito: ¿cómo sabremos que funciona? Ej.: % de estudiantes que reciben recordatorios útiles.»

### Actividad principal: lienzo de proyecto IA
- **Material:** plantilla de lienzo (problema, usuarios, datos, modelo, riesgos, mitigación, métricas), marcadores.
- **Paso a paso:**
  1) Equipos de 3–4 eligen problema y usuarios.
  2) Llenan secciones del lienzo con ejemplos concretos.
  3) Identifican al menos 2 riesgos y 2 mitigaciones.
  4) Preparan pitch de 2 minutos.
- **Qué observar:** concreción de datos y riesgos; si es muy vago, pedir ejemplos específicos.
- **Si falla:** ofrecer ideas semilla: «recordatorio de tareas con IA generativa», «sistema de alerta de comida que caduca en cafetería».

### Preguntas de chequeo
- ¿Qué datos necesitas y cómo los obtendrás respetando privacidad? → Datos mínimos, consentimiento, anonimización.
- ¿Qué riesgo de sesgo existe en tu solución? → Que solo funcione bien para cierto grupo; mitigación: datos diversos, revisión.
- ¿Cómo medirás el éxito? → Métrica clara (tiempo ahorrado, satisfacción, reducción de errores).

### Discusión
1) ¿Qué harías si tu modelo empieza a dar resultados injustos? → Pausar, revisar datos, ajustar o retirar.
2) ¿Cómo comunicarías a usuarios que tu solución usa IA? → Aviso claro, propósito, datos usados, opciones.
3) ¿Qué límites pondrías a la IA para evitar daño? → No decisiones finales sin revisión humana, no almacenar datos sensibles.

### Evaluación rápida (exit ticket) + clave
- Pregunta: «Escribe un riesgo y una mitigación concreta para tu proyecto.»
- Clave: riesgo específico (ej. sesgo hacia cierto grupo); mitigación (datos equilibrados, supervisión humana, opción de borrar datos).

### Tarea/opcional
- Completar el lienzo con más detalle y preparar una diapositiva resumen (título, problema, datos, riesgos, mitigación). **Criterio:** claridad y especificidad.

### Diferenciación
- **Apoyo:** ejemplos impresos de proyectos simples; plantillas con frases guía.
- **Extensión:** pedir plan de prueba A/B o experimento controlado para validar la idea.

### Materiales
Plantillas impresas o digitales, marcadores, temporizador, rúbrica de proyecto.

---
## Notas generales de gestión y seguridad
- Reforzar la cita de fuentes cuando se utilicen ejemplos de IA generativa. No compartir datos personales reales; usar datos ficticios o anonimizados.
- Si se usa internet, supervisar búsquedas para evitar contenido inapropiado; si no hay internet, usar materiales impresos incluidos.
- Mantener espacio para reflexión personal y apelación en debates o proyectos.

## VERIFICAR ENLACES
- Si se añaden videos/artículos externos específicos, validar vigencia y accesibilidad antes de clase.
