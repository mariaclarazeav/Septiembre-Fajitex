/*
 * Arma index.html a partir de src/cabeza.html y src/cuerpo.html.
 *
 * La pagina se publica dos veces con formas distintas:
 *   1. Como fragmento, que es lo que espera la herramienta de Artifacts
 *      (ella pone doctype, html, head y body alrededor).
 *   2. Como documento completo, que es lo que la pagina se publica a si
 *      misma cuando alguien registra una decision.
 *
 * Por eso el fragmento lleva adentro, escapada, la plantilla del documento
 * completo: es la fuente con la que la pagina se reconstruye sin tener que
 * serializar el DOM vivo.
 */
const fs = require("fs");
const path = require("path");

const raiz = __dirname;
const cabeza = fs.readFileSync(path.join(raiz, "src/cabeza.html"), "utf8").trim();
const cuerpo = fs.readFileSync(path.join(raiz, "src/cuerpo.html"), "utf8").trim();

const estadoInicial = { decisiones: {} };

const fragmento = cabeza + "\n\n" + cuerpo + "\n";

const documento =
  "<!doctype html>\n" +
  '<html lang="es">\n' +
  "<head>\n" +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  cabeza + "\n" +
  "</head>\n" +
  "<body>\n" +
  cuerpo + "\n" +
  "</body>\n" +
  "</html>\n";

function escaparFuente(texto) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function pintar(fuente, estado) {
  const json = JSON.stringify(estado).replace(/</g, "\\u003c");
  return fuente
    .replace("{{ESTADO}}", () => json)
    .replace("{{FUENTE}}", () => escaparFuente(documento));
}

const salida = pintar(fragmento, estadoInicial);
fs.writeFileSync(path.join(raiz, "index.html"), salida);

/* Verificaciones: la plantilla interna tiene que poder reconstruir la pagina */
function desescapar(texto) {
  return texto.replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}

const problemas = [];

if (!salida.includes('type="application/json">{"decisiones":{}}<')) {
  problemas.push("el estado inicial no quedo embebido como JSON");
}
if ((salida.match(/<\/script>/g) || []).length !== 3) {
  problemas.push("el conteo de cierres de script no es 3, la fuente escapada se esta rompiendo el marcado");
}

/* Simula lo que hace el navegador: leer #fuente y volver a pintar la pagina */
const marca = 'id="fuente" type="text/plain">';
const desde = salida.indexOf(marca) + marca.length;
const hasta = salida.indexOf("</script>", desde);
const plantillaLeida = desescapar(salida.slice(desde, hasta));

if (plantillaLeida !== documento) {
  problemas.push("la plantilla que leeria el navegador no coincide con el documento completo");
}

const primeraVuelta = pintar(plantillaLeida, { decisiones: { alianza: [{ id: "x", nombre: "Prueba", voto: "si", comentario: "", fecha: "2026-09-01T12:00:00.000Z" }] } });
const marcaDos = 'id="fuente" type="text/plain">';
const desdeDos = primeraVuelta.indexOf(marcaDos) + marcaDos.length;
const hastaDos = primeraVuelta.indexOf("</script>", desdeDos);
const plantillaDos = desescapar(primeraVuelta.slice(desdeDos, hastaDos));

if (plantillaDos !== documento) {
  problemas.push("la plantilla no sobrevive a una republicacion, el ciclo de guardado se rompe en la segunda vuelta");
}
if (!primeraVuelta.startsWith("<!doctype html>")) {
  problemas.push("la republicacion no empieza con doctype y el runtime la rechazaria");
}

console.log("index.html: " + salida.length + " bytes (plantilla interna: " + documento.length + " bytes)");
