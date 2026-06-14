import masterWeightData from "./master_berat.json";

export interface WeightInfo {
  masterWeight: number; // in kg
  status: "Kurus" | "Normal" | "Obesitas";
  idealRange: { min: number; max: number };
  keterangan: string;
  rawRangeString: string;
}

// Age helper: convert to months
export function getAgeInMonths(age: number, ageUnit: "weeks" | "months" | "years"): number {
  if (ageUnit === "weeks") return age / 4;
  if (ageUnit === "months") return age;
  return age * 12;
}

export function getCleanBreedName(breedInput: string): string {
  const cleanInput = breedInput.toLowerCase().trim();
  if (
    cleanInput.includes("persia") || 
    cleanInput.includes("pesia") || 
    cleanInput.includes("persian")
  ) {
    return "Persia";
  }
  if (cleanInput.includes("anggora") || cleanInput.includes("angora")) return "Anggora (Turkish)";
  if (cleanInput.includes("coon")) return "Maine Coon";
  if (cleanInput.includes("british") || cleanInput.includes("bsh")) return "British Shorthair";
  if (cleanInput.includes("scottish")) return "Scottish Fold";
  if (cleanInput.includes("ragdoll")) return "Ragdoll";
  if (
    cleanInput.includes("kampung") || 
    cleanInput.includes("lokal") || 
    cleanInput.includes("domestik") || 
    cleanInput.includes("domestic")
  ) {
    return "Kucing Kampung (Lokal)";
  }
  // Default fallback if no match found
  return "Kucing Kampung (Lokal)";
}

// Helper to parse min/max numeric values from Excel range strings (e.g., "1.0–1.3 kg", "80–120 g", "700–1.0 kg")
export function parseRangeString(rangeStr: string): { min: number; max: number } {
  if (!rangeStr) return { min: 0, max: 0 };
  
  // Clean spaces and unify dashes
  const clean = rangeStr.replace(/\s+/g, "").replace(/[–—−]/g, "-");
  
  // Match pattern like "1.0-1.3kg" or "80-120g"
  const match = clean.match(/^([\d.]+)-([\d.]+)([a-zA-Z]+)?$/);
  if (!match) return { min: 0, max: 0 };
  
  let minVal = parseFloat(match[1]);
  let maxVal = parseFloat(match[2]);
  const unit = (match[3] || "kg").toLowerCase();
  
  if (unit === "g") {
    // Both are in grams
    minVal = minVal / 1000;
    maxVal = maxVal / 1000;
  } else {
    // Usually kg, check for mixed unit like "700-1.0kg"
    if (minVal > 10 && maxVal <= 10) {
      minVal = minVal / 1000;
    }
  }
  
  return { min: minVal, max: maxVal };
}

export function getWeightInfo(
  breed: string,
  age: number,
  ageUnit: "weeks" | "months" | "years",
  weightGrams: number,
  gender: "jantan" | "betina" = "jantan"
): WeightInfo {
  const cleanBreed = getCleanBreedName(breed);
  const breedData = (masterWeightData as any)[cleanBreed] || (masterWeightData as any)["Kucing Kampung (Lokal)"];
  
  const m = getAgeInMonths(age, ageUnit);
  let index = 0;
  
  if (m < 0.5) {
    index = 0; // Baru lahir
  } else if (m < 1.5) {
    index = 1; // 1 bulan
  } else if (m < 2.5) {
    index = 2; // 2 bulan
  } else if (m < 3.5) {
    index = 3; // 3 bulan
  } else if (m < 5.0) {
    index = 4; // 4 bulan
  } else if (m < 7.5) {
    index = 5; // 6 bulan
  } else if (m < 10.5) {
    index = 6; // 9 bulan
  } else if (m < 18.0) {
    index = 7; // 1 tahun
  } else if (m < 30.0) {
    index = 8; // 2 tahun
  } else if (m < 84.0) {
    index = 9; // 3-6 tahun / 3+ tahun / 3-4 tahun
  } else {
    index = 10; // 7+ tahun
  }
  
  // Safety check to prevent index out of bounds
  const record = breedData[index] || breedData[breedData.length - 1];
  
  // Extract gender-specific ideal average weight
  const isFemale = gender === "betina";
  const masterWeight = isFemale ? (record.rata_betina || 0) : (record.rata_jantan || 0);
  const rawRangeString = isFemale ? (record.berat_betina_str || "") : (record.berat_jantan_str || "");
  
  // Parse min and max from the raw Excel range string
  const { min: minIdeal, max: maxIdeal } = parseRangeString(rawRangeString);
  
  const weightKg = weightGrams / 1000;
  
  // Calculate margin tolerance relative to the boundaries:
  // Underweight (Kurus): less than 10% below the minimum limit (minIdeal * 0.9)
  // Obese (Obesitas): more than 20% above the maximum limit (maxIdeal * 1.2)
  const minLimit = minIdeal > 0 ? minIdeal * 0.9 : masterWeight * 0.9;
  const maxLimit = maxIdeal > 0 ? maxIdeal * 1.2 : masterWeight * 1.2;
  
  let status: "Kurus" | "Normal" | "Obesitas" = "Normal";
  if (weightKg < minLimit) {
    status = "Kurus";
  } else if (weightKg > maxLimit) {
    status = "Obesitas";
  }
  
  return {
    masterWeight,
    status,
    idealRange: { min: minLimit, max: maxLimit },
    keterangan: record.keterangan || "",
    rawRangeString
  };
}
