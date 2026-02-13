# Build System - Browar Wyszak

## 🎯 Problem

Strona ma 15 HTML-i (5 stron × 3 języki). Każda zmiana w header/footer wymagała edycji wszystkich 15 plików → **zmarnowane tokeny**.

## ✅ Rozwiązanie

Build system który:
- Trzyma shared komponenty w `src/templates/`
- Automatycznie wstrzykuje je do wszystkich stron
- Generuje finalne vanilla HTML

---

## 📁 Struktura

```
BrowarWyszakRodzinny/
├── src/
│   └── templates/
│       ├── header-pl.html     ← Wspólny header dla PL
│       ├── header-en.html     ← Wspólny header dla EN
│       ├── header-de.html     ← Wspólny header dla DE
│       ├── footer-pl.html     ← Wspólny footer dla PL
│       ├── footer-en.html     ← Wspólny footer dla EN
│       └── footer-de.html     ← Wspólny footer dla DE
├── build.js                   ← Build script
├── package.json               ← npm scripts
├── index.html                 ← Wygenerowany (PL)
├── en-home.html               ← Wygenerowany (EN)
├── de-home.html               ← Wygenerowany (DE)
└── ...
```

---

## 🚀 Użycie

### 1️⃣ Edycja shared komponentów

Edytuj tylko pliki w `src/templates/`:

```bash
# Przykład: zmiana w header PL
src/templates/header-pl.html

# Przykład: zmiana w footer wszystkich języków
src/templates/footer-pl.html
src/templates/footer-en.html
src/templates/footer-de.html
```

### 2️⃣ Build

```bash
npm run build
```

To zastąpi header/footer we wszystkich 15 HTML-ach.

### 3️⃣ Git commit & push

```bash
git add .
git commit -m "Update header: dodaj nowy link"
git push origin main
```

Vercel auto-deploys.

---

## 🔧 Zaawansowane

### Auto-rebuild przy zmianach

```bash
npm run build:watch
```

Automatycznie przebudowuje przy każdej zmianie w `src/templates/`.

### Dodawanie nowych stron

Edytuj `build.js` → `langMap`:

```js
const langMap = {
  'nowa-strona.html': 'pl',
  'en-new-page.html': 'en',
  // ...
};
```

---

## ⚡ Zalety

- ✅ **Zero duplikacji** - header/footer raz na język
- ✅ **Vanilla HTML** w produkcji - zero runtime overhead
- ✅ **SEO friendly** - boty widzą pełny HTML
- ✅ **Oszczędność tokenów** - edycja 3 plików zamiast 15
- ✅ **Zero zmian w deployment** - Vercel nadal widzi HTML-e

---

## 📝 Przykład workflow

**Przed build systemem:**
```bash
# Dodanie nowego linku w header
1. Edytuj index.html (PL)
2. Edytuj menu.html (PL)
3. Edytuj kontakt.html (PL)
4. Edytuj piwa-rzemieslnicze.html (PL)
5. Edytuj imprezy-firmowe.html (PL)
6. Edytuj en-home.html (EN)
7. Edytuj en-menu.html (EN)
8. Edytuj en-kontakt.html (EN)
9. Edytuj en-piwa-rzemieslnicze.html (EN)
10. Edytuj en-imprezy-firmowe.html (EN)
11. Edytuj de-home.html (DE)
12. Edytuj de-menu.html (DE)
13. Edytuj de-kontakt.html (DE)
14. Edytuj de-piwa-rzemieslnicze.html (DE)
15. Edytuj de-imprezy-firmowe.html (DE)
```
**→ 15 edycji, tysiące tokenów**

**Po build systemie:**
```bash
# Dodanie nowego linku w header
1. Edytuj src/templates/header-pl.html
2. Edytuj src/templates/header-en.html
3. Edytuj src/templates/header-de.html
4. npm run build
```
**→ 3 edycje + 1 komenda**

---

## 🛠️ Troubleshooting

### Problem: Build nie zastępuje header/footer

**Rozwiązanie:** Sprawdź czy plik HTML ma komentarz `<!-- ===== HEADER =====` i tag `<footer class="site-footer">`.

### Problem: Git pokazuje dużo zmian po buildzie

**Rozwiązanie:** To normalne przy pierwszym buildzie. Kolejne buildy będą miały zero zmian jeśli nie edytowałeś templates.

---

**Ostatnia aktualizacja:** 2026-02-13
