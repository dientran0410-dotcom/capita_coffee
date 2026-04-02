export const UNIT_OPTIONS = [
  "GRAM",
  "KILOGRAM",
  "MILLILITER",
  "LITER",
  "PIECE",
  "UNIT",
] as const;

export type WarehouseUnit = (typeof UNIT_OPTIONS)[number];

const UNIT_ALIASES: Record<string, WarehouseUnit> = {
  g: "GRAM",
  gram: "GRAM",
  grams: "GRAM",
  kg: "KILOGRAM",
  kilogram: "KILOGRAM",
  kilograms: "KILOGRAM",
  ml: "MILLILITER",
  milliliter: "MILLILITER",
  milliliters: "MILLILITER",
  millilitre: "MILLILITER",
  millilitres: "MILLILITER",
  l: "LITER",
  liter: "LITER",
  liters: "LITER",
  litre: "LITER",
  litres: "LITER",
  piece: "PIECE",
  pieces: "PIECE",
  pc: "PIECE",
  pcs: "PIECE",
  item: "UNIT",
  items: "UNIT",
  unit: "UNIT",
  units: "UNIT",
};

export const normalizeWarehouseUnit = (
  value: unknown,
  fallback: WarehouseUnit = "GRAM",
): WarehouseUnit => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  const upper = raw.toUpperCase();
  if ((UNIT_OPTIONS as readonly string[]).includes(upper)) {
    return upper as WarehouseUnit;
  }

  const mapped = UNIT_ALIASES[raw.toLowerCase()];
  return mapped || fallback;
};
