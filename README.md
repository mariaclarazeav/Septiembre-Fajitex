# Tu Match Perfecto · Fajitex ✕ Polles Bakeshop

Landing interna de presentación para la colaboración de Amor y Amistad
(19 de septiembre). Público: Presidencia y equipos aliados. No es una
pieza de venta a cliente final: es el documento con el que se aprueba,
se ajusta o se devuelve la campaña con comentarios.

## Cómo está armado

`index.html` es un archivo generado. No lo edites a mano. Las fuentes son:

    src/cabeza.html   título, tipografías y hoja de estilos
    src/cuerpo.html   marcado de las siete secciones y el comportamiento
    construir.js      arma index.html a partir de las dos anteriores

Después de tocar cualquiera de las dos fuentes:

    node construir.js

El script verifica que la página siga siendo capaz de reconstruirse a sí
misma antes de escribir el archivo, y falla si algo se rompió.

## Por qué hay un paso de construcción

La sección 7 guarda las aprobaciones dentro del propio documento: cuando
alguien registra una decisión, la página se vuelve a publicar con esa
decisión adentro y todas las vistas abiertas se actualizan. Para eso la
página necesita llevar consigo su propia plantilla, escapada, dentro de
`<script id="fuente">`. `construir.js` es quien la incrusta.

Si la página se abre fuera del visor de Artifacts, o quien la abre solo
tiene permiso de lectura, las decisiones se guardan en el navegador de esa
persona y el botón «Copiar todas las decisiones» sirve para enviarlas.

## Las fotos

Van en `src/imagenes/`, con los nombres `hero`, `producto`, `detalle`,
`candid` y `talento` (ver `src/imagenes/LEEME.txt`). Después:

    node construir.js

El build las endereza según su EXIF, las reduce al ancho que la maqueta
necesita, las comprime y las incrusta como data URI. Van adentro del
archivo porque la política de seguridad del visor no deja que la página
pida imágenes a otro servidor.

Los marcos sin foto se quedan con su marcador de espacio, así que se
pueden ir subiendo de a una. El build avisa cuánto pesa la página y falla
si se acerca al límite de 16 MB.

## Lo que falta llenar

- Las cinco fotos.
- El porcentaje del descuento cruzado, en la sección 5, envío 3. Queda
  marcado como pendiente hasta que se apruebe la condición comercial.
