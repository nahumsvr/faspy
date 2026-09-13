import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type {
  DebtorRecord,
  InvoiceHistoryRecord,
  OfacSanctionRecord,
  Sat69bRecord,
} from "../lib/data/types.ts";

const loadJson = <T,>(filename: string): T =>
  JSON.parse(readFileSync(new URL(`../lib/data/${filename}`, import.meta.url), "utf8")) as T;

const sat = loadJson<Sat69bRecord[]>("sat-69b.json");
const ofac = loadJson<OfacSanctionRecord[]>("ofac-sanctions.json");
const debtors = loadJson<DebtorRecord[]>("debtors.json");
const history = loadJson<InvoiceHistoryRecord[]>("invoices-history.json");

const unique = (values: string[]): Set<string> => new Set(values);
const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isoUtcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const assertNonEmptyString = (value: unknown): void => {
  assert.ok(typeof value === "string" && value.length > 0);
};
const assertPositiveAmount = (value: unknown): void => {
  assert.ok(typeof value === "number" && Number.isFinite(value) && value > 0);
};

test("los cuatro fixtures tienen cantidades y campos obligatorios", () => {
  assert.equal(sat.length, 8);
  assert.equal(ofac.length, 3);
  assert.equal(debtors.length, 8);
  assert.equal(history.length, 18);

  for (const record of sat) {
    assertNonEmptyString(record.rfc);
    assertNonEmptyString(record.razon_social);
    assertNonEmptyString(record.motivo);
    assert.ok(["LIMPIO", "EFOS", "EDOS"].includes(record.clasificacion));
  }

  for (const record of ofac) {
    assertNonEmptyString(record.id);
    assertNonEmptyString(record.nombre);
    assertNonEmptyString(record.rfc);
    assertNonEmptyString(record.motivo);
  }

  for (const record of debtors) {
    assertNonEmptyString(record.rfc);
    assertNonEmptyString(record.razon_social);
    assert.ok(["A", "B", "C", "D"].includes(record.calificacion));
    assert.ok(Number.isInteger(record.dias_promedio_pago) && record.dias_promedio_pago >= 0);
    assert.ok(Number.isInteger(record.facturas_pagadas) && record.facturas_pagadas >= 0);
    assert.ok(Number.isInteger(record.facturas_vencidas) && record.facturas_vencidas >= 0);
    assertPositiveAmount(record.limite_exposicion_mxn);
  }

  for (const record of history) {
    assertNonEmptyString(record.id);
    assertNonEmptyString(record.uuid_cfdi);
    assertNonEmptyString(record.rfc_cliente);
    assertNonEmptyString(record.cliente);
    assertPositiveAmount(record.monto_mxn);
    assert.ok(["VIGENTE", "RECHAZADO"].includes(record.cfdi_status));
    assert.ok(["LIMPIO", "SANCIONADO"].includes(record.efos_status));
    assert.ok(["ALTO", "MEDIO", "BAJO"].includes(record.score));
    assert.ok(["aprobada", "revision", "rechazada"].includes(record.decision));
    assert.ok([30, 60, 90].includes(record.plazo_dias));
    assert.ok(["LIMPIO", "SANCIONADO"].includes(record.ofac_status));
    assertNonEmptyString(record.motivo_decision);
  }
});

test("las listas y los identificadores son únicos", () => {
  assert.equal(unique(sat.map((record) => record.rfc)).size, sat.length);
  assert.equal(unique(ofac.map((record) => record.id)).size, ofac.length);
  assert.equal(unique(debtors.map((record) => record.rfc)).size, debtors.length);
  assert.equal(unique(history.map((record) => record.id)).size, history.length);
  assert.equal(unique(history.map((record) => record.uuid_cfdi)).size, history.length);

  for (const record of history) assert.match(record.uuid_cfdi, uuidV4Pattern);
  for (const record of ofac) assert.match(record.id, uuidV4Pattern);
});

test("las referencias RFC y nombres conservan integridad entre archivos", () => {
  const satByRfc = new Map(sat.map((record) => [record.rfc, record]));
  const debtorByRfc = new Map(debtors.map((record) => [record.rfc, record]));

  assert.deepEqual(
    debtors.map((record) => record.rfc).sort(),
    sat.map((record) => record.rfc).sort(),
  );

  for (const debtor of debtors) {
    assert.equal(satByRfc.get(debtor.rfc)?.razon_social, debtor.razon_social);
  }

  for (const record of ofac) {
    assert.equal(satByRfc.get(record.rfc)?.razon_social, record.nombre);
  }

  for (const invoice of history) {
    assert.equal(debtorByRfc.get(invoice.rfc_cliente)?.razon_social, invoice.cliente);
  }
});

test("la cobertura acordada de clasificaciones, calificaciones, decisiones y plazos está completa", () => {
  const countBy = <T extends string>(values: T[]): Map<T, number> => {
    const counts = new Map<T, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  };

  assert.deepEqual(Object.fromEntries(countBy(sat.map((record) => record.clasificacion))), {
    LIMPIO: 6,
    EFOS: 1,
    EDOS: 1,
  });
  assert.deepEqual(Object.fromEntries(countBy(debtors.map((record) => record.calificacion))), {
    A: 2,
    B: 2,
    C: 2,
    D: 2,
  });
  assert.deepEqual(Object.fromEntries(countBy(history.map((record) => record.decision))), {
    aprobada: 9,
    revision: 4,
    rechazada: 5,
  });
  assert.deepEqual([...new Set(history.map((record) => record.plazo_dias))].sort((a, b) => a - b), [30, 60, 90]);

  const rejectionReasons = history
    .filter((record) => record.decision === "rechazada")
    .map((record) => record.motivo_decision);
  for (const reason of [/EFOS/i, /EDOS/i, /OFAC/i, /CFDI/i, /riesgo crediticio/i]) {
    assert.ok(rejectionReasons.some((motivo) => reason.test(motivo)));
  }
});

test("los estados fiscales y OFAC son independientes y las aprobaciones son seguras", () => {
  const satByRfc = new Map(sat.map((record) => [record.rfc, record]));
  const sanctionedRfcs = new Set(ofac.map((record) => record.rfc));

  for (const invoice of history) {
    const satClassification = satByRfc.get(invoice.rfc_cliente)?.clasificacion;
    assert.ok(satClassification);
    assert.equal(invoice.efos_status, satClassification === "LIMPIO" ? "LIMPIO" : "SANCIONADO");
    assert.equal(invoice.ofac_status, sanctionedRfcs.has(invoice.rfc_cliente) ? "SANCIONADO" : "LIMPIO");
    if (invoice.decision === "aprobada") {
      assert.equal(invoice.cfdi_status, "VIGENTE");
      assert.equal(invoice.efos_status, "LIMPIO");
      assert.equal(invoice.ofac_status, "LIMPIO");
    }
  }

  assert.ok(history.some((invoice) => invoice.efos_status === "LIMPIO" && invoice.ofac_status === "SANCIONADO"));
});

test("las fechas son ISO UTC fijas y válidas", () => {
  for (const invoice of history) {
    assert.match(invoice.timestamp, isoUtcPattern);
    assert.ok(Number.isFinite(Date.parse(invoice.timestamp)));
  }
});
