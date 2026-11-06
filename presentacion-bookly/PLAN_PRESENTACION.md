# Plan de diseño y comunicación — Presentación BOOKLY

## 1. Propósito de la presentación

Explicar, en 10 minutos, cómo BOOKLY organiza el negocio de citas y cómo el frontend web se convirtió en una aplicación Android funcional. La presentación debe servir como avance académico de Computación Móvil: cada diapositiva debe(/*Explicar*/) procurar una idea,.visualizarla y conectar con la siguiente.

## 2. Audiencia y dinámica

- **Audiencia:** docente y compañeros de Computación Móvil.
- **Ponentes:** tres personas, con bloques de 3, 4 y 3 minutos.
- **Formato:** exposición cronometrada con preguntas al final.
- **Criterio didáctico:** primero el problema, luego la lógica central, después la realización móvil y finalmente la evidencia.

## 3. Dirección visual

BOOKLY se presenta como un cuaderno de agenda de salón de belleza: papel cálido, tinta ciruela, terracota para acciones y verde salvia para resultados. El recurso memorable será una línea de tiempo/circuito de agenda que conecta servicio, profesional, hora y reserva.

### Paleta

- Tinta ciruela: `2E2438` — texto principal y fondos de transición.
- Ciruela atenuado: `6E5B7E` — texto secundario.
- Terracota quemada: `B4562F` — acciones y elementos activos.
- Verde salvia: `3F6B52` — resultados y validaciones.
- Papel: `F7F4EF` — fondo de contenido.
- Filete: `E3DCD2` — bordes y separadores.

### Tipografía

- **Georgia:** títulos; aporta el carácter editorial y cálido del cuaderno de citas.
- **Calibri:** cuerpo, datos y etiquetas; facilita la lectura en proyección.

### Principios

1. Una idea principal por diapositiva.
2. Diagramas antes que listas largas.
3. Números grandes para avances y evidencia.
4. Capturas reales de la app como prueba de funcionamiento.
5. Alternar layouts: portada editorial, agenda visual, diagrama, comparación, proceso, mockup, dashboard y cierre.
6. El guion se incluye como notas del ponente, no como texto saturado en pantalla.

## 4. Arquitectura visual y narrativa

| # | Diapositiva | Recurso principal | Idea didáctica |
|---:|---|---|---|
| 1 | Portada | Agenda/circuito de reservas y marca BOOKLY | BOOKLY es una app móvil de gestión de citas. |
| 2 | El problema | Antes/después con tres personas desconectadas | Centralizar coordina cliente, profesional y administración. |
| 3 | Tres roles | Mockup de teléfono con tres destinos | La misma experiencia se adapta a cada rol. |
| 4 | Alcance funcional | Capturas de admin, profesional y cliente | Los flujos principales están implementados de extremo a extremo. |
| 5 | Avances | Cuatro indicadores con iconos | APK, Android 14, 393 pruebas y UX móvil. |
| 6 | Reglas de negocio | Diagrama horario → disponibilidad → reserva | Una reserva depende de reglas, no solo de fecha y hora. |
| 7 | API en lenguaje llano | Diagrama cliente → API → reglas → respuesta | La API decide y explica el resultado. |
| 8 | Reserva paso a paso | Diagrama de 6 pasos con terminales | Se ve qué ocurre desde catálogo hasta confirmación. |
| 9 | Seguridad | Flujo de acceso por rol y MFA | Cada rol ve lo que le corresponde. |
| 10 | Web → Android | Diagrama build web → Capacitor → Gradle → APK | Se reutiliza el frontend y se añade una capa nativa. |
| 11 | APK verificable | Mockup de Android con estados nativos | La app integra teclado, atrás, red, status bar y safe areas. |
| 12 | UX móvil | Wireframes de barra “4 + Más” y control táctil | La interfaz está diseñada para el dedo y la pantalla pequeña. |
| 13 | Calidad | Dashboard 48 + 144 + 202 = 394 | La suite combina funciones, responsive y accesibilidad. |
| 14 | Errores encontrados | Antes/después de tres bugs | Las pruebas detectan fallos que la revisión visual no ve. |
| 15 | Estado y próximos pasos | Checklist y hoja de ruta | Lo terminado, lo pendiente y la siguiente iteración. |
| 16 | Conclusiones | Tres ideas y una pregunta final | Lógica centralizada, experiencia móvil real, calidad verificable. |

## 5. Imágenes y artefactos que se usarían

- `static/icons/icon-1024.png` como marca BOOKLY.
- Capturas de pantalla reales de la aplicación si están disponibles en `documentos/` o se generan durante la demo.
- Mockups vectoriales de teléfono creados en PowerPoint para explicar navegación, teclado y safe areas.
- Diagramas de proceso construidos con formas editables.
- Barras y cifras construidas con formas, no imágenes, para mantener legibilidad.

> Si no existe una captura visual de la app, se usará un wireframe de móvil claramente etiquetado como “representación de la interfaz” para no simular evidencia fotográfica.

## 6. Reglas de legibilidad

- Título: 27–32 pt; texto: 14–17 pt; notas al pie: 9 pt.
- Máximo cinco elementos principales por diapositiva.
- Los diagramas deben leerse de izquierda a derecha.
- Cada color debe tener una función semántica.
- No usar líneas decorativas bajo títulos ni gradients.
- Incluir numeración en todas las diapositivas excepto la portada.

## 7. Producción y QA

1. Crear una función por diapositiva y compilar con PptxGenJS.
2. Insertar notas del ponente con el guion correspondiente.
3. Extraer texto con MarkItDown para verificar orden y contenido.
4. Renderizar a PDF/PNG con LibreOffice y revisar visualmente todas las páginas.
5. Corregir desbordes, textos cortados, contraste y ausencia de marcadores.
6. Repetir la verificación final.
