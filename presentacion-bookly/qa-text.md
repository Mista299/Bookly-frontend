<!-- Slide number: 1 -->

BOOKLY

9:41
Avances del proyecto
BOOKLY
Tu próxima cita

Una aplicación móvil para organizar citas, disponibilidad y reservas en salones de belleza.
14:30
Coloración

Reservar

Computación Móvil

Inicio
Servicios
Agenda
Perfil
2026-II  ·  Lógica de negocio + frontend Android
Equipo BOOKLY

### Notes:
Ponente 1 — 30 segundos. “Buenos días. Somos el equipo de BOOKLY y hoy vamos a presentar los avances de nuestro proyecto de Computación Móvil. BOOKLY es una aplicación orientada a la gestión de citas para salones de belleza y barberías. En esta oportunidad explicaremos qué hemos construido, cómo funciona la lógica de negocio y cómo conseguimos llevar el frontend hasta una aplicación Android instalable y firmada. La exposición tendrá aproximadamente diez minutos y la presentaremos entre los tres integrantes.”

<!-- Slide number: 2 -->
PUNTO DE PARTIDA
El problema: tres personas, una agenda dispersa

C

P

A
Cliente
Profesional
Administración
Busca un servicio y necesita una hora realmente libre.
Administra su horario y evita reservas superpuestas.
Configura servicios, usuarios y necesita trazabilidad.
Antes: llamadas, mensajes y cuadernos
Después: una agenda compartida

Una sola fuente de verdad para disponibilidad, reservas y permisos

02
BOOKLY · Problema y propuesta de valor

### Notes:
Ponente 1 — 1 minuto. “El problema que identificamos fue la gestión manual de las citas. Un cliente debía contactar al salón, el profesional debía coordinar su tiempo y el administrador no tenía una vista unificada. BOOKLY centraliza ese proceso. La aplicación maneja tres roles. El administrador configura servicios, profesionales, usuarios y consulta la auditoría. El profesional administra su horario y ve sus turnos. El cliente explora el catálogo, consulta disponibilidad y realiza o cancela reservas. El valor principal es que la lógica de negocio no queda repartida entre formularios: existe una fuente central de información que mantiene consistentes la disponibilidad, las reservas y los permisos.”

<!-- Slide number: 3 -->
ALCANCE FUNCIONAL
Una app, tres experiencias según el rol

Administrador
Profesional
Cliente
Servicios y profesionales
Turnos de hoy
Catálogo de servicios

✓

✓

✓
Agenda global
Agenda de citas
Detalle y profesionales

✓

✓

✓
Usuarios, roles y auditoría
Horario semanal
Disponibilidad real

✓

✓

✓
Perfil y seguridad
Perfil
Reservas y cancelaciones

✓

✓

✓
Acceso común: registro · login · MFA · cambio de contraseña · cierre de sesión

03
BOOKLY · Alcance funcional implementado

### Notes:
Ponente 1 — 1 minuto y 30 segundos. “En esta diapositiva podemos observar el alcance funcional alcanzado. Para el administrador ya existen la administración de servicios y profesionales, la consulta de la agenda, la gestión de usuarios y roles, la auditoría y las opciones de seguridad. Para el profesional están la agenda, la gestión del horario semanal y el seguimiento de turnos. El cliente dispone del catálogo, el detalle de cada servicio, la disponibilidad y la gestión de sus reservas. Todas las áreas comparten el mismo acceso seguro, incluyendo registro, inicio de sesión, autenticación en dos pasos para administradores, cambio de contraseña y cierre de sesión. Es decir, no tenemos pantallas aisladas: hay un flujo completo por rol y una lógica transversal de seguridad.”

<!-- Slide number: 4 -->
ESTADO FUNCIONAL
Los flujos principales ya trabajan de extremo a extremo

Administrador
Profesional
Cliente

Resumen
Hoy
Inicio

Servicios
Agenda
Servicios
Usuarios
Horario
Agenda
Auditoría
Turnos
Perfil

Configura y supervisa
Organiza su tiempo
Encuentra y reserva
La misma base de negocio alimenta las tres experiencias

04
BOOKLY · Flujos por rol

### Notes:
Ponente 1 — 1 minuto y 30 segundos. “En esta diapositiva podemos observar el alcance funcional alcanzado. Para el administrador ya existen la administración de servicios y profesionales, la consulta de la agenda, la gestión de usuarios y roles, la auditoría y las opciones de seguridad. Para el profesional están la agenda, la gestión del horario semanal y el seguimiento de turnos. El cliente dispone del catálogo, el detalle de cada servicio, la disponibilidad y la gestión de sus reservas. Todas las áreas comparten el mismo acceso seguro, incluyendo registro, inicio de sesión, autenticación en dos pasos para administradores, cambio de contraseña y cierre de sesión. Es decir, no tenemos pantallas aisladas: hay un flujo completo por rol y una lógica transversal de seguridad.”

<!-- Slide number: 5 -->
RESUMEN DE ENTREGABLES
Cuatro avances que ya son verificables

01
02
03
04
APK
14
393
44
Aplicación Android
Android verificado
Pruebas aprobadas
Controles táctiles
APK firmado y AAB generado
Instalación y arranque en dispositivo
1 omitida · suite E2E
Safe areas y navegación adaptable
La evidencia combina producto instalable, dispositivo real, automatización y diseño táctil.

05
BOOKLY · Avances destacados

### Notes:
Ponente 1 — 30 segundos. “Los avances más relevantes se pueden resumir en cuatro frentes. Primero, la aplicación ya funciona como APK Android firmado y también genera el formato AAB. Segundo, fue instalada y verificada en un dispositivo con Android 14. Tercero, implementamos una suite automatizada con 393 pruebas aprobadas y una omitida. Y cuarto, cerramos los detalles que normalmente afectan la experiencia móvil: áreas seguras, teclado, botón atrás, navegación, tamaños táctiles y conectividad. El siguiente ponente explicará cómo se coordina la lógica de negocio detrás de estas pantallas.”

<!-- Slide number: 6 -->
LÓGICA DE NEGOCIO
Una reserva depende de reglas, no solo de fecha y hora

1

2

3

4

Horario
Disponibilidad
Reserva
Agenda
El profesional define sus franjas semanales.
El sistema cruza servicio, duración y reservas.
El cliente elige un espacio realmente libre.
Las partes ven la cita y queda auditada.

Si el horario cambia o se ocupa mientras el cliente decide, la API vuelve a validarlo y evita una reserva inválida.

06
BOOKLY · La reserva como proceso central

### Notes:
Ponente 2 — 1 minuto. “La lógica de negocio puede entenderse a partir de una decisión principal: una reserva nunca es simplemente un registro con fecha y hora. Primero debe existir un horario vigente del profesional. Sobre ese horario, el sistema calcula la disponibilidad de un servicio concreto, descuenta las reservas existentes y bloquea los intervalos que no cumplen las reglas. Cuando el cliente selecciona un espacio disponible, el sistema crea una reserva asociada al servicio, al profesional y al cliente. Esa reserva actualiza la agenda de las partes involucradas y queda reflejada en la auditoría. Si el cliente cancela, el espacio vuelve a quedar disponible de acuerdo con las reglas del sistema.”

<!-- Slide number: 7 -->
REGLAS EN LENGUAJE LLANO
La API decide y explica el resultado

1
2
3
Solicitud
Reglas
Respuesta
La app envía la acción del usuario y su sesión vigente.
La API comprueba horario, anticipación, disponibilidad, rol y conflictos.
La interfaz recibe datos actualizados o un motivo comprensible.

Éxito → actualizar agenda
Error → explicar y refrescar
Ejemplo: “quiero reservar 14:30”
La app no decide la agenda.
Ejemplo: “ese horario ya no está disponible; elige otro”

07
BOOKLY · Funcionamiento de la API

### Notes:
Ponente 2 — 1 minuto y 30 segundos. “La API concentra las reglas que protegen la operación. En primer lugar, la disponibilidad se calcula combinando el horario semanal del profesional, la duración del servicio y las reservas ya ocupadas. De esta forma, la pantalla no inventa horas disponibles. En segundo lugar, cuando una reserva entra en conflicto —por ejemplo, porque otra persona tomó el mismo horario en ese momento— el sistema rechaza la operación y la interfaz informa que debe elegir otro espacio. En tercer lugar, cada reserva se encuentra vinculada a sus participantes. Cada rol consulta únicamente las reservas que le corresponden, y las acciones sensibles están protegidas. Finalmente, las operaciones importantes quedan registradas para que el administrador pueda auditar qué ocurrió, quién lo hizo y sobre qué recurso. La API no solo guarda datos; aplica las reglas que mantienen coherente la agenda.”

<!-- Slide number: 8 -->
RECORRIDO DEL CLIENTE
Así se ve una reserva real, paso a paso

Regla visible: mínimo 2 horas de anticipación

Explorar
Elegir
Consultar

1

2

3
El cliente abre el catálogo y filtra servicios.
Selecciona un servicio y el profesional disponible.
La API devuelve solo horarios realmente libres.

Confirmar
Validar
Sincronizar

4

5

6
La app envía servicio, profesional, inicio y fin.
La API comprueba reglas y conflictos en ese instante.
La cita aparece en ambas agendas y en auditoría.

08
BOOKLY · Flujo de reserva

### Notes:
Ponente 2 — 1 minuto. “Desde el punto de vista del frontend, el intercambio con la API sigue siempre el mismo camino. La aplicación envía la acción del usuario junto con la sesión vigente. El backend aplica las reglas de negocio y devuelve un resultado comprensible. Cuando la operación es exitosa, la respuesta contiene la información actualizada y la interfaz refresca la vista afectada. Cuando no es posible realizarla, la API explica el motivo, por ejemplo, horario ocupado, conflicto de horario, acceso no autorizado o cuenta bloqueada. El frontend traduce ese resultado a mensajes comprensibles, evita repetir una acción inválida y mantiene la interfaz sincronizada. En el caso de una reserva, los estados posibles son pendiente, confirmada y cancelada. La interfaz refleja esta transición, pero es la API quien protege la transición y sus consecuencias.”

<!-- Slide number: 9 -->
AUTENTICACIÓN Y PERMISOS
El acceso se adapta al rol y protege la sesión

1

2

3

Validar
Proteger
Enrutar
Correo y contraseña
MFA para administración
Cada rol ve su módulo

Administrador
Servicios · Usuarios
Auditoría
Profesional
Agenda · Horario
Turnos
Cliente
Catálogo · Disponibilidad
Reservas
La sesión se conserva en el dispositivo; si caduca, se limpia y vuelve al login sin afectar la app.

09
BOOKLY · Autenticación y manejo de sesión

### Notes:
Ponente 2 — 30 segundos. “El acceso también sigue una lógica centralizada. Primero se validan las credenciales; después se determina el rol y se muestra la sección correspondiente. Para cuentas administrativas se exige un segundo factor, y para usuarios que ya enrolaron su dispositivo existe la opción de confiar en él. En el móvil, la sesión se conserva localmente para no pedir el ingreso repetidamente. Si el token deja de ser válido, el frontend limpia la sesión y dirige al usuario al acceso sin afectar los datos ya descargados. Además, se corrigió un detalle importante: un error de contraseña durante el cambio de contraseña ya no expulsa al usuario.”

<!-- Slide number: 10 -->
CAPACITOR
Del frontend web a Android sin reescribir la app

1

2

3

4

Build web
Capacitor
Gradle
Android
SPA estática
Sincroniza
Empaqueta
APK / AAB

Lo que se conserva
Lo que se agrega
SvelteKit · Svelte · TypeScript · SCSS
WebView nativo · plugins · firma · distribución
Resultado: un APK universal firmado y un AAB preparado para Google Play.

10
BOOKLY · Del frontend web a Android

### Notes:
Ponente 3 — 1 minuto. “Para llevar el proyecto a Android elegimos usar Capacitor. Esta tecnología conserva el desarrollo web ya construido y lo integra dentro de un contenedor nativo, evitando reescribir la aplicación completa. El flujo de construcción tiene tres pasos: primero se genera la versión web estática; luego Capacitor sincroniza ese resultado con el proyecto Android; finalmente, Gradle produce el APK de depuración, el APK firmado de distribución o el AAB requerido por Google Play. Como el APK no tiene un servidor web tradicional, la aplicación se ejecuta como una SPA dentro del WebView nativo y toda la lógica de presentación ocurre en el cliente. La capa nativa aporta las capacidades que el navegador por sí solo no ofrece.”

<!-- Slide number: 11 -->
CAPACIDADES NATIVAS
La app se integra con el dispositivo, no solo se empaqueta

S

Status bar
Identidad visual de marca

BOOKLY

T
Teclado nativo
Los inputs no quedan tapados

14:30

←
Botón atrás
Navega o sale en la raíz

Reservar

W
Red
Aviso visible sin conexión
←

A
Safe areas
Respeta muesca y gestos
Representación de la interfaz móvil

11
BOOKLY · Integración con el dispositivo

### Notes:
Ponente 3 — 1 minuto. “El trabajo móvil no consiste únicamente en generar el APK. Para que la aplicación se sienta nativa integramos Capacitor con cinco capacidades concretas. Primero, la barra de estado adopta la identidad visual de BOOKLY. Segundo, el teclado se redimensiona de manera nativa para no tapar los campos. Tercero, el botón físico o gestual de Android recorre el historial de la aplicación y solo permite salir cuando el usuario está en la pantalla principal. Cuarto, se informa claramente cuando el dispositivo no tiene conexión. Y quinto, los componentes respetan las safe areas, de modo que la navegación no queda debajo de la muesca ni de la barra de gestos. También se empaquetaron las fuentes dentro de la aplicación para que la interfaz conserve su apariencia incluso sin acceso a servicios externos.”

<!-- Slide number: 12 -->
UX MÓVIL
Diseñar para el dedo, no para una pantalla grande

44 × 44
Antes: 7 destinos en 360 px
Tamaño mínimo de cada control táctil
px

Resumen
Servicios
Profes.
Usuarios
Auditoría
Agenda
Ajustes

AA
Contraste verificado en textos y estados
WCAG
Ilegible y sin espacio para respirar

Después: 4 destinos + Más
6
Desde 320 px hasta escritorio
anchos

Inicio
Agenda
Turnos
Más
La meta era que se sintiera diseñada para el celular, no reducida desde el sitio.

12
BOOKLY · Diseño móvil

### Notes:
Ponente 3 — 1 minuto. “También ajustamos el diseño al uso táctil. En pantallas pequeñas, la barra del administrador ya no intentaba mostrar sus siete secciones. Ahora presenta cuatro destinos principales y un acceso llamado ‘Más’, donde permanecen las opciones secundarias. Todos los controles interactivos principales alcanzan al menos 44 por 44 píxeles, una medida adecuada para evitar errores de toque. Además, se corrigieron los colores que no cumplían el contraste AA y se verificó la interfaz en seis anchos representativos, desde teléfonos compactos hasta escritorio. El objetivo era que la aplicación se sintiera como una experiencia diseñada para el celular, y no como una versión reducida del sitio.”

<!-- Slide number: 13 -->
AUTOMATIZACIÓN
La calidad se comprueba con 394 casos E2E

48
144
202
+
+
Funcionales
Responsive
Accesibilidad
Flujos reales por rol y reserva completa
24 rutas × 6 tamaños reales de pantalla
Contraste, foco, jerarquía y nombres accesibles

394 casos en total  →  393 aprobados  +  1 omitido

13
BOOKLY · Calidad y pruebas

### Notes:
Ponente 3 — 1 minuto. “La calidad se validó de forma automatizada y reproducible. La suite final tiene 393 pruebas aprobadas y una omitida. No se trata de pruebas que siempre pasan: cada caso verifica un comportamiento observable. La cobertura funcional atraviesa los flujos de autenticación, administración, profesionales y clientes. A esto se suman 144 casos de comportamiento responsive y 202 casos de accesibilidad, incluyendo contraste, estructura, navegación por teclado, nombres accesibles y tamaño de las áreas táctiles. Además, el APK firmado se comprobó con las herramientas oficiales de Android para confirmar la firma y la alineación del paquete. También se verificó la instalación y el arranque en un dispositivo con Android 14.”

<!-- Slide number: 14 -->
ERRORES Y MITIGACIONES
Las pruebas encontraron fallos que la vista no mostraba

Sesión recién iniciada
Solo se cierra si el token fallido sigue vigente.

Un 401 antiguo cerraba el login.

Cambio de contraseña
Error visible sin cerrar la sesión.

Contraseña incorrecta expulsaba al admin.

Auditoría
Fechas normalizadas con zona horaria.

El filtro de fecha provocaba HTTP 400.
7 errores reales del frontend corregidos
Las incidencias del backend quedaron documentadas; cuando fue posible, el frontend las toleró sin interrumpir la experiencia.

14
BOOKLY · Errores encontrados

### Notes:
Ponente 3 — 1 minuto. “Las pruebas también sirvieron para encontrar errores reales. Por ejemplo, detectamos que una respuesta 401 de una petición antigua podía cerrar una sesión que acababa de iniciarse. También se corrigió el caso en que una contraseña actual incorrecta expulsaba al administrador, y se ajustó el formato de las fechas de auditoría que impedía mostrar resultados. También identificamos inconsistencias que corresponden al backend, como la ausencia de ciertos códigos de bloqueo y de nombres de servicio o profesional en la respuesta de reservas. Esas se documentaron y, cuando fue posible, el frontend las toleró para que la experiencia no se interrumpiera. Este balance es importante: la automatización no solo demuestra que las cosas funcionan; también revela dónde debe mejorar el sistema completo.”

<!-- Slide number: 15 -->
ESTADO Y HOJA DE RUTA
Qué queda listo y cuál es el siguiente paso

Completado
Próximos pasos
APK firmado + AAB
Verificación en Android 14
Flujos principales por rol
Responsive y accesibilidad
393 pruebas E2E aprobadas
Publicación en Google Play
Pruebas con usuarios reales
Más dispositivos y gamas Android
Resolver incidencias de la API
Métricas de uso y calidad

Pendiente clave: reprogramar reservas

15
BOOKLY · Estado actual y próximos pasos

### Notes:
Ponente 3 — 30 segundos. “El estado actual es que tenemos el frontend móvil completo para los flujos principales, un APK firmado, el AAB, pruebas automatizadas y validación real en Android 14. Como próximos pasos debemos preparar la publicación en Google Play, realizar pruebas con usuarios reales y ampliar la variedad de dispositivos. También queremos cerrar las inconsistencias de la API señaladas por la suite y definir métricas de uso y calidad para orientar la siguiente iteración.”

<!-- Slide number: 16 -->
Tres ideas para recordar
BOOKLY · Avances del proyecto

01
02
03
Lógica centralizada
Experiencia móvil real
Calidad verificable
La API protege disponibilidad, reservas, permisos y trazabilidad.
La app integra Android y fue verificada en un dispositivo.
393 pruebas y artefactos listos para distribución.
¿Preguntas?

16
BOOKLY · Conclusiones

### Notes:
Ponente 1 — 45 segundos. “Para cerrar, destacamos tres ideas. Primero, la lógica de negocio está centralizada: disponibilidad, reservas, permisos y auditoría responden a reglas consistentes. Segundo, el resultado no es solamente un sitio web adaptado: es una aplicación Android que integra el dispositivo y fue verificada en un entorno real. Y tercero, la calidad es verificable, con 393 pruebas aprobadas, validación de accesibilidad y artefactos listos para continuar el proceso de distribución. Con esto culminamos la presentación. Gracias por su atención.”
