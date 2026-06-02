/** Country row from SMS-BUS `/api/numbers/countries`. */
export type SmsCountry = { id: number; title: string; code: string };

/** ISO code passed to flagcdn — virtual US uses the real US flag. */
export function countryFlagCode(code: string): string {
  const c = code.toLowerCase();
  if (c === "usv") return "us";
  return c;
}

/**
 * OTP buy flow: only United States (Virtual), pinned first. Plain `us` is
 * dropped because it is not the product we sell.
 */
export function prepareCountriesForBuy(countries: SmsCountry[]): SmsCountry[] {
  const filtered = countries.filter((c) => c.code.toLowerCase() !== "us");
  return [...filtered].sort((a, b) => {
    const aUsv = a.code.toLowerCase() === "usv";
    const bUsv = b.code.toLowerCase() === "usv";
    if (aUsv && !bUsv) return -1;
    if (!aUsv && bUsv) return 1;
    return a.title.localeCompare(b.title);
  });
}
