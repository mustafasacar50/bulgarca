
import { matchAnswer, cyrillicToLatin, levenshtein } from './src/utils/transliterate';

const correct = "Аз уча български.";
const user = "az ucha bilgarski";

console.log("Correct:", correct);
console.log("User:", user);
console.log("CyrLat:", cyrillicToLatin(correct));

const res = matchAnswer(user, correct);
console.log("Match Result:", res);

const normalize = (s) => s.trim().toLowerCase().replace(/[!?.,;:\-–—()'"«»\s]+/g, '');
const u = normalize(user);
const cLat = normalize(cyrillicToLatin(correct));
console.log("U Norm:", u);
console.log("CLat Norm:", cLat);
console.log("Dist:", levenshtein(u, cLat));
