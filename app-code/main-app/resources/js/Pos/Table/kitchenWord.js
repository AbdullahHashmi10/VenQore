/* One switch for "does this business have a kitchen". Set once by the FOH screen from the
   store's kitchen setting; every label that names the kitchen reads it, so a café with no
   kitchen never sees "Cooking", "Fire" or "Send to kitchen". */
let ON = true;
export const setKitchenOn = (v) => { ON = v !== false; };
export const kitchenOn = () => ON;
export const cookWord = () => (ON ? 'Cooking' : 'Preparing');
