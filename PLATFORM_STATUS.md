# GymBuilder.app — Stadiul Platformei

**Data:** 14 August 2026  
**URL Producție:** https://www.gymbuilder.app  
**GitHub:** https://github.com/elitecoachopro/gymbuilder-v2  
**Branch activ:** `develop` (merge în `main` pentru deploy)

---

## 1. TRASEU ÎNREGISTRARE FURNIZOR

**URL:** `/register/supplier`  
**Status:** ✅ Implementat complet (4 pași)

| Pas | Conținut | Validare |
|-----|----------|----------|
| 1. Cont | Nume, Prenume, Email, Parolă + Confirmare | Toate obligatorii, parolă min 8 char |
| 2. Firmă | Nume companie*, Țară*, Oraș*, Telefon/WhatsApp*, Website, Descriere | Telefon obligatoriu (vizibil pe profil public) |
| 3. Poze verificare | Upload minim 3 poze (showroom, depozit, echipamente, echipă) | Buton dezactivat până la 3 poze |
| 4. Plan | Alegere plan (Free/Starter/Professional/Enterprise) + T&C | Checkbox obligatoriu |

**Flux post-înregistrare:**
1. Email de verificare → click link → cont activat
2. Status: "Pending" (așteaptă aprobare admin)
3. Admin aprobă/respinge din Admin Dashboard → Tab "Furnizori"
4. După aprobare → acces la Supplier Dashboard

---

## 2. TRASEU ÎNREGISTRARE CLIENT

**URL:** `/register/client`  
**Status:** ✅ Implementat (1 pas, formular simplu)

| Câmp | Obligatoriu |
|------|-------------|
| Nume | Da |
| Prenume | Da |
| Email | Da |
| Telefon | Da |
| Parolă + Confirmare | Da (min 8 char) |
| Accept T&C | Da |

**Flux post-înregistrare:**
1. Email de verificare → click link → cont activat
2. Acces imediat la Client Dashboard (fără aprobare admin)

---

## 3. FUNCȚIONALITĂȚI IMPLEMENTATE ȘI FUNCȚIONALE

### 3.1 Pagini Publice (Marketing)
| Pagină | URL | i18n RO/EN |
|--------|-----|------------|
| Homepage | `/` | ✅ |
| Despre | `/about` | ✅ |
| FAQ | `/faq` | ✅ |
| Cum Funcționează | `/cum-functioneaza` | ✅ |
| Contact | `/contact` | ✅ |
| Blog | `/blog` | ✅ (Coming Soon) |
| Prețuri/Pachete | `/pricing` | ❌ (doar RO) |
| Catalog Produse | `/products` | ❌ (parțial) |
| Pagină Produs | `/products/[id]` | ❌ (parțial) |
| Lista Furnizori | `/suppliers` | ❌ (parțial) |
| Profil Furnizor | `/suppliers/[id]` | ❌ (parțial) |
| Configurator 2D | `/construieste-sala` | ❌ |
| Estimator Buget | `/estimator-buget` | ❌ |
| Consultanță | `/consultation` | ❌ |
| Comparator | `/compare` | ❌ |
| Cookie Policy | `/cookie-policy` | ✅ |
| Return Policy | `/return-policy` | ✅ |
| Termeni | `/terms` | ✅ |
| Confidențialitate | `/privacy` | ✅ |

### 3.2 Autentificare
| Funcție | URL | Status |
|---------|-----|--------|
| Login | `/login` | ✅ |
| Register Client | `/register/client` | ✅ |
| Register Supplier | `/register/supplier` | ✅ (4 pași) |
| Forgot Password | `/forgot-password` | ✅ |
| Reset Password | `/reset-password` | ✅ |
| Verificare Email | via link email | ✅ |

### 3.3 Client Dashboard (`/client/dashboard`)
| Secțiune | Status |
|----------|--------|
| Bun venit + Stats (cereri, favorite, recenzii, furnizori) | ✅ |
| Furnizori Contactați Recent | ✅ |
| Produse Favorite | ✅ |
| Cereri de Ofertă (cu chat) | ✅ |
| Recenziile Mele | ✅ |
| Setări Cont (ștergere cont) | ✅ |
| Configurator 2D Gym | ✅ |

### 3.4 Supplier Dashboard (`/supplier/dashboard`)
| Secțiune | Status | i18n |
|----------|--------|------|
| Stats (produse, cereri, vizualizări) | ✅ | ✅ RO/EN |
| Produsele Mele (listă + adaugă/editează) | ✅ | ✅ RO/EN |
| Cereri Primite (cu reply inline + chat) | ✅ | ✅ RO/EN |
| Analytics (vizualizări produse) | ✅ | ✅ RO/EN |
| Galerie Foto | ✅ | ✅ RO/EN |
| Promovează-te (Oferta Zilei, Anunțuri) | ✅ | ✅ RO/EN |
| Setări Cont | ✅ | ✅ RO/EN |
| Upload imagini 360° | ✅ | ✅ RO/EN |
| Import CSV produse | ✅ | ✅ RO/EN |
| NotificationBell (cereri noi) | ✅ | — |

### 3.5 Admin Dashboard (`/admin`)
| Tab | Status |
|-----|--------|
| Furnizori (pending/approved/rejected, detalii, poze verificare) | ✅ |
| Recenzii (aprobare/respingere) | ✅ |
| Newsletter (abonați, trimite) | ✅ |
| Mesaje Contact (formularul /contact, reply email) | ✅ |
| Cereri Furnizori (toate cererile Chat Now, cross-supplier) | ✅ |
| NotificationBell (mesaje contact noi) | ✅ |

### 3.6 Funcționalități Speciale
| Feature | Status | Detalii |
|---------|--------|---------|
| Widget Căutare (Autovit-style) | ✅ | Tab-uri categorie, search live, count dinamic |
| Vizualizator 360° | ✅ | Upload secvență imagini, drag to rotate |
| FloatingChatButton | ✅ | Chat rapid pe pagini produs/furnizor |
| Sistem Notificări (bell icon) | ✅ | Email + in-app, deep linking cu highlight |
| Recenzii cu stele | ✅ | Client lasă recenzie, admin aprobă |
| Favorite produse | ✅ | Client salvează/șterge favorite |
| Newsletter subscribe/unsubscribe | ✅ | Cu email confirmare |
| Cookie Consent | ✅ | Banner GDPR |
| Language Switcher (RO/EN) | ✅ | Cookie-based, fără URL restructuring |
| Configurator 2D Sală | ✅ | Drag & drop echipamente pe plan |
| Estimator Buget | ✅ | Calculator interactiv |
| Comparator Produse | ✅ | Side-by-side |

---

## 4. CE NU ESTE ÎNCĂ IMPLEMENTAT / NECESITĂ LUCRU

### 4.1 Plăți (Stripe)
- **Status:** Sandbox Stripe creat dar NEREVENDICAT
- **URL claim:** https://dashboard.stripe.com/claim_sandbox/...
- **Ce lipsește:** Integrare efectivă checkout pentru pachete premium (Starter €49, Professional €149, Enterprise €399)
- **Impact:** Furnizori nu pot face upgrade de plan, funcțiile premium (360°, promovări) nu sunt gate-uite real

### 4.2 Produse Reale
- **Status:** 0 produse în baza de date
- **Ce trebuie:** Furnizori reali să adauge produse din Supplier Dashboard
- **Furnizori activi:** Qingdao Long Glory Technology (TechFit) + Sc Gymbuilder srl

### 4.3 i18n Incomplet
- Pagini netraduse: `/pricing`, `/products`, `/suppliers`, `/construieste-sala`, `/estimator-buget`, `/consultation`, `/compare`
- Client Dashboard: doar RO
- Admin Dashboard: doar RO

### 4.4 Funcționalități Lipsă / Parțiale
| Feature | Status | Detalii |
|---------|--------|---------|
| Plată efectivă pachete premium | ❌ | Stripe neintegrat |
| Gate-uri pe plan (limite produse, 360°) | ⚠️ Parțial | Logica există dar fără plată reală |
| Email marketing automatizat | ❌ | Doar newsletter manual |
| SEO optimizat (meta tags dinamice) | ⚠️ Parțial | Pagini statice OK, produse/furnizori — de verificat |
| Sistem de mesagerie complet (chat real-time) | ⚠️ Parțial | Funcționează via polling, nu WebSocket |
| Mobile app / PWA | ❌ | Doar responsive web |
| Dashboard analytics avansat | ⚠️ Basic | Vizualizări produse, fără grafice/trend |
| Import bulk produse (CSV) | ✅ | Implementat |
| Export date | ❌ | — |

---

## 5. CONTURI ACTIVE ÎN BAZA DE DATE

| Email | Rol | Companie | Status |
|-------|-----|----------|--------|
| contact@gymbuilder.app | admin + supplier | Sc Gymbuilder srl | ✅ approved |
| longglorychina@gmail.com | supplier | Qingdao Long Glory Technology | ✅ approved |
| *(cont test "sc impex srl")* | supplier | sc impex srl | pending (de la testul formularului) |

---

## 6. STACK TEHNIC

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (imagini produse, galerie, 360°, verificare)
- **Email:** Resend (noreply@gymbuilder.app)
- **Deploy:** Vercel (auto-deploy din branch `main`)
- **i18n:** Cookie-based (LocaleProvider + useClientTranslations)
- **Auth:** Custom (email/password, JWT session cookie, email verification)
- **Plăți:** Stripe (sandbox creat, neintegrat)

---

## 7. PRIORITĂȚI RECOMANDATE (NEXT STEPS)

1. **Revendică sandbox-ul Stripe** și integrează plata pentru pachete premium
2. **Furnizorul TechFit să adauge produse** (email de onboarding trimis)
3. **Șterge contul de test** "sc impex srl" (dacă nu mai e necesar)
4. **Traduce paginile rămase** în engleză (pricing, products, suppliers)
5. **SEO:** Meta tags dinamice pentru pagini produs/furnizor
6. **Marketing:** Adaugă mai mulți furnizori reali pe platformă
