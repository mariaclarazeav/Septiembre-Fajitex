"""Prepara las fotos de src/imagenes para incrustarlas en la pagina.

Cada foto se endereza segun su EXIF, se reduce al ancho maximo que la
maqueta necesita y se guarda como JPEG progresivo. Imprime un JSON con
la data URI de cada una, que es lo que consume construir.js.

La pagina no puede pedir imagenes a otro servidor: la politica de
seguridad del visor solo deja pasar las fuentes de Google. Por eso van
adentro del archivo y por eso importa el peso.
"""
import base64, io, json, os, sys

from PIL import Image, ImageOps

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "imagenes")
EXTENSIONES = (".jpg", ".jpeg", ".png", ".webp")

# ancho maximo util en la maqueta, por el doble de densidad de pantalla
ANCHOS = {"hero": 2200, "producto": 1400, "activacion": 1400, "candid": 1400, "talento": 1400}


def buscar(nombre):
    for ext in EXTENSIONES:
        for variante in (nombre + ext, nombre + ext.upper()):
            ruta = os.path.join(RAIZ, variante)
            if os.path.exists(ruta):
                return ruta
    return None


def preparar(ruta, ancho_max):
    with Image.open(ruta) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode not in ("RGB", "L"):
            fondo = Image.new("RGB", img.size, (250, 239, 230))
            img = img.convert("RGBA")
            fondo.paste(img, mask=img.split()[-1])
            img = fondo
        else:
            img = img.convert("RGB")

        if img.width > ancho_max:
            alto = round(img.height * ancho_max / img.width)
            img = img.resize((ancho_max, alto), Image.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=82, optimize=True, progressive=True)
        return buf.getvalue(), img.width, img.height


def main():
    salida = {}
    for nombre, ancho in ANCHOS.items():
        ruta = buscar(nombre)
        if not ruta:
            continue
        try:
            crudo, w, h = preparar(ruta, ancho)
        except Exception as error:
            print("No se pudo leer " + os.path.basename(ruta) + ": " + str(error), file=sys.stderr)
            sys.exit(1)
        salida[nombre] = {
            "uri": "data:image/jpeg;base64," + base64.b64encode(crudo).decode("ascii"),
            "bytes": len(crudo),
            "ancho": w,
            "alto": h,
            "origen": os.path.basename(ruta),
            "origen_bytes": os.path.getsize(ruta),
        }
    json.dump(salida, sys.stdout)


if __name__ == "__main__":
    main()
