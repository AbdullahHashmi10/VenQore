/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  icons — glyph resolution for the builder.                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * `config/ai_builder.php` names a glyph per question and per option; this file
 * turns that name into a component. It resolves NAMES ONLY — it never decides
 * which question exists, what an option is called, or what a module does. Those
 * all come from the registries.
 *
 * The imports are explicit rather than `import * as Lucide`. A namespace import
 * defeats tree-shaking and drags all ~1,600 lucide icons into the bundle for
 * the sake of a lookup table; naming the two dozen this screen can actually
 * render keeps the chunk small. An unknown name falls back rather than throwing,
 * so adding an option to the config can never white-screen onboarding — it just
 * renders the neutral dot until someone adds the glyph here.
 */

import {
    ArrowLeft, ArrowRight, BadgeCheck, Boxes, Building2, CalendarCheck, ChartLine,
    Check, ChefHat, Clock, Factory, FileSignature, FileStack, FileText, Globe,
    Hammer, HandCoins, Layers, Moon, NotebookPen, Package, PackageCheck, PackageOpen,
    PackageX, Plus, Receipt, Rocket, ScanBarcode, Search, ShieldCheck, ShoppingCart,
    Shuffle, Sparkles, Store, Sun, Tags, Target, TrendingUp, Truck, User, Users,
    UsersRound, UtensilsCrossed, Wind, Wrench, X,
} from 'lucide-react';

/** Everything the discovery config and the module map are allowed to name. */
export const GLYPHS = {
    ArrowLeft, ArrowRight, BadgeCheck, Boxes, Building2, CalendarCheck, ChartLine,
    Check, ChefHat, Clock, Factory, FileSignature, FileStack, FileText, Globe,
    Hammer, HandCoins, Layers, Moon, NotebookPen, Package, PackageCheck, PackageOpen,
    PackageX, Plus, Receipt, Rocket, ScanBarcode, Search, ShieldCheck, ShoppingCart,
    Shuffle, Sparkles, Store, Sun, Tags, Target, TrendingUp, Truck, User, Users,
    UsersRound, UtensilsCrossed, Wind, Wrench, X,
};

/**
 * Fallback glyphs per module key.
 *
 * NOT a module list. `config/modules.php` is the only thing that says which
 * modules exist and what they are called; if a key is missing here it still
 * renders, with `Layers`. This map is purely which picture goes next to a name
 * the registry already gave us — and it is only consulted when the server did
 * not send an icon of its own.
 */
export const MODULE_GLYPHS = {
    pos: ScanBarcode,
    products: Package,
    inventory: Boxes,
    services: Wrench,
    invoicing: FileText,
    quotations: FileSignature,
    customers: Users,
    suppliers: Factory,
    purchases: ShoppingCart,
    expenses: Receipt,
    reports: ChartLine,
    cookbook: ChefHat,
    table_service: UtensilsCrossed,
    khata_credit: NotebookPen,
    barcodes_labels: Tags,
    staff_attendance: CalendarCheck,
};

/** Resolve a config-supplied glyph name. Never throws. */
export function glyph(name, fallback = null) {
    if (!name) return fallback;
    return GLYPHS[name] || fallback;
}

/** Resolve a module's glyph: server-supplied name wins, then the map, then Layers. */
export function moduleGlyph(moduleKey, iconName = null) {
    return glyph(iconName) || MODULE_GLYPHS[moduleKey] || Layers;
}
