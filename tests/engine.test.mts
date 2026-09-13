import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { DebtorRecord, OfacSanctionRecord, Sat69bRecord } from "../lib/data/types.ts";
import { isValidCfdiUuid, isValidClabe, isValidRfc, validateCompliance } from "../lib/engine/compliance.ts";
import { calculateScoring, combineDecisions } from "../lib/engine/scoring.ts";
import { calculateFactoring, createFactoringOffer, selectFactoringConditions } from "../lib/engine/factoring.ts";
import { EngineInputError } from "../lib/engine/types.ts";

const load = <T,>(name: string): T => JSON.parse(readFileSync(new URL(`../lib/data/${name}.json`, import.meta.url), "utf8"));
const catalogs = {
  sat: load<Sat69bRecord[]>("sat-69b"),
  ofac: load<OfacSanctionRecord[]>("ofac-sanctions"),
  debtors: load<DebtorRecord[]>("debtors"),
};
const debtor = catalogs.debtors.find((item) => item.rfc === "DIN890214ABC")!;
const invoice = { rfc_cliente: debtor.rfc, uuid_cfdi: "4a71d8be-b51f-46df-9a84-18ef5560965e" };
const score = (amount: number, term = 30, rating: DebtorRecord["calificacion"] = "A") => calculateScoring({
  pagador: { ...debtor, calificacion: rating, limite_exposicion_mxn: 1000 }, monto_mxn: amount, plazo_dias: term,
});
const conditions = { aforo: 0.9, tasa_aplicada: 0.02, comision_mxn: 0 };

function freezeDeep(value: object): void {
  for (const child of Object.values(value)) if (child && typeof child === "object") freezeDeep(child);
  Object.freeze(value);
}

test("caso de referencia integrado y determinista, sin mutar entradas", () => {
  const before = JSON.stringify(catalogs);
  freezeDeep(catalogs);
  Object.freeze(invoice);
  const run = () => {
    const compliance = validateCompliance(invoice, catalogs);
    const scoring = calculateScoring({ pagador: debtor, monto_mxn: 150000, plazo_dias: 60 }, compliance);
    return { compliance, scoring, offer: createFactoringOffer(150000, debtor.calificacion, 60, scoring.decision) };
  };
  const result = run();
  assert.deepEqual(result, run());
  assert.equal(result.scoring.puntuacion, 90);
  assert.equal(result.scoring.score, "ALTO");
  assert.equal(result.scoring.decision, "aprobada");
  assert.equal(result.scoring.dias_promedio_pago, 32);
  assert.deepEqual(result.offer, { ...conditions, monto_anticipo: 132300, descuento_mxn: 2700, reserva_mxn: 15000 });
  assert.equal(JSON.stringify(catalogs), before);
});

test("RFC normalizado, UUID genérico y CLABE estrictamente textual", () => {
  assert.equal(validateCompliance({ ...invoice, rfc_cliente: " din890214abc " }, catalogs).decision, "aprobada");
  assert.ok(isValidRfc("AAAA000101ABC"));
  assert.ok(isValidCfdiUuid(invoice.uuid_cfdi.toUpperCase()));
  for (const value of [null, 123, "", "x", `${invoice.uuid_cfdi} `]) assert.equal(isValidCfdiUuid(value), false);
  for (const value of [null, 123, "DIN890214AB", "DIN890214ABCX"]) assert.equal(isValidRfc(value), false);
  assert.ok(isValidClabe("012180001234567890"));
  for (const value of [12180001234567890, "01218000123456789", "0121800012345678901", "01218000123456789X", " 012180001234567890"]) assert.equal(isValidClabe(value), false);
  assert.equal(validateCompliance({ ...invoice, uuid_cfdi: "invalid" }, catalogs).cfdi_status, "RECHAZADO");
  assert.equal(validateCompliance({ ...invoice, rfc_cliente: "invalid" }, catalogs).decision, "rechazada");
});

test("EFOS y EDOS rechazan; OFAC no modifica el estado SAT", () => {
  for (const sat of catalogs.sat.filter((item) => item.clasificacion !== "LIMPIO")) {
    const result = validateCompliance({ ...invoice, rfc_cliente: sat.rfc }, catalogs);
    assert.equal(result.decision, "rechazada");
    assert.equal(result.efos_status, "SANCIONADO");
    assert.ok(result.motivos.includes(sat.clasificacion as "EFOS" | "EDOS"));
  }
  for (const ofac of catalogs.ofac) {
    const result = validateCompliance({ ...invoice, rfc_cliente: ofac.rfc }, catalogs);
    assert.equal(result.efos_status, "LIMPIO");
    assert.equal(result.ofac_status, "SANCIONADO");
    assert.equal(result.cfdi_status, "VIGENTE");
    assert.equal(result.decision, "rechazada");
  }
  assert.equal(validateCompliance(invoice, { ...catalogs, ofac: [{ ...catalogs.ofac[0], rfc: "XXX000101ABC", nombre: debtor.razon_social }] }).ofac_status, "LIMPIO");
});

test("desconocidos pasan a revisión sin inventar resultado SAT ni historial", () => {
  const result = validateCompliance({ ...invoice, rfc_cliente: "XXX000101ABC" }, catalogs);
  assert.equal(result.efos_status, null);
  assert.equal(result.decision, "revision");
  assert.equal(validateCompliance(invoice, { ...catalogs, debtors: [] }).decision, "revision");
  assert.equal(validateCompliance(invoice, { ...catalogs, sat: [] }).decision, "revision");
  const input = { pagador: null, monto_mxn: 150000, plazo_dias: 60 };
  const unknown = calculateScoring(input, result);
  assert.equal(unknown.puntuacion, null);
  assert.equal(unknown.dias_promedio_pago, null);
  assert.equal(unknown.score, "BAJO");
  assert.equal(unknown.decision, "revision");
  assert.equal(calculateScoring(input, { decision: "rechazada", motivos: ["CFDI_INVALIDO"] }).decision, "rechazada");
});

test("límites exactos de exposición, puntuación y plazos", () => {
  for (const [amount, points] of [[500, 95], [500.01, 85], [800, 85], [800.01, 75], [1000, 75]]) {
    assert.equal(score(amount).puntuacion, points);
  }
  assert.equal(score(1000).decision, "revision");
  assert.equal(score(1000.01).decision, "rechazada");
  assert.ok(score(1000.01).motivos.includes("LIMITE_EXCEDIDO"));
  for (const [term, points] of [[30, 95], [60, 90], [90, 85]]) assert.equal(score(100, term).puntuacion, points);
  assert.equal(score(100, 30, "B").puntuacion, 80);
  assert.equal(score(100, 30, "B").score, "ALTO");
  assert.equal(score(100, 60, "B").score, "MEDIO");
  assert.equal(score(100, 90, "C").puntuacion, 50);
  assert.equal(score(100, 90, "C").score, "MEDIO");
  assert.equal(score(501, 60, "C").score, "BAJO");
  assert.equal(score(100, 30, "D").decision, "rechazada");
});

test("todas las combinaciones respetan rechazo > revisión > aprobación", () => {
  const decisions = ["aprobada", "revision", "rechazada"] as const;
  decisions.forEach((a, i) => decisions.forEach((b, j) => {
    assert.equal(combineDecisions(a, b), decisions[Math.max(i, j)]);
  }));
  for (const decision of ["revision", "rechazada"] as const) {
    const result = calculateScoring({ pagador: debtor, monto_mxn: 100, plazo_dias: 30 }, { decision, motivos: [] });
    assert.equal(result.decision, decision);
    assert.equal(createFactoringOffer(100, "A", 30, result.decision), null);
  }
  assert.equal(createFactoringOffer(100, "D", 30, "aprobada"), null);
  assert.equal(createFactoringOffer(100, null, 30, "aprobada"), null);
});

test("tabla financiera, comisión y redondeo conservan el monto", () => {
  for (const [rating, aforo, rate] of [["A", .9, .01], ["B", .85, .015], ["C", .8, .02]] as const) {
    for (const term of [30, 60, 90]) assert.deepEqual(selectFactoringConditions(rating, term), { aforo, tasa_aplicada: rate * (term / 30), comision_mxn: 0 });
  }
  const result = calculateFactoring(1234.56, { ...conditions, comision_mxn: 12.34 });
  assert.equal(result.monto_anticipo, 1076.54);
  assert.equal(result.descuento_mxn, 22.22);
  assert.equal(Math.round((result.monto_anticipo + result.comision_mxn + result.descuento_mxn + result.reserva_mxn) * 100), 123456);
  assert.equal(calculateFactoring(100, { aforo: 1, tasa_aplicada: 0, comision_mxn: 100 }).monto_anticipo, 0);
});

test("errores tipados para entradas numéricas inválidas", () => {
  for (const amount of [0, -1, NaN, Infinity, -Infinity, Number.MAX_VALUE]) {
    assert.throws(() => score(amount), (error) => error instanceof EngineInputError && error.code === "MONTO_INVALIDO");
    assert.throws(() => calculateFactoring(amount, conditions), EngineInputError);
  }
  for (const term of [0, 45, 31, NaN, Infinity]) {
    assert.throws(() => score(100, term), EngineInputError);
    assert.throws(() => createFactoringOffer(100, "A", term, "revision"), EngineInputError);
  }
  for (const aforo of [0, -1, 1.01, NaN, Infinity]) assert.throws(() => calculateFactoring(100, { ...conditions, aforo }), EngineInputError);
  for (const tasa_aplicada of [-1, 1, NaN, Infinity]) assert.throws(() => calculateFactoring(100, { ...conditions, tasa_aplicada }), EngineInputError);
  for (const comision_mxn of [-1, 89, NaN, Infinity]) assert.throws(() => calculateFactoring(100, { ...conditions, comision_mxn }), EngineInputError);
  assert.throws(() => calculateScoring({ pagador: { ...debtor, limite_exposicion_mxn: 0 }, monto_mxn: 100, plazo_dias: 30 }), EngineInputError);
});
