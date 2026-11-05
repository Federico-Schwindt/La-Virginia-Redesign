import { animate, scroll, inView } from 'motion';

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } },
};

/* ---------------- Header ---------------- */
const hdr = $('[data-hdr]');
if (hdr) {
  let last = scrollY;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-solid', y > 30);
    if (!document.documentElement.classList.contains('lock')) hdr.classList.toggle('is-hidden', y > 500 && y > last + 4);
    if (y < last - 4) hdr.classList.remove('is-hidden');
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
const lock = (on: boolean) => document.documentElement.classList.toggle('lock', on);
const menu = $('[data-menu]');
const setMenu = (open: boolean) => {
  if (!menu) return;
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  menu.inert = !open;
  $('[data-open-menu]')?.setAttribute('aria-expanded', String(open));
  lock(open);
};

/* ---------------- Revelados ---------------- */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
$$('[data-rv],[data-lines],[data-img]').forEach((el) => { if (!el.classList.contains('in')) io.observe(el); });

/* Contadores */
$$('[data-count]').forEach((el) => {
  const end = +el.dataset.count!;
  const dec = +(el.dataset.dec || 0);
  const year = el.dataset.from === undefined && !dec && end >= 1000 && end < 3000;
  const from = el.dataset.from !== undefined ? +el.dataset.from : year ? 1800 : 0;
  const fmt = (v: number) =>
    year ? String(Math.round(v)) : v.toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  if (reduced) { el.textContent = fmt(end); return; }
  el.textContent = fmt(from);
  inView(el, () => {
    animate(from, end, { duration: +(el.dataset.dur || 2.2), ease: [0.2, 0.75, 0.15, 1], onUpdate: (v) => (el.textContent = fmt(v)) });
  }, { amount: 0.6 });
});

/* Parallax suave en imágenes marcadas */
if (!reduced) {
  $$('[data-parallax]').forEach((el) => {
    const amt = +(el.dataset.parallax || 8);
    scroll(animate(el, { transform: [`translateY(-${amt}%) scale(1.08)`, `translateY(${amt}%) scale(1.08)`] }, { ease: 'linear' }), { target: el.parentElement!, offset: ['start end', 'end start'] });
  });
}

/* Videos diferidos: cargan y reproducen solo en pantalla */
const vio = new IntersectionObserver((es) => es.forEach((e) => {
  const v = e.target as HTMLVideoElement;
  if (e.isIntersecting) {
    if (!v.dataset.ok) { v.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => (s.src = s.dataset.src!)); v.load(); v.dataset.ok = '1'; }
    v.play().catch(() => {});
  } else v.pause();
}), { rootMargin: '200px' });
const slow = (navigator as any).connection?.saveData;
$$<HTMLVideoElement>('video[data-lazy]').forEach((v) => !reduced && !slow && vio.observe(v));

/* ---------------- Pedido mayorista (B2B, sin precios) ---------------- */
export type Item = { slug: string; name: string; size: string; img: string | null; line: string; qty: number };
let items: Item[] = store.get<Item[]>('lv-pedido', []);
const drawer = $('[data-drawer]');
const toast = $('[data-toast]');
let toastT: number | undefined;

export const Pedido = {
  items: () => items,
  count: () => items.reduce((n, i) => n + i.qty, 0),
  add(it: Omit<Item, 'qty'> & { qty?: number }) {
    const q = Math.max(1, it.qty || 1);
    const key = (i: Item) => i.slug + '|' + i.size;
    const ex = items.find((i) => key(i) === it.slug + '|' + it.size);
    if (ex) ex.qty += q; else items.push({ ...it, qty: q });
    this.save();
    const b = $('[data-order-count]');
    b?.classList.remove('bump'); void b?.offsetWidth; b?.classList.add('bump');
    if (toast) {
      ($('[data-toast-text]', toast) as HTMLElement).textContent = `${it.name} · ${it.size} — agregado al pedido`;
      toast.classList.add('on'); clearTimeout(toastT); toastT = window.setTimeout(() => toast.classList.remove('on'), 3000);
    }
  },
  set(slug: string, size: string, qty: number) {
    const it = items.find((i) => i.slug === slug && i.size === size);
    if (!it) return;
    it.qty = qty;
    if (qty <= 0) items = items.filter((i) => i !== it);
    this.save();
  },
  clear() { items = []; this.save(); },
  save() { store.set('lv-pedido', items); render(); document.dispatchEvent(new CustomEvent('pedido:change')); },
};
(window as any).__lv = Pedido;

function render() {
  const n = Pedido.count();
  $$('[data-order-count]').forEach((el) => (el.textContent = String(n)));
  const list = $('[data-order-items]');
  const foot = $('[data-order-foot]');
  if (!list || !foot) return;
  if (!items.length) {
    list.innerHTML = `<div class="empty"><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/></svg><p>Tu solicitud está vacía.<br>Sumá productos del catálogo para pedir una cotización.</p><a class="btn btn--sm" href="${BASE}/te/">Ver catálogo</a></div>`;
    foot.hidden = true;
    return;
  }
  list.innerHTML = items.map((i) => `
    <div class="oitem">
      <a class="oitem__img" href="${BASE}/productos/${i.slug}/">${i.img ? `<img src="${BASE}/img/productos/${i.img}-420.webp" alt="" width="56" height="56" loading="lazy">` : ''}</a>
      <div><a class="oitem__name" href="${BASE}/productos/${i.slug}/">${i.name}</a><div class="oitem__meta">${i.size} · ${i.line === 'te' ? 'Té' : 'Café'}</div></div>
      <div>
        <div class="qty" role="group" aria-label="Cantidad de bultos">
          <button type="button" data-q="${i.slug}|${i.size}" data-d="-1" aria-label="Restar">−</button><span>${i.qty}</span><button type="button" data-q="${i.slug}|${i.size}" data-d="1" aria-label="Sumar">+</button>
        </div>
        <button type="button" class="oitem__rm" data-rm="${i.slug}|${i.size}">Quitar</button>
      </div>
    </div>`).join('');
  foot.hidden = false;
}
render();

const setDrawer = (open: boolean) => {
  if (!drawer) return;
  drawer.classList.toggle('is-open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  drawer.inert = !open;
  lock(open);
};

/* ---------------- Aviso de concepto ---------------- */
const NOTICE = 'lv-concepto-ok';
const notice = $('[data-notice]');
const setNotice = (open: boolean) => {
  if (!notice) return;
  notice.classList.toggle('is-open', open);
  notice.setAttribute('aria-hidden', String(!open));
  notice.inert = !open;
  lock(open);
  if (open) setTimeout(() => { $<HTMLButtonElement>('[data-ack-notice]')?.focus({ preventScroll: true }); $('.modal__card')?.scrollTo({ top: 0 }); }, 60);
};
if (notice && !store.get<number>(NOTICE, 0)) {
  const show = () => setTimeout(() => setNotice(true), 1000);
  document.readyState === 'complete' ? show() : addEventListener('load', show, { once: true });
}

/* ---------------- Delegación de clicks ---------------- */
document.addEventListener('click', (e) => {
  const t = e.target as Element;
  const add = t.closest<HTMLElement>('[data-add]');
  if (add) {
    e.preventDefault();
    const data = JSON.parse(add.dataset.add!);
    Pedido.add(data);
    if (!reduced) animate(add, { scale: [1, 0.9, 1.06, 1] }, { duration: 0.5 });
    return;
  }
  if (t.closest('[data-open-order]')) { e.preventDefault(); toast?.classList.remove('on'); setDrawer(true); return; }
  if (t.closest('[data-close-order]')) { setDrawer(false); return; }
  if (t.closest('[data-open-menu]')) { setMenu(true); return; }
  if (t.closest('[data-close-menu]')) { setMenu(false); return; }
  if (t.closest('[data-open-notice]')) { setNotice(true); return; }
  if (t.closest('[data-ack-notice]') || t.closest('[data-close-notice]')) { store.set(NOTICE, Date.now()); setNotice(false); return; }
  const q = t.closest<HTMLElement>('[data-q]');
  if (q) { const [s, z] = q.dataset.q!.split('|'); const it = items.find((i) => i.slug === s && i.size === z); if (it) Pedido.set(s, z, it.qty + +q.dataset.d!); return; }
  const rm = t.closest<HTMLElement>('[data-rm]');
  if (rm) { const [s, z] = rm.dataset.rm!.split('|'); Pedido.set(s, z, 0); }
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') { setDrawer(false); setMenu(false); setNotice(false); } });
addEventListener('storage', (e) => { if (e.key === 'lv-pedido') { items = store.get('lv-pedido', []); render(); } });

/* Formularios de demostración (GitHub Pages no tiene backend) */
document.addEventListener('submit', (e) => {
  const f = (e.target as Element).closest<HTMLFormElement>('[data-demo]');
  if (!f) return;
  e.preventDefault();
  const msg = f.querySelector('[data-msg]');
  if (msg) msg.textContent = '✓ ¡Gracias! (Formulario de demostración: no se envió ningún dato.)';
  f.reset();
});
