/*
 * Pruebas del cálculo de distancia y de la evaluación de zona.
 *
 *     pnpm probar
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { distanciaEnMetros, esPuntoValido, evaluarZona } from "../src/lib/geo.ts";

/** Enchulados, Escuintla. Coordenadas exactas de Google Maps, 31 de agosto de 2026. */
const ENCHULADOS = { lat: 14.308601, lon: -90.786206 };

/** Un punto a `metros` al norte de otro. 1 grado de latitud son ~111.320 m en cualquier lado. */
const alNorte = (p: typeof ENCHULADOS, metros: number) => ({
  lat: p.lat + metros / 111_320,
  lon: p.lon,
});

/** Al este hay que corregir por el coseno de la latitud. */
const alEste = (p: typeof ENCHULADOS, metros: number) => ({
  lat: p.lat,
  lon: p.lon + metros / (111_320 * Math.cos((p.lat * Math.PI) / 180)),
});

test("la distancia de un punto a sí mismo es cero", () => {
  assert.equal(distanciaEnMetros(ENCHULADOS, ENCHULADOS), 0);
});

test("cien metros al norte miden cien metros", () => {
  const d = distanciaEnMetros(ENCHULADOS, alNorte(ENCHULADOS, 100));
  assert.ok(Math.abs(d - 100) <= 1, `dio ${d} m`);
});

test("cien metros al este miden cien metros", () => {
  const d = distanciaEnMetros(ENCHULADOS, alEste(ENCHULADOS, 100));
  assert.ok(Math.abs(d - 100) <= 1, `dio ${d} m`);
});

test("la distancia es simétrica", () => {
  const otro = alEste(ENCHULADOS, 340);
  assert.equal(distanciaEnMetros(ENCHULADOS, otro), distanciaEnMetros(otro, ENCHULADOS));
});

test("una distancia conocida y larga sale bien", () => {
  // Escuintla → Ciudad de Guatemala, unos 50 km en línea recta.
  const guatemala = { lat: 14.6349, lon: -90.5069 };
  const d = distanciaEnMetros(ENCHULADOS, guatemala);
  assert.ok(d > 45_000 && d < 55_000, `dio ${d} m`);
});

test("un punto sin lectura no se confunde con uno real", () => {
  assert.equal(esPuntoValido({ lat: null, lon: null }), false);
  assert.equal(esPuntoValido({ lat: 0, lon: 0 }), false, "(0,0) es el punto nulo");
  assert.equal(esPuntoValido({ lat: 999, lon: 0 }), false);
  assert.equal(esPuntoValido({ lat: Number.NaN, lon: 0 }), false);
  assert.equal(esPuntoValido(ENCHULADOS), true);
});

/** Radio sugerido: 200 m. El rango que acepta el formulario es mas amplio (20 a 5000). */
const ZONA = { centro: ENCHULADOS, radioM: 200 };

test("dentro del radio da dentro", () => {
  const r = evaluarZona({ ...ZONA, lectura: alNorte(ENCHULADOS, 120), precisionM: 10 });
  assert.equal(r.veredicto, "dentro");
  assert.ok(r.distanciaM !== null && Math.abs(r.distanciaM - 120) <= 2);
});

test("lejos del radio da fuera", () => {
  const r = evaluarZona({ ...ZONA, lectura: alNorte(ENCHULADOS, 3000), precisionM: 10 });
  assert.equal(r.veredicto, "fuera");
});

test("el margen de error juega a favor del alumno", () => {
  // A 210 m con ±30 m de error: su circulo toca la zona, se cuenta dentro.
  const r = evaluarZona({ ...ZONA, lectura: alNorte(ENCHULADOS, 210), precisionM: 30 });
  assert.equal(r.veredicto, "dentro");
});

test("una lectura mas imprecisa que el radio no sirve para decidir", () => {
  const r = evaluarZona({ ...ZONA, lectura: alNorte(ENCHULADOS, 3000), precisionM: 900 });
  assert.equal(r.veredicto, "impreciso", "no puede dar 'fuera': la medicion no alcanza");
  assert.ok(r.distanciaM !== null, "la distancia igual se guarda, para la bitacora");
});

test("sin lectura no es lo mismo que fuera", () => {
  const r = evaluarZona({ ...ZONA, lectura: null, precisionM: null });
  assert.equal(r.veredicto, "sin_lectura");
  assert.equal(r.distanciaM, null);
});

test("una actividad sin zona declarada nunca evalua nada", () => {
  const r = evaluarZona({
    centro: null,
    radioM: null,
    lectura: alNorte(ENCHULADOS, 50_000),
    precisionM: 5,
  });
  assert.equal(r.veredicto, "sin_lectura");
  assert.equal(r.distanciaM, null);
});

test("justo en el borde del radio se cuenta dentro", () => {
  const r = evaluarZona({ ...ZONA, lectura: alNorte(ENCHULADOS, 200), precisionM: 0 });
  assert.equal(r.veredicto, "dentro");
});

/*
 * Los dos casos de abajo son los que deciden si la etapa 2 rechaza o no: `registrarMarcaje`
 * bloquea con "fuera" y con nada mas, asi que la frontera entre "fuera" e "impreciso" es
 * literalmente la frontera entre quitarle el punto a alguien y no quitarselo.
 */

test("una precision igual al radio todavia sirve para decidir", () => {
  // `impreciso` pide precision ESTRICTAMENTE mayor que el radio. Con 200 y 200 se decide, y
  // a 500 m el margen no le alcanza para tocar la zona.
  const r = evaluarZona({ ...ZONA, lectura: alNorte(ENCHULADOS, 500), precisionM: 200 });
  assert.equal(r.veredicto, "fuera");
});

test("un metro mas de imprecision ya impide decidir", () => {
  const r = evaluarZona({ ...ZONA, lectura: alNorte(ENCHULADOS, 500), precisionM: 201 });
  assert.equal(r.veredicto, "impreciso", "y por lo tanto no se rechaza el marcaje");
});

test("la universidad queda fuera de la zona de Enchulados", () => {
  // Comprobacion de sentido: el caso que se quiere frenar es marcar desde otro lado.
  const universidad = { lat: 14.2956, lon: -90.7852 };
  const r = evaluarZona({ ...ZONA, lectura: universidad, precisionM: 20 });
  assert.equal(r.veredicto, "fuera");
});
