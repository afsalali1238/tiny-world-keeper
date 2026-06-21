const PREFIX = ["Va", "Mi", "O", "Ae", "Si", "Tha", "Lo", "Ny", "Ka", "Ze", "Eli", "Or"];
const MIDDLE = ["el", "re", "ru", "th", "lin", "ras", "mi", "va", "no", "su"];
const SUFFIX = ["a", "th", "an", "is", "or", "en", "ya", "il", "us", ""];

export const NAME_SUGGESTIONS = ["Vael", "Mireth", "Oru"];

export function randomMythicName(): string {
  const a = PREFIX[Math.floor(Math.random() * PREFIX.length)];
  const b = Math.random() > 0.4 ? MIDDLE[Math.floor(Math.random() * MIDDLE.length)] : "";
  const c = SUFFIX[Math.floor(Math.random() * SUFFIX.length)];
  return a + b + c;
}
