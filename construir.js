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
const { execFileSync } = require("child_process");

const raiz = __dirname;
const cabeza = fs.readFileSync(path.join(raiz, "src/cabeza.html"), "utf8").trim();
let cuerpo = fs.readFileSync(path.join(raiz, "src/cuerpo.html"), "utf8").trim();

/* ---- Fotos: van incrustadas porque el visor no deja pedirlas a otro servidor ---- */
const fotos = JSON.parse(
  execFileSync("python3", [path.join(raiz, "herramientas/imagenes.py")], { encoding: "utf8" })
);

function textoPlano(html) {
  return html.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

const puestas = [];
const faltantes = [];
cuerpo = cuerpo.replace(/[ \t]*<!--imagen:([a-z]+)-->\n([\s\S]*?)[ \t]*<!--\/imagen-->\n/g, (todo, nombre, bloque) => {
  const foto = fotos[nombre];
  if (!foto) {
    faltantes.push(nombre);
    return bloque;
  }
  const que = (bloque.match(/class="marco__que">([\s\S]*?)<\/p>/) || [, nombre])[1];
  const spec = (bloque.match(/class="marco__spec">([\s\S]*?)<\/p>/) || [, ""])[1];
  const alt = textoPlano(que) + ". " + textoPlano(spec);
  puestas.push(nombre + " (" + foto.origen + ", " + Math.round(foto.bytes / 1024) + " kB)");
  const sangria = todo.match(/^[ \t]*/)[0];
  /* La tira de portada se muestra completa: toma la proporcion real del archivo
     en vez de la que trae la maqueta, para que nunca se recorte. */
  const razon = nombre === "hero" ? ' style="aspect-ratio: ' + foto.ancho + " / " + foto.alto + '"' : "";
  return sangria + '<img class="marco__foto" src="' + foto.uri + '" alt="' + alt.replace(/"/g, "&quot;") + '"' + razon + ' width="' + foto.ancho + '" height="' + foto.alto + '">\n';
});

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

const LIMITE = 16 * 1024 * 1024;
if (salida.length > LIMITE * 0.92) {
  console.error(
    "La pagina pesa " + (salida.length / 1048576).toFixed(1) + " MB y el limite del visor es 16 MB.\n" +
    "Baja la calidad o el ancho maximo en herramientas/imagenes.py y vuelve a construir."
  );
  process.exit(1);
}

if (puestas.length) { console.log("Fotos incrustadas: " + puestas.join(", ")); }
if (faltantes.length) { console.log("Marcos todavia sin foto: " + faltantes.join(", ")); }
console.log("index.html: " + (salida.length / 1048576).toFixed(2) + " MB de 16 MB");
