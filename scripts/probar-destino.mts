/*
 * Pruebas del destino posterior al login (ASI2-16): no debe ser un redirect abierto y el
 * retorno del QR tiene que seguir funcionando.
 *
 *     pnpm probar
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { destinoSeguro } from "../src/lib/destino.ts";

const INICIO = "/";

test("barras invertidas, en todas sus variantes, no pasan", () => {
  for (const malo of [
    "/\\ejemplo.com",
    "/\\/ejemplo.com",
    "/\\\\ejemplo.com",
    "\\\\ejemplo.com",
    "\\/ejemplo.com",
    "/a\\b",
    "/ok/\\ejemplo.com",
    "/ruta?x=\\ejemplo.com",
    "/ruta#\\ejemplo.com",
    "/\t\\ejemplo.com",
  ]) {
    assert.equal(destinoSeguro(malo), INICIO, malo);
  }
});

test("doble barra y variantes que normalizan a doble barra no pasan", () => {
  for (const malo of ["//ejemplo.com", "///ejemplo.com", "//", "/.//ejemplo.com", "/a/..//ejemplo.com"]) {
    assert.equal(destinoSeguro(malo), INICIO, malo);
  }
});

test("esquemas externos y rutas no absolutas no pasan", () => {
  for (const malo of [
    "http://ejemplo.com",
    "https://ejemplo.com/a",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>1</script>",
    "mailto:a@b.c",
    "ejemplo.com",
    "a/b",
    "",
    "   ",
    "?x=1",
    "#x",
  ]) {
    assert.equal(destinoSeguro(malo), INICIO, malo);
  }
});

test("caracteres de control no pasan", () => {
  for (const malo of [
    "/\nejemplo.com",
    "/\r\n/ejemplo.com",
    "/\t/ejemplo.com",
    "/a\u0000b",
    "/a\u001fb",
    "/a\u007fb",
    "/a\u0085b",
  ]) {
    assert.equal(destinoSeguro(malo), INICIO, JSON.stringify(malo));
  }
});

test("valores que no son texto no pasan", () => {
  for (const malo of [null, undefined, 42, {}, ["/a"]]) {
    assert.equal(destinoSeguro(malo), INICIO);
  }
});

test("el retorno del QR se conserva intacto", () => {
  for (const ruta of ["/a/abc123/ZXCV9876", "/a/AbC-12/Q7w8E9r0t1", "/a/abc123/ZXCV9876?x=1"]) {
    assert.equal(destinoSeguro(ruta), ruta);
  }
});

test("rutas internas legitimas pasan", () => {
  for (const ruta of ["/", "/panel", "/admin/actividades", "/perfil?x=1&y=2", "/clases#mate", "/a%20b", "/x/%5Cy"]) {
    assert.equal(destinoSeguro(ruta), ruta, ruta);
  }
  // Se recorta el espacio de los bordes, como antes.
  assert.equal(destinoSeguro("  /panel "), "/panel");
});

test("lo que se devuelve siempre es interno", () => {
  for (const entrada of ["/a/../b", "/./b", "/a//b", "/%2F%2Fejemplo.com"]) {
    const r = destinoSeguro(entrada);
    assert.ok(r.startsWith("/") && !r.startsWith("//"), `${entrada} -> ${r}`);
    assert.ok(!r.includes("\\"));
  }
});

test("se puede indicar otro destino por defecto", () => {
  assert.equal(destinoSeguro("/\\x", "/panel"), "/panel");
});
