import productsRaw from '../data/products.json';

export type Product = {
  id: number;
  slug: string;
  name: string;
  fullName: string;
  brand: string;
  line: 'te' | 'cafe';
  category: string;
  categoryOrder: number;
  description: string[];
  claims: string[];
  notes: { k: string; v: string }[];
  intensity: { label: string; value: number; max: number } | null;
  sizes: string[];
  image: string | null;
  source: string;
};

export const products = productsRaw as Product[];
export const tes = products.filter((p) => p.line === 'te');
export const cafes = products.filter((p) => p.line === 'cafe');

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (p = '/') => (/^(https?:|mailto:|tel:|#)/.test(p) ? p : `${BASE}${p.startsWith('/') ? p : `/${p}`}`);
export const media = (f: string) => url(`/media/${f}`);
export const img = (p: Pick<Product, 'image'>, s: 420 | 800 = 420) => (p.image ? url(`/img/productos/${p.image}-${s}.webp`) : '');

/** Líneas en orden, con conteo */
export const linesOf = (list: Product[]) => {
  const map = new Map<string, { label: string; order: number; count: number }>();
  list.forEach((p) => {
    const m = map.get(p.category) ?? { label: p.category, order: p.categoryOrder, count: 0 };
    m.count++;
    map.set(p.category, m);
  });
  return [...map.values()].sort((a, b) => a.order - b.order);
};

export const bySlug = (s: string) => products.find((p) => p.slug === s);
export const featured = ['te-negro-clasico', 'tostado-espresso-molido-100-arabica', 'te-verde-jazmin', 'capsulas-espresso', 'te-chai', 'cafe-tostado-intenso', 'herboristeria-equilibrio-relajar', 'cappuccino-dulce-de-leche', 'te-manzana-con-canela', 'cafe-puro-aroma-en-granos']
  .map(bySlug)
  .filter(Boolean) as Product[];

/** Datos reales publicados por la empresa (lavirginia.com.ar) */
export const company = {
  legal: 'Cafés La Virginia S.A.',
  founded: 1915,
  city: 'Rosario, Santa Fe',
  phone: '0341-459 8000',
  phoneHref: 'tel:+543414598000',
  numbers: [
    { value: 1915, prefix: '', suffix: '', label: 'Año de fundación en Rosario' },
    { value: 16, prefix: '', suffix: '', label: 'Sucursales que abastecen a todo el país' },
    { value: 18, prefix: '+', suffix: '', label: 'Países a los que exportamos' },
    { value: 300, prefix: '+', suffix: '', label: 'Productos comercializados' },
    { value: 10, prefix: '', suffix: ' M', label: 'Infusiones consumidas todos los días' },
  ],
};

/** Datos del autor del concepto (aviso legal + pitch) */
export const AUTHOR = {
  name: 'Federico Schwindt',
  email: 'leonel.sch2003@gmail.com',
  portfolio: 'https://federico-schwindt.github.io/portfolio-FEDERICOSCH/',
};

export const nav = [
  { href: '/te/', label: 'Té', n: 'I' },
  { href: '/cafe/', label: 'Café', n: 'II' },
  { href: '/empresa/', label: 'Nuestra historia', n: 'III' },
  { href: '/empresas/', label: 'Para empresas', n: 'IV' },
  { href: '/sustentabilidad/', label: 'Sustentabilidad', n: 'V' },
  { href: '/conoce-tu-cafe/', label: 'Conocé tu café', n: 'VI' },
];

export const provincias = ['Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'Fuera de Argentina'];
