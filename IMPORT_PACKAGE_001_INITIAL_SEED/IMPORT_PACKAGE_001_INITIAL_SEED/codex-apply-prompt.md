# Görev: BULGARCA Import Package 001 Initial Seed dosyalarını uygula

Ana repo: `mustafasacar50/bulgarca`

Bu paketteki dosyaları uygulamaya import et.

## 1. Ders dosyalarını kopyala

Aşağıdaki dosyaları `public/data/lessons/` içine koy:

- `lessons/lesson-001-alfabe.json`
- `lessons/lesson-002-ses-harf-donusumleri.json`
- `lessons/lesson-003-cogul-ve-ortak-kelimeler.json`
- `lessons/lesson-004-tanisma-ve-selamlasma.json`

## 2. Alıştırma dosyalarını kopyala

Aşağıdaki dosyaları `public/data/exercises/` içine koy:

- `exercises/exercises-001.json`
- `exercises/exercises-002.json`
- `exercises/exercises-003.json`
- `exercises/exercises-004.json`

## 3. Patch dosyalarını uygula

- `patches/rules.patch.json` içindeki `add_rule` operasyonlarını uygun rules dosyasına ekle.
- `patches/glossary.patch.json` içindeki `add_entry` operasyonlarını `public/data/glossary/bg-tr-glossary.json` içine ekle.
- `patches/source-index.patch.json` içindeki `upsert_source` operasyonlarını `public/data/sources/source-index.json` içine işle.
- `patches/manifest.patch.json` içindeki lesson kayıtlarını `public/data/manifest.json` içine ekle.

## 4. Eğer mevcut JSON şeması farklıysa

Mevcut uygulamanın beklediği alan adlarını koru, fakat bu paketteki içerik bilgisini kaybetme. Gerekirse adapter/helper fonksiyon yaz.

## 5. UI kontrolü

- Dersler Dashboard/Lessons ekranında listelenmeli.
- Her ders açılmalı.
- Kural marker/tooltip/sağ panel verileri gösterilmeli.
- Exercises ekranında dersin alıştırmaları listelenmeli.

## 6. Build kontrolü

```bash
npm run build
```

## 7. Commit

Commit mesajı:

```txt
Import initial BULGARCA lesson seed package
```
