# BULGARCA Source Index

Bu dosya insan okunur kaynak indeksidir. Uygulamada kullanılacak makine okunur versiyon `public/data/sources/source-index.json` olacaktır.

## Mevcut kaynaklar

### src-a1-v-1-2

- Dosya: `A1-V-1-2.pdf`
- Tür: PDF
- Sayfa sayısı: 28
- İçerik:
  - Bulgar alfabesi
  - Basılı/el yazısı harfler
  - Telaffuz
  - Transliterasyon
  - Fonetik özellikler
  - Heceleme
  - Tanışma diyalogları
  - Hitaplar, selamlaşma, teşekkür, özür
  - Zamirler
  - `казвам се` ve `съм` çekimleri
  - `ли` soru yapısı
- Kullanılacak dersler:
  - lesson-001-alfabe
  - lesson-004-tanisma-ve-selamlasma
  - lesson-005-zamirler-kazvam-se-sum

### src-alfabe-ilk-ders

- Dosya: `alfabe-ilk ders.pdf`
- Tür: PDF / görsel ağırlıklı
- Sayfa sayısı: 18
- İçerik:
  - Harf kartları
  - Görsellerle kelime tanıtımı
  - Kiril harflerin görsel eşleştirmesi
- Kullanılacak dersler:
  - lesson-001-alfabe
  - ileride görsel kart modülü

### src-kucuk-sozluk

- Dosya: `kucuk-sozlukWORD-yeil (Otomatik olarak kaydedildi).pdf`
- Tür: PDF
- Sayfa sayısı: 91
- İçerik:
  - Türkçe-Bulgarca ortak kelimeler
  - Gramatik rod alanı
  - Çoğul / brojna forma alanı
  - Diğer özellikler alanı
  - 750+ ortak kelime
- Kullanılacak dersler:
  - lesson-003-ortak-kelimeler
  - glossary başlangıç verisi
  - çoğul ve ses dönüşüm kuralları için örnek havuzu

### src-zup-tan-k-bg-ders

- Dosya: `zup-tan-k BG Ders.pdf`
- Tür: PDF
- Sayfa sayısı: 5
- İçerik:
  - Türkçe-Bulgarca ses/harf dönüşüm kuralları
  - Ş → Ш
  - J → Ж
  - -Jİ → -ГИ(Я)
  - Ç → Ч / Ц
  - Ö → ЬО / О / ЕВ / ЕУ
  - Ü → Ю / У
  - S(YON) → Ц(ИЯ)
  - -İZM → -ИЗЪМ
  - OTO- → АВТО-
  - P → Б
- Kullanılacak dersler:
  - lesson-002-ses-harf-donusumleri
  - phonetic-rules.json
  - exercises-002.json

## Kaynak ekleme kuralı

Her yeni PDF/görsel geldiğinde önce bu dosyaya insan okunur özet eklenir, sonra `source-index.patch.json` ile makine okunur JSON dosyası güncellenir.
