"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
type Offer = { type: string; sku: string; hours: number };
type NativeWindow = Window & {
  ReactNativeWebView?: { postMessage: (message: string) => void };
  GymBuilderNativeStore?: "apple" | "google";
};
const names: Record<string, string> = {
  oferta_zilei: "Oferta zilei",
  anunturile_zilei: "Ofertele săptămânii",
  super_pret: "Super preț",
};
export default function MobilePromotions() {
  const [offers, setOffers] = useState<Offer[]>([]),
    [products, setProducts] = useState<{ id: string; name: string }[]>([]),
    [product, setProduct] = useState(""),
    [prices, setPrices] = useState<Record<string, string>>({}),
    [status, setStatus] = useState("Conectare la magazin…"),
    [busy, setBusy] = useState(false),
    [store, setStore] = useState<"apple" | "google" | null>(null);
  const billingReady = useRef(false);
  const pending = useRef<string | null>(null);
  const key = useRef<{ signature: string; id: string } | null>(null);
  const post = (body: object) =>
    (window as NativeWindow).ReactNativeWebView?.postMessage(
      JSON.stringify(body),
    );
  useEffect(() => {
    let cancelled = false;
    async function ready() {
      const platform = (window as NativeWindow).GymBuilderNativeStore;
      if (!platform) {
        setStatus(
          "Această secțiune funcționează în aplicația iOS sau Android Gym Builder.",
        );
        return;
      }
      setStore(platform);
      try {
        const [c, p] = await Promise.all([
          fetch(`/api/mobile/billing/catalog?store=${platform}`, {
            cache: "no-store",
          }),
          fetch("/api/mobile/billing/products", { cache: "no-store" }),
        ]);
        const catalog = await c.json();
        const list = await p.json();
        if (cancelled) return;
        if (!catalog.enabled) {
          setStatus(
            "Plățile sunt încă în pregătire. Nu se efectuează nicio plată.",
          );
          return;
        }
        if (!p.ok) {
          setStatus("Autentifică-te cu un cont de furnizor aprobat.");
          return;
        }
        billingReady.current = true;
        setProducts(list.products);
        setOffers(catalog.offers);
        setStatus(
          catalog.mode === "sandbox"
            ? "Mod de test sandbox. Prețurile sunt furnizate de magazin."
            : "Prețurile sunt furnizate de magazin. Plata necesită confirmarea ta.",
        );
        post({ type: "prices", skus: catalog.offers.map((o: Offer) => o.sku) });
        post({ type: "recover" });
      } catch {
        if (!cancelled)
          setStatus(
            "Conexiunea nu este disponibilă. Reîncarcă pagina pentru a încerca din nou.",
          );
      }
    }
    async function event(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === "prices") {
        setPrices(detail.prices || {});
        return;
      }
      if (detail?.type === "pending") {
        setBusy(true);
        setStatus(
          "Plata este în așteptare la magazin. Nu cumpăra din nou. Revino pentru recuperarea achiziției după confirmare.",
        );
        return;
      }
      if (detail?.type === "error") {
        if (!billingReady.current) return;
        setBusy(false);
        setStatus(
          "Cumpărarea nu s-a finalizat. Poți reîncerca sau recupera achizițiile în așteptare.",
        );
        return;
      }
      if (detail?.type !== "purchase") return;
      setBusy(true);
      setStatus("Verificăm plata pe server. Nu închide aplicația.");
      try {
        const r = await fetch("/api/mobile/billing/verify", {
          method: "POST",
          signal: AbortSignal.timeout(55000),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intentId: detail.intentId,
            proof: detail.proof,
          }),
        });
        const data = await r.json();
        if (!r.ok || data.granted !== true) {
          setStatus(
            data.error === "PAYMENT_REVIEW_REQUIRED"
              ? "Plata necesită verificarea echipei. Nu cumpăra din nou același interval."
              : "Plata nu a fost confirmată. Recuperează achizițiile în așteptare sau contactează suportul.",
          );
          return;
        }
        post({ type: "finish", purchaseId: detail.purchaseId });
        pending.current = null;
        key.current = null;
        setStatus("Promovarea a fost activată după verificarea magazinului.");
      } catch {
        setStatus(
          "Verificarea nu s-a încheiat. Folosește „Recuperează achizițiile”. Nu este necesară o nouă plată.",
        );
      } finally {
        setBusy(false);
      }
    }
    window.addEventListener("gymbuilder-native-ready", ready);
    window.addEventListener("gymbuilder-store-event", event);
    void ready();
    return () => {
      cancelled = true;
      window.removeEventListener("gymbuilder-native-ready", ready);
      window.removeEventListener("gymbuilder-store-event", event);
    };
  }, []);
  async function buy(offer: Offer) {
    if (!store || !product || busy || !prices[offer.sku]) return;
    setBusy(true);
    try {
      const signature = product + offer.type + store;
      if (key.current?.signature !== signature)
        key.current = { signature, id: crypto.randomUUID() };
      const r = await fetch("/api/mobile/billing/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store,
          type: offer.type,
          productId: product,
          requestId: key.current.id,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        key.current = null;
        setStatus(
          "Produsul sau intervalul nu este disponibil. Nu s-a inițiat plata.",
        );
        setBusy(false);
        return;
      }
      pending.current = data.intent.id;
      post({ type: "purchase", intentId: data.intent.id, sku: offer.sku });
      setStatus("Confirmă sau anulează în dialogul magazinului.");
    } catch {
      setStatus("Nu am putut rezerva promovarea. Nu s-a inițiat plata.");
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-xl px-4 py-8 space-y-5">
      <h1 className="text-3xl font-bold">Promovări în aplicație</h1>
      <p role="status" className="text-anthracite-200">
        {status}
      </p>
      <Link
        className="inline-flex min-h-11 items-center text-gold-400"
        href="/login?redirect=%2Fmobile%2Fpromotions"
      >
        Autentificare furnizor
      </Link>
      {offers.length > 0 && (
        <>
          <label className="block">
            Produsul tău
            <select
              className="input-field mt-2"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              <option value="">Alege produsul</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {offers.map((o) => (
            <section key={o.type} className="card space-y-3">
              <h2 className="text-xl font-semibold">{names[o.type]}</h2>
              <p>
                {o.hours} ore · {prices[o.sku] || "Preț indisponibil"}
              </p>
              <p className="text-sm text-anthracite-300">
                Intervalul începe după confirmarea serverului. Rezervarea pentru
                plată expiră după 15 minute.
              </p>
              <button
                className="btn-primary min-h-11 disabled:opacity-40"
                disabled={busy || !product || !prices[o.sku]}
                onClick={() => buy(o)}
              >
                Cumpără prin {store === "apple" ? "App Store" : "Google Play"}
              </button>
            </section>
          ))}
          <button
            className="btn-secondary min-h-11"
            onClick={() => post({ type: "recover" })}
          >
            Recuperează achizițiile în așteptare
          </button>
        </>
      )}
      <Link
        href="/contact"
        className="inline-flex min-h-11 items-center text-gold-400"
      >
        Contactează suportul
      </Link>
      <p className="text-sm text-anthracite-300">
        Achizițiile consumabile deja finalizate nu sunt restaurate de magazin.
        Promovările active sunt asociate contului tău.
      </p>
    </main>
  );
}
