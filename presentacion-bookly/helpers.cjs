const pptxgen = require('pptxgenjs');

const FONT_HEAD = 'Georgia';
const FONT_BODY = 'Calibri';
const W = 10;
const H = 5.625;

const theme = {
  primary: '2E2438',
  secondary: '6E5B7E',
  accent: 'B4562F',
  light: 'E3DCD2',
  bg: 'F7F4EF'
};

const notes = {
  1: 'Ponente 1 — 30 segundos. “Buenos días. Somos el equipo de BOOKLY y hoy vamos a presentar los avances de nuestro proyecto de Computación Móvil. BOOKLY es una aplicación orientada a la gestión de citas para salones de belleza y barberías. En esta oportunidad explicaremos qué hemos construido, cómo funciona la lógica de negocio y cómo conseguimos llevar el frontend hasta una aplicación Android instalable y firmada. La exposición tendrá aproximadamente diez minutos y la presentaremos entre los tres integrantes.”',
  2: 'Ponente 1 — 1 minuto. “El problema que identificamos fue la gestión manual de las citas. Un cliente debía contactar al salón, el profesional debía coordinar su tiempo y el administrador no tenía una vista unificada. BOOKLY centraliza ese proceso. La aplicación maneja tres roles. El administrador configura servicios, profesionales, usuarios y consulta la auditoría. El profesional administra su horario y ve sus turnos. El cliente explora el catálogo, consulta disponibilidad y realiza o cancela reservas. El valor principal es que la lógica de negocio no queda repartida entre formularios: existe una fuente central de información que mantiene consistentes la disponibilidad, las reservas y los permisos.”',
  3: 'Ponente 1 — 1 minuto y 30 segundos. “En esta diapositiva podemos observar el alcance funcional alcanzado. Para el administrador ya existen la administración de servicios y profesionales, la consulta de la agenda, la gestión de usuarios y roles, la auditoría y las opciones de seguridad. Para el profesional están la agenda, la gestión del horario semanal y el seguimiento de turnos. El cliente dispone del catálogo, el detalle de cada servicio, la disponibilidad y la gestión de sus reservas. Todas las áreas comparten el mismo acceso seguro, incluyendo registro, inicio de sesión, autenticación en dos pasos para administradores, cambio de contraseña y cierre de sesión. Es decir, no tenemos pantallas aisladas: hay un flujo completo por rol y una lógica transversal de seguridad.”',
  4: 'Ponente 1 — 30 segundos. “Los avances más relevantes se pueden resumir en cuatro frentes. Primero, la aplicación ya funciona como APK Android firmado y también genera el formato AAB. Segundo, fue instalada y verificada en un dispositivo con Android 14. Tercero, implementamos una suite automatizada con 393 pruebas aprobadas y una omitida. Y cuarto, cerramos los detalles que normalmente afectan la experiencia móvil: áreas seguras, teclado, botón atrás, navegación, tamaños táctiles y conectividad. El siguiente ponente explicará cómo se coordina la lógica de negocio detrás de estas pantallas.”',
  5: 'Ponente 2 — 1 minuto. “La lógica de negocio puede entenderse a partir de una decisión principal: una reserva nunca es simplemente un registro con fecha y hora. Primero debe existir un horario vigente del profesional. Sobre ese horario, el sistema calcula la disponibilidad de un servicio concreto, descuenta las reservas existentes y bloquea los intervalos que no cumplen las reglas. Cuando el cliente selecciona un espacio disponible, el sistema crea una reserva asociada al servicio, al profesional y al cliente. Esa reserva actualiza la agenda de las partes involucradas y queda reflejada en la auditoría. Si el cliente cancela, el espacio vuelve a quedar disponible de acuerdo con las reglas del sistema.”',
  6: 'Ponente 2 — 1 minuto y 30 segundos. “La API concentra las reglas que protegen la operación. En primer lugar, la disponibilidad se calcula combinando el horario semanal del profesional, la duración del servicio y las reservas ya ocupadas. De esta forma, la pantalla no inventa horas disponibles. En segundo lugar, cuando una reserva entra en conflicto —por ejemplo, porque otra persona tomó el mismo horario en ese momento— el sistema rechaza la operación y la interfaz informa que debe elegir otro espacio. En tercer lugar, cada reserva se encuentra vinculada a sus participantes. Cada rol consulta únicamente las reservas que le corresponden, y las acciones sensibles están protegidas. Finalmente, las operaciones importantes quedan registradas para que el administrador pueda auditar qué ocurrió, quién lo hizo y sobre qué recurso. La API no solo guarda datos; aplica las reglas que mantienen coherente la agenda.”',
  7: 'Ponente 2 — 1 minuto. “Desde el punto de vista del frontend, el intercambio con la API sigue siempre el mismo camino. La aplicación envía la acción del usuario junto con la sesión vigente. El backend aplica las reglas de negocio y devuelve un resultado comprensible. Cuando la operación es exitosa, la respuesta contiene la información actualizada y la interfaz refresca la vista afectada. Cuando no es posible realizarla, la API explica el motivo, por ejemplo, horario ocupado, conflicto de horario, acceso no autorizado o cuenta bloqueada. El frontend traduce ese resultado a mensajes comprensibles, evita repetir una acción inválida y mantiene la interfaz sincronizada. En el caso de una reserva, los estados posibles son pendiente, confirmada y cancelada. La interfaz refleja esta transición, pero es la API quien protege la transición y sus consecuencias.”',
  8: 'Ponente 2 — 30 segundos. “El acceso también sigue una lógica centralizada. Primero se validan las credenciales; después se determina el rol y se muestra la sección correspondiente. Para cuentas administrativas se exige un segundo factor, y para usuarios que ya enrolaron su dispositivo existe la opción de confiar en él. En el móvil, la sesión se conserva localmente para no pedir el ingreso repetidamente. Si el token deja de ser válido, el frontend limpia la sesión y dirige al usuario al acceso sin afectar los datos ya descargados. Además, se corrigió un detalle importante: un error de contraseña durante el cambio de contraseña ya no expulsa al usuario.”',
  9: 'Ponente 3 — 1 minuto. “Para llevar el proyecto a Android elegimos usar Capacitor. Esta tecnología conserva el desarrollo web ya construido y lo integra dentro de un contenedor nativo, evitando reescribir la aplicación completa. El flujo de construcción tiene tres pasos: primero se genera la versión web estática; luego Capacitor sincroniza ese resultado con el proyecto Android; finalmente, Gradle produce el APK de depuración, el APK firmado de distribución o el AAB requerido por Google Play. Como el APK no tiene un servidor web tradicional, la aplicación se ejecuta como una SPA dentro del WebView nativo y toda la lógica de presentación ocurre en el cliente. La capa nativa aporta las capacidades que el navegador por sí solo no ofrece.”',
  10: 'Ponente 3 — 1 minuto. “El trabajo móvil no consiste únicamente en generar el APK. Para que la aplicación se sienta nativa integramos Capacitor con cinco capacidades concretas. Primero, la barra de estado adopta la identidad visual de BOOKLY. Segundo, el teclado se redimensiona de manera nativa para no tapar los campos. Tercero, el botón físico o gestual de Android recorre el historial de la aplicación y solo permite salir cuando el usuario está en la pantalla principal. Cuarto, se informa claramente cuando el dispositivo no tiene conexión. Y quinto, los componentes respetan las safe areas, de modo que la navegación no queda debajo de la muesca ni de la barra de gestos. También se empaquetaron las fuentes dentro de la aplicación para que la interfaz conserve su apariencia incluso sin acceso a servicios externos.”',
  11: 'Ponente 3 — 1 minuto. “También ajustamos el diseño al uso táctil. En pantallas pequeñas, la barra del administrador ya no intentaba mostrar sus siete secciones. Ahora presenta cuatro destinos principales y un acceso llamado ‘Más’, donde permanecen las opciones secundarias. Todos los controles interactivos principales alcanzan al menos 44 por 44 píxeles, una medida adecuada para evitar errores de toque. Además, se corrigieron los colores que no cumplían el contraste AA y se verificó la interfaz en seis anchos representativos, desde teléfonos compactos hasta escritorio. El objetivo era que la aplicación se sintiera como una experiencia diseñada para el celular, y no como una versión reducida del sitio.”',
  12: 'Ponente 3 — 1 minuto. “La calidad se validó de forma automatizada y reproducible. La suite final tiene 393 pruebas aprobadas y una omitida. No se trata de pruebas que siempre pasan: cada caso verifica un comportamiento observable. La cobertura funcional atraviesa los flujos de autenticación, administración, profesionales y clientes. A esto se suman 144 casos de comportamiento responsive y 202 casos de accesibilidad, incluyendo contraste, estructura, navegación por teclado, nombres accesibles y tamaño de las áreas táctiles. Además, el APK firmado se comprobó con las herramientas oficiales de Android para confirmar la firma y la alineación del paquete. También se verificó la instalación y el arranque en un dispositivo con Android 14.”',
  13: 'Ponente 3 — 1 minuto. “Las pruebas también sirvieron para encontrar errores reales. Por ejemplo, detectamos que una respuesta 401 de una petición antigua podía cerrar una sesión que acababa de iniciarse. También se corrigió el caso en que una contraseña actual incorrecta expulsaba al administrador, y se ajustó el formato de las fechas de auditoría que impedía mostrar resultados. También identificamos inconsistencias que corresponden al backend, como la ausencia de ciertos códigos de bloqueo y de nombres de servicio o profesional en la respuesta de reservas. Esas se documentaron y, cuando fue posible, el frontend las toleró para que la experiencia no se interrumpiera. Este balance es importante: la automatización no solo demuestra que las cosas funcionan; también revela dónde debe mejorar el sistema completo.”',
  14: 'Ponente 3 — 30 segundos. “El estado actual es que tenemos el frontend móvil completo para los flujos principales, un APK firmado, el AAB, pruebas automatizadas y validación real en Android 14. Como próximos pasos debemos preparar la publicación en Google Play, realizar pruebas con usuarios reales y ampliar la variedad de dispositivos. También queremos cerrar las inconsistencias de la API señaladas por la suite y definir métricas de uso y calidad para orientar la siguiente iteración.”',
  15: 'Ponente 1 — 45 segundos. “Para cerrar, destacamos tres ideas. Primero, la lógica de negocio está centralizada: disponibilidad, reservas, permisos y auditoría responden a reglas consistentes. Segundo, el resultado no es solamente un sitio web adaptado: es una aplicación Android que integra el dispositivo y fue verificada en un entorno real. Y tercero, la calidad es verificable, con 393 pruebas aprobadas, validación de accesibilidad y artefactos listos para continuar el proceso de distribución. Con esto culminamos la presentación. Gracias por su atención.”'
};

function addNotes(slide, n) {
  slide.addNotes(notes[n] || '');
}

function addBadge(slide, pres, theme, n, dark = false) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 9.12, y: 5.13, w: 0.55, h: 0.3,
    rectRadius: 0.12,
    fill: { color: dark ? theme.light : theme.primary },
    line: { color: dark ? theme.light : theme.primary }
  });
  slide.addText(String(n).padStart(2, '0'), {
    x: 9.12, y: 5.13, w: 0.55, h: 0.3,
    margin: 0, align: 'center', valign: 'mid',
    fontFace: FONT_BODY, fontSize: 10, bold: true,
    color: dark ? theme.primary : theme.bg
  });
}

function addTitle(slide, pres, theme, title, kicker) {
  if (kicker) {
    slide.addText(kicker.toUpperCase(), {
      x: 0.55, y: 0.35, w: 8.6, h: 0.24,
      margin: 0, fontFace: FONT_BODY, fontSize: 9.5, bold: true,
      charSpacing: 1.6, color: theme.accent
    });
  }
  slide.addText(title, {
    x: 0.55, y: kicker ? 0.62 : 0.42, w: 8.7, h: 0.62,
    margin: 0, fontFace: FONT_HEAD, fontSize: 27, bold: true,
    color: theme.primary, fit: 'shrink', breakLine: false
  });
}

function addCard(slide, pres, theme, x, y, w, h, opts = {}) {
  const fill = opts.fill || 'FFFFFF';
  const line = opts.line || theme.light;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: opts.radius ?? 0.14,
    fill: { color: fill, transparency: opts.transparency || 0 },
    line: { color: line, width: opts.lineWidth || 1 },
    shadow: opts.shadow === false ? undefined : { type: 'outer', color: '000000', blur: 3, offset: 1, angle: 135, opacity: 0.08 }
  });
}

function addCircle(slide, pres, theme, x, y, d, color, text, textColor = 'FFFFFF', fs = 15) {
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: d, h: d,
    fill: { color }, line: { color }
  });
  if (text !== undefined) {
    slide.addText(text, {
      x, y, w: d, h: d, margin: 0,
      fontFace: FONT_BODY, fontSize: fs, bold: true,
      color: textColor, align: 'center', valign: 'mid'
    });
  }
}

function addBulletList(slide, items, opts = {}) {
  const runs = [];
  items.forEach((item, i) => {
    runs.push({
      text: item,
      options: {
        bullet: { indent: 13 },
        hanging: 4,
        breakLine: i < items.length - 1,
        paraSpaceAfterPt: opts.gap ?? 8
      }
    });
  });
  slide.addText(runs, {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    margin: 0, fontFace: FONT_BODY, fontSize: opts.fs || 14,
    color: opts.color || theme.secondary, breakLine: false,
    valign: opts.valign || 'top', fit: 'shrink'
  });
}

function addFooter(slide, pres, theme, label, n, dark = false) {
  slide.addText(label || 'BOOKLY · Computación Móvil · 2026-II', {
    x: 0.55, y: 5.17, w: 5.5, h: 0.18,
    margin: 0, fontFace: FONT_BODY, fontSize: 8.5,
    color: dark ? theme.light : theme.secondary
  });
  addBadge(slide, pres, theme, n, dark);
}

function makeSlide(pres, theme, n, dark = false) {
  const slide = pres.addSlide();
  slide.background = { color: dark ? theme.primary : theme.bg };
  return slide;
}

module.exports = {
  pptxgen, theme, notes, addNotes, addBadge, addTitle, addCard,
  addCircle, addBulletList, addFooter, makeSlide,
  FONT_HEAD, FONT_BODY, W, H
};
