import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Compass,
  Store,
  ShoppingBag,
  Bike,
  Search,
  X,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  Share2,
  Receipt,
  Minus,
  Plus,
  Ticket,
  ArrowLeft,
  ArrowRight,
  Eye,
  Printer,
  Volume2,
  VolumeX,
  Copy,
  Sparkles,
  Package,
  ChefHat,
  Hourglass,
  Building2,
  Banknote,
  QrCode,
  Info,
  Scale,
  Star,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';

const MERCHANTS = [
  {
    id: 'merch_01',
    slug: 'komorebi-roasters',
    name: 'Komorebi Artisanal Roastery',
    categoryTag: 'Roastery',
    city: 'Lahore',
    country: 'Pakistan',
    address: 'Plot 42-B, Industrial Zone, Gulberg III, Lahore',
    hours: '08:00 AM – 11:00 PM',
    openStatus: 'Open Now',
    deliveryFee: 250,
    warehouseCode: 'WH-LHE-01',
    phone: '+92 42 3578 9120',
    pricingRule: { type: 'percentage', value: 0.10, label: '+10% Online Channel Rule' },
    initial: 'K',
    bannerImg: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    headline: 'Pure Micro-Lot Artisanal Reserve',
    subheadline: 'Directly sourced single-origin coffees roasted daily in Gulberg III, Lahore. Fresh inventory synced live with the VenQore ERP central warehouse.',
    rating: 4.9,
    reviewsCount: 142
  },
  {
    id: 'merch_02',
    slug: 'nordic-studio-craft',
    name: 'Nordic Studio & Ceramics',
    categoryTag: 'Ceramics',
    city: 'Karachi',
    country: 'Pakistan',
    address: 'DHA Phase 6, Bukhari Commercial, Karachi',
    hours: '10:00 AM – 10:00 PM',
    openStatus: 'Open Now',
    deliveryFee: 300,
    warehouseCode: 'WH-KHI-02',
    phone: '+92 21 3524 8891',
    pricingRule: { type: 'percentage', value: 0.08, label: '+8% Fragile Freight Rule' },
    initial: 'N',
    bannerImg: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    headline: 'Minimalist Hand-Crafted Stoneware',
    subheadline: 'Architectural mugs, drippers, and vessels crafted in Karachi studio workshops. Packed with double-walled shipping protection.',
    rating: 4.8,
    reviewsCount: 89
  },
  {
    id: 'merch_03',
    slug: 'verde-botanical',
    name: 'Margalla Botanical Apothecary',
    categoryTag: 'Apothecary',
    city: 'Islamabad',
    country: 'Pakistan',
    address: 'F-7 Markaz, Beverly Centre, Islamabad',
    hours: '11:00 AM – 09:00 PM',
    openStatus: 'Open Now',
    deliveryFee: 200,
    warehouseCode: 'WH-ISB-01',
    phone: '+92 51 2822 4110',
    pricingRule: { type: 'fixed', value: 0, label: 'Standard Retail (Same as Counter)' },
    initial: 'M',
    bannerImg: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1200&q=80',
    headline: 'Pure Cold-Pressed Herbal Elixirs',
    subheadline: 'Wildcrafted essential oils, botanical teas and organic skin infusions formulated in Margalla foothills.',
    rating: 4.95,
    reviewsCount: 64
  },
  {
    id: 'merch_04',
    slug: 'maison-eclair',
    name: 'Maison Éclair Pâtisserie',
    categoryTag: 'Patisserie',
    city: 'Lahore',
    country: 'Pakistan',
    address: 'Block T, Phase 2, DHA, Lahore',
    hours: '09:00 AM – 10:00 PM',
    openStatus: 'Open Now',
    deliveryFee: 250,
    warehouseCode: 'WH-LHE-04',
    phone: '+92 42 3572 1190',
    pricingRule: { type: 'percentage', value: 0.12, label: '+12% Chilled Transit Rule' },
    initial: 'M',
    bannerImg: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    headline: 'French Artisanal Viennoiserie',
    subheadline: 'Laminated slow-fermented croissants, sourdough brioche, and delicate choux baked freshly every morning.',
    rating: 4.7,
    reviewsCount: 110
  },
  {
    id: 'merch_05',
    slug: 'okara-dairy-farms',
    name: 'Sahiwal Gold Pure Dairy',
    categoryTag: 'Apothecary',
    city: 'Okara',
    country: 'Pakistan',
    address: 'Depalpur Road, Agricultural Sector, Okara',
    hours: '07:00 AM – 08:00 PM',
    openStatus: 'Open Now',
    deliveryFee: 150,
    warehouseCode: 'WH-OKR-01',
    phone: '+92 44 2521 8900',
    pricingRule: { type: 'fixed', value: 0, label: 'Direct Farm Price' },
    initial: 'S',
    bannerImg: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=1200&q=80',
    headline: 'Organic Desi Ghee & Raw Honey',
    subheadline: 'Grass-fed A2 cow ghee and wild sidr honey extracted directly in Okara farming reserves.',
    rating: 4.9,
    reviewsCount: 78
  }
];

const PRODUCTS = [
  {
    id: 'prod_01',
    merchantId: 'merch_01',
    title: 'Ethiopia Yirgacheffe G1 Kochere',
    category: 'Single Origin',
    sku: 'VQ-COF-YIRG-01',
    basePrice: 3200,
    unit: '250g bag',
    stock: 18,
    flavor: 'Jasmine, Bergamot, Honey, Peach',
    description: 'Heirloom Ethiopian varietal from smallholder farms in Kochere. Hand-picked, washed process with 72-hour raised bed sun drying. Roasted light-medium for pour-over excellence.',
    image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['Whole Bean', 'Pour Over (Medium)', 'Espresso (Fine)']
  },
  {
    id: 'prod_02',
    merchantId: 'merch_01',
    title: 'Colombia Huila Pink Bourbon Reserve',
    category: 'Single Origin',
    sku: 'VQ-COF-HUI-02',
    basePrice: 3600,
    unit: '250g bag',
    stock: 12,
    flavor: 'Pink Grapefruit, Papaya, Brown Sugar',
    description: 'Rare Pink Bourbon mutation cultivated at 1,850 MASL by Finca El Paraiso. Anaerobic fermentation brings out electrifying tropical acidity and clean sweetness.',
    image: 'https://images.unsplash.com/photo-1559525839-8f81ae0b8bf3?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1559525839-8f81ae0b8bf3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['Whole Bean', 'Aeropress', 'French Press']
  },
  {
    id: 'prod_03',
    merchantId: 'merch_01',
    title: 'Midnight Velvet Espresso Blend',
    category: 'Signature Blend',
    sku: 'VQ-COF-BLND-03',
    basePrice: 2800,
    unit: '500g bag',
    stock: 35,
    flavor: 'Dark Chocolate, Roasted Hazelnut, Caramel',
    description: '50% Brazil Cerrado + 50% Guatemala Antigua. Designed for silky espresso extraction and rich milk integration. Roasted medium-dark with zero harshness.',
    image: 'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['Whole Bean', 'Fine Espresso', 'Moka Pot']
  },
  {
    id: 'prod_04',
    merchantId: 'merch_01',
    title: 'Precision Ceramic Conical Dripper 02',
    category: 'Equipment',
    sku: 'VQ-EQP-DRIP-04',
    basePrice: 4200,
    unit: '1 unit',
    stock: 8,
    flavor: 'Matte Charcoal / Ribbed Airflow Channels',
    description: 'Architectural ceramic cone with 60-degree internal spirals engineered for uniform water dispersion and consistent 3-minute brew times.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['Matte Black', 'Sand Ochre', 'Pristine White']
  },
  {
    id: 'prod_05',
    merchantId: 'merch_02',
    title: 'Raw Sandstone Coffee Tumbler 220ml',
    category: 'Drinkware',
    sku: 'VQ-CER-TUMB-01',
    basePrice: 2100,
    unit: '1 Tumbler',
    stock: 24,
    flavor: 'Unglazed Exterior / Silk Satin Glaze Lip',
    description: 'Wheel-thrown stoneware fired at 1,280°C. Ergonomic thumb indents provide comfortable heat insulation.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['Raw Earth', 'Chalk Glaze', 'Ash Slate']
  },
  {
    id: 'prod_06',
    merchantId: 'merch_02',
    title: 'Minimalist Fluted Serving Carafe 650ml',
    category: 'Tableware',
    sku: 'VQ-CER-CARF-02',
    basePrice: 3800,
    unit: '1 Carafe',
    stock: 10,
    flavor: 'Sculptural Spout / Non-drip Precision',
    description: 'Minimalist pour vessel suited for pour-over servers, batch brews or tabletop decanting.',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['Natural Stoneware', 'Charcoal Glaze']
  },
  {
    id: 'prod_07',
    merchantId: 'merch_03',
    title: 'Margalla Cedarwood Botanical Oil',
    category: 'Aromatics',
    sku: 'VQ-BOT-OIL-01',
    basePrice: 2400,
    unit: '30ml bottle',
    stock: 15,
    flavor: 'Earthy Balsam, Smoky Wood, Fresh Rain',
    description: 'Pure steam-distilled Himalayan cedar needles blended with Haitian vetiver root in cold-pressed golden jojoba oil.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['30ml Dropper', '50ml Spray']
  },
  {
    id: 'prod_08',
    merchantId: 'merch_03',
    title: 'Swat Chamomile & Spearmint Infusion',
    category: 'Loose Tea',
    sku: 'VQ-BOT-TEA-02',
    basePrice: 1650,
    unit: '100g tin',
    stock: 28,
    flavor: 'Golden Flower, Wild Mint, Calming Crispness',
    description: 'Organic whole chamomile heads harvested from Swat valley gardens. Naturally caffeine-free bedtime blend.',
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['100g Tin', '250g Refill Bag']
  },
  {
    id: 'prod_09',
    merchantId: 'merch_04',
    title: 'Isigny Butter Croissant (Box of 4)',
    category: 'Viennoiserie',
    sku: 'VQ-BAK-CRS-01',
    basePrice: 1950,
    unit: 'Box of 4',
    stock: 20,
    flavor: '72-layer Honeycomb, Cultured Butter',
    description: 'Hand-rolled with Normandy churned butter. Crispy flaky golden crust and tender honeycomb crumb.',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['Classic Butter', 'Pain au Chocolat']
  },
  {
    id: 'prod_10',
    merchantId: 'merch_05',
    title: 'Traditional Bilona A2 Desi Cow Ghee',
    category: 'Organic Farm',
    sku: 'VQ-FAR-GHE-01',
    basePrice: 3200,
    unit: '1 kg glass jar',
    stock: 30,
    flavor: 'Nutty Aroma, Golden Grainy Texture',
    description: 'Prepared using traditional curd churning (bilona method) from pure grass-fed Sahiwal cow milk in Okara.',
    image: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=700&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=700&q=80'
    ],
    variants: ['1 kg Jar', '500g Jar']
  }
];

const calculateOnlinePrice = (product, merchant) => {
  if (!merchant || !product) return product?.basePrice || 0;
  if (merchant.pricingRule.type === 'fixed' && merchant.pricingRule.value > 0) {
    return merchant.pricingRule.value;
  }
  if (merchant.pricingRule.type === 'percentage') {
    const adjusted = product.basePrice * (1 + merchant.pricingRule.value);
    return Math.round(adjusted / 10) * 10;
  }
  return product.basePrice;
};

const playAudioEffect = (type, enabled = true) => {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'add') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'order') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'remove') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    // Graceful fallback if audio is restricted
  }
};

export default function App() {
  const canvasRef = useRef(null);
  const [isDark, setIsDark] = useState(true);
  const [view, setView] = useState('marketplace'); // 'marketplace' | 'store' | 'cart' | 'tracking'
  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [marketCategory, setMarketCategory] = useState('All');
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentMerchant, setCurrentMerchant] = useState(MERCHANTS[0]);
  const [storeCategory, setStoreCategory] = useState('All');
  const [storeSearch, setStoreSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cart & checkout states
  const [cart, setCart] = useState([]);
  const [fulfilmentMethod, setFulfilmentMethod] = useState('delivery');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Guest order inputs
  const [guestName, setGuestName] = useState('Harris Vance');
  const [guestPhone, setGuestPhone] = useState('300 1234567');
  const [guestAddress, setGuestAddress] = useState('House 42-B, Block C, Model Town');
  const [guestNotes, setGuestNotes] = useState('Ring bell twice on arrival');
  const [paymentChoice, setPaymentChoice] = useState('cod');

  // Modals & PDP states
  const [pdpProduct, setPdpProduct] = useState(null);
  const [pdpVariant, setPdpVariant] = useState('');
  const [pdpQty, setPdpQty] = useState(1);
  const [pdpActiveImg, setPdpActiveImg] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Simulated Order Tracking state
  const [activeOrder, setActiveOrder] = useState({
    orderNumber: 'VQ-2026-9812',
    token: 'tok_vq_9a8fc4b2e',
    merchant: MERCHANTS[0],
    customer: {
      name: 'Harris Vance',
      phone: '+92 300 1234567',
      address: 'House 42-B, Block C, Model Town, Lahore',
      notes: 'Ring bell on arrival at front gate'
    },
    fulfilment: 'delivery',
    paymentMethod: 'cod',
    paymentStatus: 'Unpaid (COD)',
    state: 'dispatched',
    items: [
      { title: 'Ethiopia Yirgacheffe G1 Kochere (Whole Bean)', qty: 1, unitPrice: 3520 }
    ],
    deliveryFee: 250,
    discount: 0,
    subtotal: 3520,
    total: 3770,
    timestamp: '04:30 AM'
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.45 + 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = isDark ? 'rgba(204, 162, 110, 0.4)' : 'rgba(168, 121, 56, 0.28)';
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  const triggerToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const filteredMerchants = useMemo(() => {
    const q = globalSearch.toLowerCase().trim();
    return MERCHANTS.filter(m => {
      const matchCity = selectedCity === 'All' || m.city.toLowerCase() === selectedCity.toLowerCase();
      const matchCat = marketCategory === 'All' || m.categoryTag === marketCategory;
      const matchSearch =
        m.name.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q) ||
        m.subheadline.toLowerCase().includes(q);
      return matchCity && matchCat && matchSearch;
    });
  }, [selectedCity, marketCategory, globalSearch]);

  const crossStoreMatchedProducts = useMemo(() => {
    const q = globalSearch.toLowerCase().trim();
    if (q.length < 2) return [];
    return PRODUCTS.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.flavor.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }, [globalSearch]);

  const currentStoreProducts = useMemo(() => {
    const q = storeSearch.toLowerCase().trim();
    return PRODUCTS.filter(p => {
      if (p.merchantId !== currentMerchant.id) return false;
      const matchCat = storeCategory === 'All' || p.category === storeCategory;
      const matchSearch = p.title.toLowerCase().includes(q) || p.flavor.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [currentMerchant, storeCategory, storeSearch]);

  const currentStoreCategories = useMemo(() => {
    const products = PRODUCTS.filter(p => p.merchantId === currentMerchant.id);
    return ['All', ...new Set(products.map(p => p.category))];
  }, [currentMerchant]);

  const totalCartCount = useMemo(() => cart.reduce((sum, it) => sum + it.qty, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((sum, it) => sum + (it.onlinePrice * it.qty), 0), [cart]);
  const couponDiscount = useMemo(() => {
    return appliedCoupon ? Math.round(cartSubtotal * appliedCoupon.discountRate) : 0;
  }, [appliedCoupon, cartSubtotal]);
  const activeDeliveryFee = fulfilmentMethod === 'delivery' ? currentMerchant.deliveryFee : 0;
  const taxPortion = useMemo(() => Math.round((cartSubtotal - couponDiscount) * 0.16), [cartSubtotal, couponDiscount]);
  const grandTotal = useMemo(() => Math.max(0, cartSubtotal - couponDiscount + activeDeliveryFee), [cartSubtotal, couponDiscount, activeDeliveryFee]);

  const handleAddToCart = (product, qty = 1, variant = null) => {
    const targetMerchant = MERCHANTS.find(m => m.id === product.merchantId) || currentMerchant;
    const finalVariant = variant || (product.variants ? product.variants[0] : 'Standard');
    const onlinePrice = calculateOnlinePrice(product, targetMerchant);

    if (cart.length > 0 && currentMerchant.id !== targetMerchant.id) {
      triggerToast(`Cart switched to ${targetMerchant.name}. Single-seller checkout enforced.`, 'info');
      setCart([{ product, qty, variant: finalVariant, onlinePrice }]);
      setCurrentMerchant(targetMerchant);
    } else {
      setCart(prev => {
        const existingIdx = prev.findIndex(item => item.product.id === product.id && item.variant === finalVariant);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx].qty += qty;
          return updated;
        }
        return [...prev, { product, qty, variant: finalVariant, onlinePrice }];
      });
      if (currentMerchant.id !== targetMerchant.id) {
        setCurrentMerchant(targetMerchant);
      }
    }

    playAudioEffect('add', soundEnabled);
    triggerToast(`Added ${qty}x ${product.title} to bag`, 'success');
  };

  const handleUpdateCartQty = (index, delta) => {
    setCart(prev => {
      const next = [...prev];
      next[index].qty += delta;
      if (next[index].qty <= 0) {
        playAudioEffect('remove', soundEnabled);
        return next.filter((_, i) => i !== index);
      }
      playAudioEffect('click', soundEnabled);
      return next;
    });
  };

  const handleOpenPdp = (product) => {
    setPdpProduct(product);
    setPdpVariant(product.variants ? product.variants[0] : 'Standard');
    setPdpQty(1);
    setPdpActiveImg(product.image);
    playAudioEffect('click', soundEnabled);
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (code === 'VENQORE10') {
      setAppliedCoupon({ code: 'VENQORE10', discountRate: 0.10 });
      playAudioEffect('add', soundEnabled);
      triggerToast('Coupon applied: 10% voucher discount activated!', 'success');
    } else if (!code) {
      setAppliedCoupon(null);
    } else {
      playAudioEffect('click', soundEnabled);
      triggerToast('Invalid coupon code. Try VENQORE10', 'error');
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerToast('Your bag is empty. Please add items.', 'error');
      return;
    }

    const orderNumber = 'VQ-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      orderNumber,
      token: 'tok_vq_' + Math.random().toString(36).substring(2, 12),
      merchant: currentMerchant,
      customer: {
        name: guestName,
        phone: '+92 ' + guestPhone,
        address: fulfilmentMethod === 'delivery' ? guestAddress : `Store Pickup (${currentMerchant.name})`,
        notes: guestNotes
      },
      fulfilment: fulfilmentMethod,
      paymentMethod: paymentChoice,
      paymentStatus: paymentChoice === 'cod' ? 'Unpaid (COD)' : 'Pending Bank Transfer Verification',
      state: 'pending',
      items: cart.map(item => ({
        title: `${item.product.title} (${item.variant})`,
        qty: item.qty,
        unitPrice: item.onlinePrice
      })),
      deliveryFee: activeDeliveryFee,
      discount: couponDiscount,
      subtotal: cartSubtotal,
      total: grandTotal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setActiveOrder(newOrder);
    setCart([]);
    playAudioEffect('order', soundEnabled);
    triggerToast(`Order ${orderNumber} created successfully!`, 'success');
    setView('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const advanceOrderStage = (nextState) => {
    setActiveOrder(prev => ({
      ...prev,
      state: nextState,
      paymentStatus: nextState === 'completed' ? 'Paid & Reconciled' : prev.paymentStatus
    }));
    playAudioEffect('click', soundEnabled);
    triggerToast(`Merchant simulator updated stage: ${nextState.toUpperCase()}`, 'info');
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-[#cca26e] selection:text-black flex flex-col relative pb-28 md:pb-8 ${
      isDark ? 'theme-dark bg-[#07080a] text-zinc-100' : 'theme-light bg-[#f8f6f0] text-zinc-900'
    }`}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');

        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'Space Grotesk', monospace; }

        .theme-dark {
          --glass-nav: rgba(7, 8, 10, 0.88);
          --glass-panel: linear-gradient(135deg, rgba(22, 25, 32, 0.78) 0%, rgba(13, 15, 19, 0.94) 100%);
          --card-bg: #101216;
          --card-elevated: #161920;
          --card-border: rgba(255, 255, 255, 0.07);
          --card-border-hover: rgba(204, 162, 110, 0.5);
          --text-main: #f4f4f5;
          --text-muted: #a1a1aa;
          --gold-text: linear-gradient(135deg, #f7f2e7 0%, #caa26e 50%, #bd8b4b 100%);
          --gold-primary: #cca26e;
          --gold-glow: rgba(204, 162, 110, 0.22);
          --input-bg: #0b0d11;
          --input-border: #232731;
          --map-bg: #0c0e12;
        }

        .theme-light {
          --glass-nav: rgba(248, 246, 240, 0.9);
          --glass-panel: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 241, 232, 0.92) 100%);
          --card-bg: #ffffff;
          --card-elevated: #faf7f2;
          --card-border: rgba(0, 0, 0, 0.08);
          --card-border-hover: rgba(168, 121, 56, 0.6);
          --text-main: #18181b;
          --text-muted: #52525b;
          --gold-text: linear-gradient(135deg, #18181b 0%, #9e6d2b 55%, #785018 100%);
          --gold-primary: #a87938;
          --gold-glow: rgba(168, 121, 56, 0.16);
          --input-bg: #ffffff;
          --input-border: #ded8cb;
          --map-bg: #ede8dc;
        }

        .glass-nav-theme {
          background: var(--glass-nav);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--card-border);
        }

        .glass-panel-theme {
          background: var(--glass-panel);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .luxury-card-theme {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .luxury-card-theme:hover {
          border-color: var(--card-border-hover);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -15px var(--gold-glow);
        }

        .gold-gradient-text {
          background: var(--gold-text);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .transit-active-curve {
          stroke-dasharray: 8, 6;
          animation: dashAnimation 2s linear infinite;
        }

        @keyframes dashAnimation {
          from { stroke-dashoffset: 28; }
          to { stroke-dashoffset: 0; }
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @media (max-width: 640px) {
          input, textarea, select {
            font-size: 16px !important;
          }
        }
      `}</style>

      {/* Interactive Particle Canvas Aura */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-45"></canvas>

      {/* Ambient Gradient Glow Spheres */}
      <div className={`fixed -top-40 -left-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none z-0 transition-opacity duration-700 ${
        isDark ? 'bg-[#cca26e]/10 opacity-70' : 'bg-[#caa26e]/20 opacity-50'
      }`}></div>
      <div className={`fixed -bottom-40 -right-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none z-0 transition-opacity duration-700 ${
        isDark ? 'bg-[#bd8b4b]/10 opacity-70' : 'bg-[#bd8b4b]/15 opacity-40'
      }`}></div>

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-medium shadow-2xl backdrop-blur-md transition-all duration-300 ${
              toast.type === 'success'
                ? isDark
                  ? 'border-emerald-500/40 bg-zinc-950/95 text-emerald-400'
                  : 'border-emerald-600/30 bg-white/95 text-emerald-700 shadow-md'
                : toast.type === 'error'
                ? isDark
                  ? 'border-rose-500/40 bg-zinc-950/95 text-rose-400'
                  : 'border-rose-600/30 bg-white/95 text-rose-700 shadow-md'
                : isDark
                ? 'border-[#cca26e]/40 bg-zinc-950/95 text-[#dfc29c]'
                : 'border-[#a87938]/30 bg-white/95 text-[#7c5220] shadow-md'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Info className={`w-4 h-4 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {}
      <header className="sticky top-0 z-40 w-full glass-nav-theme transition-all">
        {/* Top Micro-Bar */}
        <div className={`px-4 py-1.5 text-xs border-b transition-colors ${
          isDark
            ? 'text-zinc-400 border-zinc-800/40 bg-zinc-950/70'
            : 'text-zinc-600 border-zinc-200/80 bg-[#f4f0e6]/80'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                VenQore Commerce
              </span>
              <span className={`${isDark ? 'text-zinc-700' : 'text-zinc-300'} hidden sm:inline`}>•</span>
              <span className="text-[11px] hidden sm:inline opacity-80">Direct Merchant Storefronts &amp; Live Fulfillment</span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <MapPin className={`w-3.5 h-3.5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                <span className={`${isDark ? 'text-zinc-500' : 'text-zinc-500'} hidden sm:inline`}>Location:</span>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    triggerToast(`Location set to ${e.target.value}`, 'info');
                    playAudioEffect('click', soundEnabled);
                  }}
                  className={`bg-transparent font-semibold text-xs focus:outline-none cursor-pointer underline underline-offset-4 transition ${
                    isDark
                      ? 'text-white decoration-zinc-700 hover:decoration-[#cca26e]'
                      : 'text-zinc-900 decoration-zinc-300 hover:decoration-[#a87938]'
                  }`}
                >
                  <option value="All" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>All Locations (Pakistan)</option>
                  <option value="Lahore" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>Lahore</option>
                  <option value="Karachi" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>Karachi</option>
                  <option value="Islamabad" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>Islamabad</option>
                  <option value="Okara" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>Okara</option>
                </select>
              </div>

              <span className={isDark ? 'text-zinc-800' : 'text-zinc-300'}>|</span>

              <button
                onClick={() => {
                  setView('tracking');
                  playAudioEffect('click', soundEnabled);
                }}
                className={`transition flex items-center gap-1.5 text-xs ${
                  isDark ? 'hover:text-[#dfc29c] text-zinc-400' : 'hover:text-[#a87938] text-zinc-600'
                }`}
              >
                <Bike className={`w-3.5 h-3.5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                <span>Track Order</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setView('marketplace');
                playAudioEffect('click', soundEnabled);
              }}
              className="flex items-center gap-3 group text-left focus:outline-none"
            >
              <div className={`w-10 h-10 rounded-2xl p-[1px] shadow-lg transition-transform group-hover:scale-105 ${
                isDark
                  ? 'bg-gradient-to-tr from-[#cca26e] to-[#f7f2e7] shadow-[#cca26e]/10'
                  : 'bg-gradient-to-tr from-[#a87938] to-[#18181b] shadow-amber-900/10'
              }`}>
                <div className={`w-full h-full rounded-[15px] flex items-center justify-center font-display font-black text-lg ${
                  isDark ? 'bg-[#07080a] text-[#cca26e]' : 'bg-white text-[#a87938]'
                }`}>
                  V
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`font-display font-bold text-base sm:text-lg transition ${
                    isDark ? 'text-white group-hover:text-[#dfc29c]' : 'text-zinc-900 group-hover:text-[#a87938]'
                  }`}>VenQore</h1>
                  <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${
                    isDark
                      ? 'bg-[#cca26e]/10 text-[#cca26e] border-[#cca26e]/20'
                      : 'bg-[#a87938]/10 text-[#a87938] border-[#a87938]/20'
                  }`}>Storefronts</span>
                </div>
                <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Verified Independent Network
                </p>
              </div>
            </button>

            {/* Active Store Breadcrumb */}
            <div className={`hidden lg:flex items-center gap-2 pl-4 border-l ${isDark ? 'border-zinc-800' : 'border-zinc-300'}`}>
              <ArrowRight className={`w-3 h-3 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border max-w-xs truncate ${
                isDark
                  ? 'text-[#dfc29c] bg-[#cca26e]/10 border-[#cca26e]/20'
                  : 'text-[#7c5220] bg-[#a87938]/10 border-[#a87938]/20'
              }`}>
                {currentMerchant.name}
              </span>
            </div>
          </div>

          {/* Desktop Center Navigation Tabs */}
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-full border shadow-inner ${
            isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-200/70 border-zinc-300/80'
          }`}>
            <button
              onClick={() => { setView('marketplace'); playAudioEffect('click', soundEnabled); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                view === 'marketplace'
                  ? isDark ? 'bg-zinc-800 text-white shadow' : 'bg-white text-zinc-950 shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Discover Stores
            </button>
            <button
              onClick={() => { setView('store'); playAudioEffect('click', soundEnabled); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                view === 'store'
                  ? isDark ? 'bg-zinc-800 text-white shadow' : 'bg-white text-zinc-950 shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Store className="w-3.5 h-3.5" /> Merchant Store
            </button>
            <button
              onClick={() => { setView('cart'); playAudioEffect('click', soundEnabled); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                view === 'cart'
                  ? isDark ? 'bg-zinc-800 text-white shadow' : 'bg-white text-zinc-950 shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Cart Bag
            </button>
            <button
              onClick={() => { setView('tracking'); playAudioEffect('click', soundEnabled); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                view === 'tracking'
                  ? isDark ? 'bg-zinc-800 text-white shadow' : 'bg-white text-zinc-950 shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Bike className="w-3.5 h-3.5" /> Live Tracking
            </button>
          </nav>

          {/* Right Action Icons: Theme Switcher, Audio, Cart Bag */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                setIsDark(prev => !prev);
                playAudioEffect('click', soundEnabled);
                triggerToast(!isDark ? 'Switched to Obsidian Dark' : 'Switched to Alabaster Light', 'info');
              }}
              className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition active:scale-95 ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  : 'bg-white border-zinc-300 text-zinc-800 hover:text-zinc-950 shadow-sm'
              }`}
              title="Toggle Light / Dark Mode"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-[#cca26e]" />
                  <span className="hidden sm:inline text-[11px] font-medium">Dark</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#a87938]" />
                  <span className="hidden sm:inline text-[11px] font-medium">Light</span>
                </>
              )}
            </button>

            {/* Micro-Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(prev => !prev);
                triggerToast(soundEnabled ? 'Micro-audio muted' : 'Micro-audio enabled', 'info');
              }}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  : 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-950 shadow-sm'
              }`}
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? (
                <Volume2 className={`w-4 h-4 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {/* Shopping Bag Trigger Button */}
            <button
              onClick={() => { setView('cart'); playAudioEffect('click', soundEnabled); }}
              className={`group font-bold px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-lg active:scale-95 transition ${
                isDark
                  ? 'bg-gradient-to-r from-[#bd8b4b] to-[#cca26e] hover:from-[#cca26e] hover:to-[#dfc29c] text-zinc-950 shadow-[#cca26e]/20'
                  : 'bg-gradient-to-r from-[#a87938] to-[#c59852] hover:from-[#966a2e] hover:to-[#b38743] text-white shadow-amber-900/15'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wider">BAG</span>
              <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-900 text-white'
              }`}>
                {totalCartCount}
              </span>
              <span className="text-xs font-mono font-bold hidden sm:inline ml-0.5 border-l border-black/20 pl-2">
                Rs. {grandTotal.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </header>

      {}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">

        {view === 'marketplace' && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero Showcase Banner */}
            <section className="relative rounded-3xl overflow-hidden glass-panel-theme p-6 sm:p-12 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    isDark
                      ? 'bg-[#cca26e]/10 border border-[#cca26e]/20 text-[#dfc29c]'
                      : 'bg-[#a87938]/10 border border-[#a87938]/20 text-[#7c5220]'
                  }`}>
                    <Compass className={`w-3.5 h-3.5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                    <span>Country → City → Business → Direct Storefront Catalogue</span>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-tight">
                      Discover Verified <br />
                      <span className="gold-gradient-text">Independent Storefronts</span>
                    </h2>
                    <p className={`text-sm sm:text-base max-w-2xl font-normal leading-relaxed ${
                      isDark ? 'text-zinc-400' : 'text-zinc-600'
                    }`}>
                      Connect directly with artisanal roasters, studio potters, herbal apothecaries, and gourmet makers. Browse live warehouse catalogues, checkout as guest, and track order fulfillment in real time.
                    </p>
                  </div>

                  {/* Unified Global Search Bar */}
                  <div className="pt-2 max-w-2xl">
                    <div className={`relative flex items-center rounded-2xl p-2 shadow-2xl transition-all ${
                      isDark
                        ? 'bg-zinc-950/90 border border-zinc-700/80 focus-within:border-[#cca26e]'
                        : 'bg-white border border-zinc-300 focus-within:border-[#a87938]'
                    }`}>
                      <Search className={`w-5 h-5 ml-3 mr-2 ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`} />
                      <input
                        type="text"
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        placeholder="Search any store, coffee roast, ceramics, tea, croissant, or SKU..."
                        className={`w-full bg-transparent text-sm focus:outline-none px-2 py-1.5 ${
                          isDark ? 'text-white placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'
                        }`}
                      />
                      {globalSearch && (
                        <button
                          onClick={() => setGlobalSearch('')}
                          className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] shrink-0 ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                      }`}>
                        <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                        <span>Live Search</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Hero Highlights */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                  <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isDark ? 'bg-[#cca26e]/10 border-[#cca26e]/20 text-[#cca26e]' : 'bg-[#a87938]/10 border-[#a87938]/20 text-[#a87938]'
                    }`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Zero Merchant Markup</h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Direct orders synced with merchant ERP central warehouses.</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Guest Checkout</h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>No forced accounts. High-entropy private order tracking link.</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Real-Time Dispatch</h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Track kitchen prep, packaging, and rider courier transit.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Cross-Store Matching Products Shelf */}
            {crossStoreMatchedProducts.length > 0 && (
              <section className={`space-y-4 rounded-3xl border p-6 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Matching Products Across All Stores</h4>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{crossStoreMatchedProducts.length} items found</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {crossStoreMatchedProducts.map(p => {
                    const merch = MERCHANTS.find(m => m.id === p.merchantId);
                    const price = calculateOnlinePrice(p, merch);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (merch) setCurrentMerchant(merch);
                          handleOpenPdp(p);
                        }}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 group ${
                          isDark
                            ? 'bg-zinc-900/90 border-zinc-800 hover:border-[#cca26e]'
                            : 'bg-zinc-50 border-zinc-200 hover:border-[#a87938]'
                        }`}
                      >
                        <img src={p.image} alt={p.title} className="w-12 h-12 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform" />
                        <div className="min-w-0 flex-1">
                          <span className={`text-[10px] font-mono block ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`}>
                            {merch?.name}
                          </span>
                          <h5 className="text-xs font-bold truncate">{p.title}</h5>
                          <span className={`text-xs font-mono font-semibold ${isDark ? 'text-[#dfc29c]' : 'text-[#7c5220]'}`}>
                            Rs. {price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Merchant Directory Section */}
            <section className="space-y-6">
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
                isDark ? 'border-zinc-800' : 'border-zinc-300'
              }`}>
                <div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? 'text-[#cca26e]' : 'text-[#a87938]'
                  }`}>Independent Merchant Network</span>
                  <h3 className="text-2xl font-display font-bold tracking-tight">
                    {selectedCity === 'All' ? 'All Verified Businesses' : `Verified Businesses in ${selectedCity}`}
                  </h3>
                </div>

                {/* Touch-Friendly Category Filter Carousel */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  {['All', 'Roastery', 'Ceramics', 'Apothecary', 'Patisserie'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setMarketCategory(cat);
                        playAudioEffect('click', soundEnabled);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        marketCategory === cat
                          ? isDark ? 'bg-[#cca26e] text-zinc-950 font-bold' : 'bg-[#a87938] text-white font-bold shadow-sm'
                          : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-300'
                      }`}
                    >
                      {cat === 'All' ? 'All Businesses' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMerchants.length === 0 ? (
                  <div className="col-span-full py-16 text-center space-y-3">
                    <Store className="w-12 h-12 text-zinc-400 mx-auto" />
                    <p className="text-base font-semibold">No merchants found in {selectedCity}</p>
                    <p className="text-xs text-zinc-500">Try changing your location or category filter.</p>
                  </div>
                ) : (
                  filteredMerchants.map(m => {
                    const merchProducts = PRODUCTS.filter(p => p.merchantId === m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setCurrentMerchant(m);
                          setView('store');
                          playAudioEffect('click', soundEnabled);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group rounded-3xl luxury-card-theme overflow-hidden cursor-pointer flex flex-col justify-between"
                      >
                        <div className="relative h-48 bg-zinc-900 overflow-hidden">
                          <img src={m.bannerImg} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
                            isDark ? 'from-[#07080a]' : 'from-[#ffffff]'
                          }`}></div>

                          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                            isDark ? 'bg-zinc-950/85 text-[#dfc29c] border-zinc-800' : 'bg-white/90 text-[#7c5220] border-zinc-200'
                          }`}>
                            <MapPin className="w-3 h-3 inline mr-1" /> {m.city}
                          </span>

                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950/85 dark:bg-emerald-950/85 text-emerald-400 border border-emerald-800 backdrop-blur-md">
                            {m.openStatus}
                          </span>

                          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl font-display font-bold flex items-center justify-center shrink-0 shadow-lg text-lg border ${
                              isDark
                                ? 'bg-zinc-900/90 border-zinc-700 text-[#cca26e]'
                                : 'bg-white border-zinc-200 text-[#a87938]'
                            }`}>
                              {m.initial}
                            </div>
                            <div>
                              <h4 className={`text-base font-display font-bold transition line-clamp-1 ${
                                isDark ? 'text-white group-hover:text-[#dfc29c]' : 'text-zinc-900 group-hover:text-[#a87938]'
                              }`}>{m.name}</h4>
                              <p className="text-[11px] opacity-75 font-mono">{m.hours}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {m.subheadline}
                          </p>

                          <div className={`pt-3 border-t space-y-2 ${isDark ? 'border-zinc-800/80' : 'border-zinc-200'}`}>
                            <div className="flex items-center justify-between text-[11px] opacity-75">
                              <span>Catalogue preview ({merchProducts.length} items)</span>
                              <span className={`font-medium ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`}>
                                Flat Delivery: Rs. {m.deliveryFee}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 overflow-hidden">
                              {merchProducts.slice(0, 3).map(p => (
                                <div key={p.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] whitespace-nowrap truncate max-w-[130px] ${
                                  isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? 'bg-[#cca26e]' : 'bg-[#a87938]'}`}></span>
                                  <span className="truncate">{p.title.split(' ')[0]} {p.title.split(' ')[1] || ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2">
                            <div className={`w-full py-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                              isDark
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-200 group-hover:bg-[#cca26e] group-hover:text-zinc-950 group-hover:border-transparent'
                                : 'bg-zinc-100 border-zinc-200 text-zinc-800 group-hover:bg-[#a87938] group-hover:text-white group-hover:border-transparent'
                            }`}>
                              <span>Enter Storefront</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {}
        {view === 'store' && (
          <div className="space-y-10 animate-fade-in">
            {/* Top Navigation */}
            <div className="flex items-center justify-between pb-2">
              <button
                onClick={() => { setView('marketplace'); playAudioEffect('click', soundEnabled); }}
                className={`inline-flex items-center gap-2 text-xs font-medium transition group ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                <span>Return to All Stores Directory</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition ${
                    isDark ? 'text-zinc-300 hover:text-white bg-zinc-900 border-zinc-800' : 'text-zinc-700 hover:text-zinc-950 bg-white border-zinc-300 shadow-sm'
                  }`}
                >
                  <Share2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                  <span>Share Storefront</span>
                </button>
              </div>
            </div>

            {/* Merchant Storefront Hero Card */}
            <section className="relative rounded-3xl overflow-hidden glass-panel-theme shadow-2xl">
              <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                <img src={currentMerchant.bannerImg} alt={currentMerchant.name} className="w-full h-full object-cover object-center filter brightness-[0.7]" />
                <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
                  isDark ? 'from-[#07080a]' : 'from-[#ffffff]'
                }`}></div>
                
                <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold shadow ${
                  isDark ? 'bg-zinc-950/80 border-zinc-800 text-white' : 'bg-white/90 border-zinc-200 text-zinc-900'
                }`}>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{currentMerchant.rating}</span>
                  <span className="opacity-70 font-normal">({currentMerchant.reviewsCount} reviews)</span>
                </div>
              </div>

              <div className="relative px-6 sm:px-10 pb-8 -mt-16 sm:-mt-20 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 p-1 shadow-2xl ${
                    isDark ? 'bg-zinc-900 border-[#cca26e]/40' : 'bg-white border-[#a87938]/40'
                  }`}>
                    <div className={`w-full h-full rounded-[22px] flex items-center justify-center font-display font-black text-3xl sm:text-4xl shadow-inner ${
                      isDark ? 'bg-[#07080a] text-[#cca26e]' : 'bg-[#faf7f2] text-[#a87938]'
                    }`}>
                      {currentMerchant.initial}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-2xl sm:text-3xl">{currentMerchant.name}</h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Merchant
                      </span>
                    </div>
                    <p className={`text-xs flex items-center gap-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      <MapPin className={`w-3.5 h-3.5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                      <span>{currentMerchant.address.split(',')[1] || currentMerchant.city}, {currentMerchant.city}</span>
                      <span className="opacity-40">•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{currentMerchant.openStatus} ({currentMerchant.hours})</span>
                    </p>
                    <p className={`text-xs sm:text-sm max-w-2xl pt-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {currentMerchant.subheadline}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                    isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-800 shadow-sm'
                  }`}>
                    <Bike className={`w-3.5 h-3.5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                    <span>Flat Delivery: <strong className="font-bold">Rs. {currentMerchant.deliveryFee}</strong></span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                    isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-800 shadow-sm'
                  }`}>
                    <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Pickup: <strong className="text-emerald-600 dark:text-emerald-400">Ready in 20m</strong></span>
                  </div>
                </div>
              </div>
            </section>

            {/* Store Catalogue Grid */}
            <section className="space-y-6 pt-2">
              <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b ${
                isDark ? 'border-zinc-800' : 'border-zinc-300'
              }`}>
                <div>
                  <div className={`flex items-center gap-2 text-xs font-semibold tracking-wider uppercase mb-1 ${
                    isDark ? 'text-[#cca26e]' : 'text-[#a87938]'
                  }`}>
                    <span>Published Inventory</span>
                    <span className="opacity-40">•</span>
                    <span className="opacity-75 font-normal">{currentMerchant.warehouseCode}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Store Catalogue</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      placeholder="Search in this store..."
                      className={`w-44 sm:w-56 pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none transition ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#cca26e]'
                          : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-[#a87938]'
                      }`}
                    />
                  </div>

                  <div className={`flex items-center gap-1.5 p-1 rounded-xl border no-scrollbar overflow-x-auto ${
                    isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-200/80 border-zinc-300'
                  }`}>
                    {currentStoreCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setStoreCategory(cat);
                          playAudioEffect('click', soundEnabled);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition ${
                          storeCategory === cat
                            ? isDark ? 'bg-[#cca26e] text-zinc-950 font-bold' : 'bg-[#a87938] text-white font-bold'
                            : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Precedence Transparency Banner (VenQore Roadmap 4.2) */}
              <div className={`rounded-2xl p-3.5 border flex items-center justify-between gap-4 text-xs ${
                isDark ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-[#cca26e]/10 border-[#cca26e]/20 text-[#cca26e]' : 'bg-[#a87938]/10 border-[#a87938]/20 text-[#a87938]'
                  }`}>
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200">VenQore Pricing Rule Active: </span>
                    <span>Storefront percentage rule applied over regular retail ERP price. Prices reflect tax inclusion.</span>
                  </div>
                </div>
                <span className={`hidden lg:inline text-[11px] font-mono px-2 py-0.5 rounded border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                }`}>
                  {currentMerchant.pricingRule.label}
                </span>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentStoreProducts.length === 0 ? (
                  <div className="col-span-full py-16 text-center space-y-3">
                    <Search className="w-10 h-10 text-zinc-400 mx-auto" />
                    <p className="text-sm font-medium">No products found in this category</p>
                    <p className="text-xs text-zinc-500">Try changing your search terms.</p>
                  </div>
                ) : (
                  currentStoreProducts.map(p => {
                    const onlinePrice = calculateOnlinePrice(p, currentMerchant);
                    return (
                      <div
                        key={p.id}
                        className="group rounded-3xl luxury-card-theme overflow-hidden flex flex-col justify-between"
                      >
                        <div className="relative h-52 sm:h-56 bg-zinc-900 overflow-hidden">
                          <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          
                          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md border ${
                            isDark ? 'bg-zinc-950/85 text-zinc-300 border-zinc-800' : 'bg-white/90 text-zinc-700 border-zinc-200'
                          }`}>
                            {p.category}
                          </span>

                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/85 text-emerald-400 border border-emerald-800/80 backdrop-blur-md">
                            {p.stock} left
                          </span>

                          <button
                            onClick={() => handleOpenPdp(p)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-xs font-semibold text-white transition-opacity duration-200"
                          >
                            <span className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700 shadow-lg flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" /> Quick View
                            </span>
                          </button>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[11px] font-mono text-zinc-500 block mb-0.5">{p.unit}</span>
                            <h4
                              onClick={() => handleOpenPdp(p)}
                              className={`text-base font-display font-bold transition cursor-pointer line-clamp-1 ${
                                isDark ? 'hover:text-[#dfc29c]' : 'hover:text-[#a87938]'
                              }`}
                            >
                              {p.title}
                            </h4>
                            <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                              {p.flavor}
                            </p>
                          </div>

                          <div className={`pt-3 border-t flex items-end justify-between ${isDark ? 'border-zinc-800/80' : 'border-zinc-200'}`}>
                            <div>
                              <div className="text-xs text-zinc-500 line-through">Rs. {p.basePrice.toLocaleString()}</div>
                              <div className="text-lg font-display font-bold">
                                Rs. {onlinePrice.toLocaleString()}
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddToCart(p, 1)}
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition active:scale-90 shadow-sm ${
                                isDark
                                  ? 'bg-zinc-900 hover:bg-[#cca26e] hover:text-zinc-950 border-zinc-800 text-zinc-300'
                                  : 'bg-zinc-100 hover:bg-[#a87938] hover:text-white border-zinc-300 text-zinc-700'
                              }`}
                              title="Quick Add to Bag"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {}
        {view === 'cart' && (
          <div className="space-y-8 animate-fade-in">
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-300'}`}>
              <div>
                <button
                  onClick={() => { setView('store'); playAudioEffect('click', soundEnabled); }}
                  className={`text-xs flex items-center gap-1.5 transition mb-1 ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue Shopping</span>
                </button>
                <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Order Bag &amp; Guest Checkout</h2>
              </div>

              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm'
              }`}>
                <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                <span>Secure Single-Merchant Checkout</span>
              </div>
            </div>

            {/* Merchant Scope Notice */}
            <div className={`rounded-2xl border p-4 flex items-center justify-between gap-4 text-xs ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isDark ? 'bg-[#cca26e]/20 text-[#cca26e]' : 'bg-[#a87938]/20 text-[#a87938]'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="opacity-75">Current Merchant:</span>
                  <span className="font-semibold ml-1">{currentMerchant.name}</span>
                  <span className="opacity-60 block text-[11px]">VenQore single-seller checkout contract (MVP 4.4). All items ship from one hub.</span>
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    setCart([]);
                    playAudioEffect('remove', soundEnabled);
                    triggerToast('Bag emptied', 'info');
                  }}
                  className="text-rose-600 dark:text-rose-400 text-xs font-medium transition hover:underline"
                >
                  Empty Bag
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Bag Items Table */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-3xl luxury-card-theme p-6 space-y-4">
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag className={`w-4 h-4 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                      <span>Bag Items ({totalCartCount})</span>
                    </h3>
                    <span className="text-xs opacity-60 font-mono">Currency: PKR (Rs.)</span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <ShoppingBag className="w-12 h-12 text-zinc-400 mx-auto" />
                      <p className="text-sm font-semibold">Your bag is empty</p>
                      <p className="text-xs text-zinc-500">Explore the fresh catalogue to add items.</p>
                      <button
                        onClick={() => { setView('store'); playAudioEffect('click', soundEnabled); }}
                        className={`mt-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                          isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900'
                        }`}
                      >
                        Browse Catalogue
                      </button>
                    </div>
                  ) : (
                    <div className={`divide-y ${isDark ? 'divide-zinc-800/80' : 'divide-zinc-200'}`}>
                      {cart.map((item, idx) => (
                        <div key={`${item.product.id}-${item.variant}`} className="py-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={item.product.image} alt={item.product.title} className="w-14 h-14 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800" />
                            <div>
                              <h4 className="text-xs sm:text-sm font-semibold line-clamp-1">{item.product.title}</h4>
                              <div className={`flex items-center gap-2 text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                <span>{item.variant}</span>
                                <span>•</span>
                                <span className="font-mono">Rs. {item.onlinePrice.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-6">
                            <div className={`flex items-center rounded-lg border p-0.5 ${
                              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
                            }`}>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(idx, -1)}
                                className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                                  isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-zinc-900 hover:bg-zinc-200'
                                }`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-mono font-bold">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(idx, 1)}
                                className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                                  isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-zinc-900 hover:bg-zinc-200'
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right min-w-[70px]">
                              <div className={`text-xs sm:text-sm font-mono font-bold ${
                                isDark ? 'text-[#dfc29c]' : 'text-[#7c5220]'
                              }`}>
                                Rs. {(item.onlinePrice * item.qty).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coupon Voucher Field */}
                <div className="rounded-2xl luxury-card-theme p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Ticket className={`w-4 h-4 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter coupon (e.g. VENQORE10)"
                      className="w-full bg-transparent text-xs placeholder-zinc-500 focus:outline-none uppercase font-mono"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                      isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900'
                    }`}
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Right Column: Checkout Details Form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-3xl luxury-card-theme p-6 space-y-6 shadow-xl">
                  <h3 className="text-lg font-display font-bold flex items-center justify-between">
                    <span>Checkout Details</span>
                    <span className="text-xs font-normal opacity-60">Guest Order</span>
                  </h3>

                  {/* Delivery vs Pickup Switcher */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium opacity-80">Fulfilment Method</label>
                    <div className={`grid grid-cols-2 gap-2 p-1 rounded-2xl border ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
                    }`}>
                      <button
                        type="button"
                        onClick={() => {
                          setFulfilmentMethod('delivery');
                          playAudioEffect('click', soundEnabled);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          fulfilmentMethod === 'delivery'
                            ? isDark ? 'bg-[#cca26e] text-zinc-950 shadow font-bold' : 'bg-[#a87938] text-white shadow font-bold'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Bike className="w-3.5 h-3.5" /> Home Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFulfilmentMethod('pickup');
                          playAudioEffect('click', soundEnabled);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          fulfilmentMethod === 'pickup'
                            ? isDark ? 'bg-[#cca26e] text-zinc-950 shadow font-bold' : 'bg-[#a87938] text-white shadow font-bold'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" /> Store Pickup
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1 opacity-80">
                        Full Name <span className={isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Harris Vance"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#cca26e]'
                            : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-[#a87938]'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 opacity-80">
                        Phone Number (For WhatsApp / SMS Status) <span className={isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}>*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono opacity-50">+92</span>
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="300 1234567"
                          className={`w-full pl-12 pr-3 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#cca26e]'
                              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-[#a87938]'
                          }`}
                        />
                      </div>
                    </div>

                    {fulfilmentMethod === 'delivery' && (
                      <div>
                        <label className="block text-xs font-medium mb-1 opacity-80">
                          Delivery Address in <span className={`font-semibold ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`}>{currentMerchant.city}</span> <span className={isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}>*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={guestAddress}
                          onChange={(e) => setGuestAddress(e.target.value)}
                          placeholder="House / Apartment #, Street, Block, Area..."
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition resize-none ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#cca26e]'
                              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-[#a87938]'
                          }`}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium mb-1 opacity-70">Order Notes (Optional)</label>
                      <input
                        type="text"
                        value={guestNotes}
                        onChange={(e) => setGuestNotes(e.target.value)}
                        placeholder="e.g. Ring bell twice, ground roast date..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#cca26e]'
                            : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-[#a87938]'
                        }`}
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-medium opacity-80">Payment Selection</label>
                      <div className="space-y-2">
                        <label
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                            paymentChoice === 'cod'
                              ? isDark ? 'border-[#cca26e]/60 bg-zinc-900' : 'border-[#a87938]/60 bg-amber-50/50'
                              : isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="payment-method"
                              checked={paymentChoice === 'cod'}
                              onChange={() => setPaymentChoice('cod')}
                              className="accent-[#cca26e]"
                            />
                            <div>
                              <span className="text-xs font-semibold block">
                                {fulfilmentMethod === 'delivery' ? 'Cash on Delivery (COD)' : 'Pay at Counter Pickup'}
                              </span>
                              <span className="text-[11px] opacity-70">Pay cash upon receipt handover</span>
                            </div>
                          </div>
                          <Banknote className={`w-5 h-5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                        </label>

                        <label
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                            paymentChoice === 'bank'
                              ? isDark ? 'border-[#cca26e]/60 bg-zinc-900' : 'border-[#a87938]/60 bg-amber-50/50'
                              : isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="payment-method"
                              checked={paymentChoice === 'bank'}
                              onChange={() => setPaymentChoice('bank')}
                              className="accent-[#cca26e]"
                            />
                            <div>
                              <span className="text-xs font-semibold block">Direct Bank Transfer / Raast</span>
                              <span className="text-[11px] opacity-70">Merchant verifies transaction reference</span>
                            </div>
                          </div>
                          <Building2 className="w-5 h-5 opacity-60" />
                        </label>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className={`pt-4 border-t space-y-2 text-xs ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                      <div className="flex justify-between opacity-80">
                        <span>Subtotal:</span>
                        <span className="font-mono">Rs. {cartSubtotal.toLocaleString()}</span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Voucher Discount (10%):</span>
                          <span className="font-mono">- Rs. {couponDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between opacity-80">
                        <span>Standard Tax (16% included):</span>
                        <span className="font-mono">Rs. {taxPortion.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between opacity-80">
                        <span>{fulfilmentMethod === 'delivery' ? 'Delivery Charge:' : 'Store Pickup:'}</span>
                        <span className="font-mono">Rs. {activeDeliveryFee.toLocaleString()}</span>
                      </div>
                      <div className={`flex justify-between text-sm font-semibold pt-2 border-t ${
                        isDark ? 'border-zinc-800' : 'border-zinc-200'
                      }`}>
                        <span>Total Due:</span>
                        <span className={`font-mono text-base ${isDark ? 'text-[#dfc29c]' : 'text-[#7c5220]'}`}>
                          Rs. {grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={cart.length === 0}
                      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition flex items-center justify-center gap-2 ${
                        isDark
                          ? 'bg-gradient-to-r from-[#bd8b4b] to-[#cca26e] hover:from-[#cca26e] hover:to-[#dfc29c] text-zinc-950 shadow-[#cca26e]/20'
                          : 'bg-gradient-to-r from-[#a87938] to-[#c59852] hover:from-[#966a2e] hover:to-[#b38743] text-white shadow-amber-900/15'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Place Guest Order Request</span>
                    </button>

                    <p className="text-[11px] opacity-60 text-center">
                      Submitting creates an immutable snapshot with idempotency key. No hidden platform markups.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {view === 'tracking' && (
          <div className="space-y-8 animate-fade-in">
            {/* Status Header */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
              isDark ? 'border-zinc-800' : 'border-zinc-300'
            }`}>
              <div>
                <span className={`text-xs font-semibold tracking-wider uppercase ${
                  isDark ? 'text-[#cca26e]' : 'text-[#a87938]'
                }`}>VenQore Real-Time Tracking</span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight flex items-center gap-3">
                  <span>Order</span>
                  <span className={`font-mono ${isDark ? 'text-[#dfc29c]' : 'text-[#7c5220]'}`}>
                    #{activeOrder.orderNumber}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className={`px-3.5 py-2 rounded-xl border text-xs flex items-center gap-1.5 transition ${
                    isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300' : 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700 shadow-sm'
                  }`}
                >
                  <Receipt className={`w-3.5 h-3.5 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`} />
                  <span>View ERP Receipt</span>
                </button>
                <button
                  onClick={() => { setView('marketplace'); playAudioEffect('click', soundEnabled); }}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                    isDark ? 'bg-[#cca26e] hover:bg-[#dfc29c] text-zinc-950' : 'bg-[#a87938] hover:bg-[#966a2e] text-white shadow-sm'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Browse More Stores</span>
                </button>
              </div>
            </div>

            {/* Merchant Testing Simulator Bar */}
            <div className={`rounded-2xl border p-4 space-y-3 ${
              isDark ? 'bg-zinc-900 border-amber-500/30' : 'bg-amber-50/70 border-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? 'text-amber-300' : 'text-amber-900'
                  }`}>
                    Merchant Workflow Simulator (Roadmap Package 5)
                  </h4>
                </div>
                <span className="text-[11px] opacity-60">Live Stage Controller</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`}>
                Simulate how merchant staff update order statuses through their VenQore ERP Orders Inbox:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => advanceOrderStage('pending')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                >
                  1. Pending Review
                </button>
                <button
                  onClick={() => advanceOrderStage('confirmed')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800 transition"
                >
                  2. Confirm &amp; Hold Stock
                </button>
                <button
                  onClick={() => advanceOrderStage('preparing')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-800 transition"
                >
                  3. Mark Preparing
                </button>
                <button
                  onClick={() => advanceOrderStage('dispatched')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800 transition"
                >
                  4. Out for Delivery
                </button>
                <button
                  onClick={() => advanceOrderStage('completed')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 transition"
                >
                  5. Complete &amp; Post Sale
                </button>
                <button
                  onClick={() => advanceOrderStage('cancelled')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 transition"
                >
                  Cancel Order
                </button>
              </div>
            </div>

            {/* Simulated Live Route Radar Canvas */}
            <div className="rounded-3xl luxury-card-theme p-6 overflow-hidden space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Live Transit Simulation Map</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isDark
                    ? 'bg-[#cca26e]/20 text-[#dfc29c] border-[#cca26e]/30'
                    : 'bg-[#a87938]/15 text-[#7c5220] border-[#a87938]/30'
                }`}>
                  {activeOrder.state === 'dispatched' ? 'ETA: ~10 minutes' : activeOrder.state === 'completed' ? 'Delivered' : 'ETA: ~25 minutes'}
                </span>
              </div>

              <div className={`relative w-full h-52 sm:h-64 rounded-2xl border overflow-hidden flex items-center justify-center transition-colors ${
                isDark ? 'bg-[#0c0e12] border-zinc-800' : 'bg-[#ede8dc] border-zinc-300'
              }`}>
                {/* Road Grid SVG Pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="road-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                      <path d="M 48 0 L 0 0 0 48" fill="none" stroke={isDark ? '#cca26e' : '#a87938'} strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#road-grid)" />
                </svg>

                {/* Animated Transit Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  <path d="M 100 220 Q 300 70 550 160 T 900 80" fill="none" stroke={isDark ? '#232731' : '#ded6c5'} strokeWidth="6" strokeLinecap="round" />
                  <path d="M 100 220 Q 300 70 550 160" fill="none" stroke={isDark ? '#cca26e' : '#a87938'} strokeWidth="6" strokeLinecap="round" className="transit-active-curve" />
                </svg>

                {/* Store Warehouse Node */}
                <div className="absolute left-8 bottom-8 flex flex-col items-center">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shadow-xl ${
                    isDark ? 'bg-zinc-900 border-[#cca26e]/50 text-[#cca26e]' : 'bg-white border-[#a87938]/50 text-[#a87938]'
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono mt-1 px-2 py-0.5 rounded border ${
                    isDark ? 'text-zinc-300 bg-black/80 border-zinc-800' : 'text-zinc-800 bg-white/90 border-zinc-300'
                  }`}>
                    Store Hub ({activeOrder.merchant.warehouseCode})
                  </span>
                </div>

                {/* Dynamic Rider Pin */}
                <div
                  className="absolute flex flex-col items-center transition-all duration-700 ease-out"
                  style={{
                    left: activeOrder.state === 'dispatched' ? '65%' : activeOrder.state === 'completed' ? '85%' : '35%',
                    top: activeOrder.state === 'dispatched' ? '28%' : activeOrder.state === 'completed' ? '18%' : '48%'
                  }}
                >
                  <div className="relative">
                    <span className={`absolute -inset-2 rounded-full animate-ping ${isDark ? 'bg-[#cca26e]/30' : 'bg-[#a87938]/30'}`}></span>
                    <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center shadow-2xl ${
                      isDark ? 'bg-[#cca26e] text-zinc-950' : 'bg-[#a87938] text-white'
                    }`}>
                      <Bike className="w-5 h-5" />
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border mt-1.5 whitespace-nowrap shadow-lg ${
                    isDark ? 'text-white bg-zinc-950/95 border-zinc-700' : 'text-zinc-900 bg-white/95 border-zinc-300'
                  }`}>
                    {activeOrder.state === 'dispatched' ? 'Rider En Route (Ali R.)' : activeOrder.state === 'completed' ? 'Arrived & Handed Over' : 'Order Preparing'}
                  </span>
                </div>

                {/* Customer Doorstep Node */}
                <div className="absolute right-8 top-8 flex flex-col items-center">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shadow-xl ${
                    isDark ? 'bg-zinc-900 border-emerald-500/50 text-emerald-400' : 'bg-white border-emerald-600/50 text-emerald-600'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono mt-1 px-2 py-0.5 rounded border ${
                    isDark ? 'text-zinc-300 bg-black/80 border-zinc-800' : 'text-zinc-800 bg-white/90 border-zinc-300'
                  }`}>
                    Your Doorstep
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {}
      {pdpProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl my-auto animate-slide-up ${
            isDark ? 'bg-zinc-950 border-zinc-700/60' : 'bg-white border-zinc-300'
          }`}>
            <button
              onClick={() => setPdpProduct(null)}
              className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full border flex items-center justify-center transition shadow-lg ${
                isDark ? 'bg-zinc-900/90 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-zinc-300 text-zinc-700 hover:text-black'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
              <div className={`md:col-span-6 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r relative ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center justify-between text-xs opacity-75 z-10">
                  <span className={`px-2.5 py-1 rounded-full font-medium border ${
                    isDark ? 'bg-[#cca26e]/10 border-[#cca26e]/20 text-[#dfc29c]' : 'bg-[#a87938]/10 border-[#a87938]/20 text-[#7c5220]'
                  }`}>
                    {pdpProduct.category}
                  </span>
                  <span className="font-mono">SKU: {pdpProduct.sku}</span>
                </div>

                <div className="relative h-64 sm:h-80 w-full my-3 flex items-center justify-center rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 group">
                  <img src={pdpActiveImg || pdpProduct.image} alt={pdpProduct.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute bottom-2 left-2 text-[10px] text-zinc-300 font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                    Authentic Merchant Batch
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {(pdpProduct.gallery || [pdpProduct.image]).map((imgUrl, i) => (
                    <button
                      key={i}
                      onClick={() => setPdpActiveImg(imgUrl)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border transition active:scale-95 ${
                        (pdpActiveImg || pdpProduct.image) === imgUrl
                          ? isDark ? 'border-[#cca26e] ring-2 ring-[#cca26e]/20' : 'border-[#a87938] ring-2 ring-[#a87938]/20'
                          : isDark ? 'border-zinc-800' : 'border-zinc-300'
                      }`}
                    >
                      <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className={`pt-2 border-t flex items-center justify-between text-xs opacity-75 ${
                  isDark ? 'border-zinc-800/80' : 'border-zinc-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Central Warehouse: {pdpProduct.stock} units left</span>
                  </div>
                  <span className="font-mono text-[11px]">{currentMerchant.warehouseCode}</span>
                </div>
              </div>

              <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">{pdpProduct.title}</h3>
                    <p className={`text-xs font-medium mt-1 ${isDark ? 'text-[#cca26e]' : 'text-[#a87938]'}`}>{pdpProduct.flavor}</p>
                  </div>

                  <div className={`rounded-2xl p-3.5 border space-y-1.5 ${
                    isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] opacity-70">Online Storefront Rate:</span>
                        <div className="text-2xl font-display font-black">
                          Rs. {calculateOnlinePrice(pdpProduct, currentMerchant).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] opacity-60 block">Retail Base: <s>Rs. {pdpProduct.basePrice.toLocaleString()}</s></span>
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {currentMerchant.pricingRule.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] opacity-60 leading-snug">
                      Tax included. Rule automatically synchronized with VenQore central ledger pricing.
                    </p>
                  </div>

                  <p className={`text-xs sm:text-sm leading-relaxed font-normal ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {pdpProduct.description}
                  </p>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold opacity-80">Select Variant</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(pdpProduct.variants || ['Standard']).map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPdpVariant(v)}
                          className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition ${
                            pdpVariant === v
                              ? isDark ? 'bg-[#cca26e] text-zinc-950 border-[#cca26e] font-bold' : 'bg-[#a87938] text-white border-[#a87938] font-bold'
                              : isDark ? 'bg-zinc-900 text-zinc-300 border-zinc-800' : 'bg-white text-zinc-700 border-zinc-300'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`pt-4 border-t space-y-4 ${isDark ? 'border-zinc-800/80' : 'border-zinc-200'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className={`flex items-center rounded-xl border p-1 ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setPdpQty(prev => Math.max(1, prev - 1))}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition active:scale-90 ${
                          isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-zinc-200 text-zinc-900'
                        }`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-bold font-mono">{pdpQty}</span>
                      <button
                        type="button"
                        onClick={() => setPdpQty(prev => Math.min(pdpProduct.stock, prev + 1))}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition active:scale-90 ${
                          isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-zinc-200 text-zinc-900'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] opacity-60">Item Subtotal</span>
                      <div className={`text-lg font-mono font-bold ${isDark ? 'text-[#dfc29c]' : 'text-[#7c5220]'}`}>
                        Rs. {(calculateOnlinePrice(pdpProduct, currentMerchant) * pdpQty).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleAddToCart(pdpProduct, pdpQty, pdpVariant);
                      setPdpProduct(null);
                    }}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg active:scale-98 transition flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-gradient-to-r from-[#bd8b4b] to-[#cca26e] hover:from-[#cca26e] hover:to-[#dfc29c] text-zinc-950 shadow-[#cca26e]/20'
                        : 'bg-gradient-to-r from-[#a87938] to-[#c59852] hover:from-[#966a2e] hover:to-[#b38743] text-white shadow-amber-900/15'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`relative w-full max-w-md rounded-3xl p-6 space-y-6 text-center border shadow-2xl animate-slide-up ${
            isDark ? 'bg-zinc-950 border-zinc-700/60' : 'bg-white border-zinc-300'
          }`}>
            <div className="flex justify-end">
              <button onClick={() => setIsShareModalOpen(false)} className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                isDark ? 'bg-zinc-800 text-zinc-300 hover:text-white' : 'bg-zinc-100 text-zinc-700 hover:text-black'
              }`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl border ${
              isDark ? 'bg-[#cca26e]/20 border-[#cca26e]/30 text-[#cca26e]' : 'bg-[#a87938]/15 border-[#a87938]/30 text-[#a87938]'
            }`}>
              <QrCode className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold">Share Merchant Storefront</h3>
              <p className="text-xs opacity-70">Direct shopper link. Bypasses general discovery straight into this store's catalogue.</p>
            </div>

            <div className="p-4 bg-white rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-md">
              <svg viewBox="0 0 100 100" className="w-full h-full text-zinc-950">
                <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                <rect x="5" y="5" width="20" height="20" fill="white" />
                <rect x="10" y="10" width="10" height="10" fill="currentColor" />
                <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                <rect x="75" y="5" width="20" height="20" fill="white" />
                <rect x="80" y="10" width="10" height="10" fill="currentColor" />
                <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                <rect x="5" y="75" width="20" height="20" fill="white" />
                <rect x="10" y="80" width="10" height="10" fill="currentColor" />
                <circle cx="50" cy="50" r="10" fill="currentColor" />
                <rect x="40" y="15" width="20" height="6" fill="currentColor" />
                <rect x="70" y="50" width="15" height="10" fill="currentColor" />
              </svg>
            </div>

            <div className={`flex items-center gap-2 p-2 rounded-xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-300'
            }`}>
              <input
                type="text"
                readOnly
                value={`https://store.venqore.com/${currentMerchant.city.toLowerCase()}/${currentMerchant.slug}`}
                className="bg-transparent text-xs font-mono flex-1 outline-none px-2"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`https://store.venqore.com/${currentMerchant.city.toLowerCase()}/${currentMerchant.slug}`);
                  triggerToast('Store link copied to clipboard!', 'success');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                  isDark ? 'bg-[#cca26e] hover:bg-[#dfc29c] text-zinc-950' : 'bg-[#a87938] hover:bg-[#966a2e] text-white'
                }`}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`relative w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up ${
            isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'
          }`}>
            <div className={`flex justify-between items-center pb-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg font-black flex items-center justify-center text-sm ${
                  isDark ? 'bg-[#cca26e] text-zinc-950' : 'bg-[#a87938] text-white'
                }`}>V</div>
                <span className="font-display font-bold text-base">VenQore Official Sales Slip</span>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-600 hover:text-black'
              }`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className={`text-center pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <p className="font-bold text-sm">{activeOrder.merchant.name}</p>
                <p className="opacity-70 text-[11px]">{activeOrder.merchant.address}</p>
                <p className="opacity-50 text-[10px]">INVOICE: VQ-INV-2026-9812</p>
              </div>

              <div className="flex justify-between opacity-80">
                <span>Date / Time:</span>
                <span>{activeOrder.timestamp}</span>
              </div>
              <div className="flex justify-between opacity-80">
                <span>Customer:</span>
                <span>{activeOrder.customer.name}</span>
              </div>
              <div className="flex justify-between opacity-80">
                <span>Payment:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeOrder.paymentStatus}</span>
              </div>

              <div className={`py-2 border-y space-y-1.5 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                {activeOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.qty}x {it.title}</span>
                    <span>Rs. {(it.unitPrice * it.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between opacity-80">
                  <span>Subtotal:</span>
                  <span>Rs. {activeOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between opacity-80">
                  <span>Delivery:</span>
                  <span>Rs. {activeOrder.deliveryFee.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between font-bold text-sm pt-1 border-t ${
                  isDark ? 'border-zinc-800' : 'border-zinc-200'
                }`}>
                  <span>Total Payable:</span>
                  <span className={isDark ? 'text-[#dfc29c]' : 'text-[#7c5220]'}>Rs. {activeOrder.total.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-[10px] opacity-60 text-center pt-2">
                Thank you for supporting independent local business.<br />
                Posted directly to VenQore ERP authoritative ledger.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow ${
                  isDark ? 'bg-[#cca26e] text-zinc-950' : 'bg-[#a87938] text-white'
                }`}
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  isDark ? 'bg-zinc-800 text-zinc-300 hover:text-white' : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t px-2 py-2 flex items-center justify-around shadow-2xl transition-colors ${
        isDark ? 'bg-[#07080a]/95 border-zinc-800/80' : 'bg-[#f8f6f0]/95 border-zinc-300'
      }`}>
        <button
          onClick={() => { setView('marketplace'); playAudioEffect('click', soundEnabled); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            view === 'marketplace'
              ? isDark ? 'text-[#cca26e] font-semibold' : 'text-[#a87938] font-bold'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Discover</span>
        </button>

        <button
          onClick={() => { setView('store'); playAudioEffect('click', soundEnabled); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            view === 'store'
              ? isDark ? 'text-[#cca26e] font-semibold' : 'text-[#a87938] font-bold'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px]">Store</span>
        </button>

        <button
          onClick={() => { setView('cart'); playAudioEffect('click', soundEnabled); }}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            view === 'cart'
              ? isDark ? 'text-[#cca26e] font-semibold' : 'text-[#a87938] font-bold'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {totalCartCount > 0 && (
            <span className={`absolute top-0 right-2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
              isDark ? 'bg-[#cca26e] text-zinc-950' : 'bg-[#a87938] text-white'
            }`}>
              {totalCartCount}
            </span>
          )}
          <span className="text-[10px]">Bag</span>
        </button>

        <button
          onClick={() => { setView('tracking'); playAudioEffect('click', soundEnabled); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            view === 'tracking'
              ? isDark ? 'text-[#cca26e] font-semibold' : 'text-[#a87938] font-bold'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Bike className="w-5 h-5" />
          <span className="text-[10px]">Track</span>
        </button>
      </div>

    </div>
  );
}