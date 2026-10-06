// Import and add future batches in this manner
// Only keep the 2nd and 3rd Years pictures in the website
// Don't delete the past batch info and photos, keep them as they are
// Just show the recent batches photos and data

import { members2027 } from "./2027";
import { members2028 } from "./2028";
//import { members2029 } from "./2029";

export const members = [
  ...members2027,
  ...members2028,
];
