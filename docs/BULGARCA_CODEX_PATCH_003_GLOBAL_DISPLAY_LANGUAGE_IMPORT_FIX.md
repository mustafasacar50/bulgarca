# BULGARCA Patch 003 — Global Görünüm, Dil Modu, Hover, Sağ Panel Senkronizasyonu ve Boş Ders Fix

## Repo

Ana repo: `mustafasacar50/bulgarca`

Bu görev, mevcut statik React + Vite + TypeScript + Tailwind BULGARCA MVP uygulamasını düzeltmek ve sonraki tüm ders/import paketleri için kalıcı UI standardını yerleştirmek içindir.

---

## Ana sorunlar

1. Harf / kelime / cümle görünüm ayarları sadece bazı alanlarda çalışıyor; sağ panel, ders listesi, örnekler ve alıştırmalar aynı stili takip etmiyor.
2. Ana panelde el yazısı seçilince sağ panel aynı moda geçmiyor.
3. Büyük/küçük harf modu tüm uygulamada geçerli değil.
4. Bulgarca ve Türkçe bazı kartlarda aynı anda zorunlu görünüyor; bu opsiyonel olmalı.
5. Hover sistemi global değil. Bulgarca görünen her yerde Türkçe anlam; Türkçe görünen her yerde Bulgarca karşılık hover ile görülebilmeli.
6. Bazı derslerde başlık görünüyor ama içerik boş kalıyor. Özellikle “Türkçe-Bulgarca Ses ve Harf Dönüşümleri: Genişletilmiş” sayfası boş görünüyor. Bu kabul edilemez.
7. JSON import / paste / upload sistemi henüz yeterli değil. Kullanıcı yeni ders paketini arayüzden yapıştırarak veya dosya yükleyerek önizleyebilmeli ve import edebilmelidir.
8. Kural marker sistemi daha görünür, açılıp kapanabilir ve sağ panelle bağlantılı olmalıdır.

---

## Kalıcı BULGARCA UI kuralı

Bundan sonra uygulamada görünen bütün Bulgarca/Türkçe öğrenme içeriği aşağıdaki merkezi ayarlara uymalıdır.

Bu ayarlar tek bir global store/context içinde tutulmalı, localStorage’a yazılmalı ve GitHub senkronunda `users/mustafa/lesson-state.json` içine de kaydedilebilir olmalıdır.

---

# 1. Global Display Preferences

`src/state/displayPreferences.tsx` veya benzer bir context/store oluştur.

Zorunlu state:

```ts
export type ScriptMode = "print" | "handwriting";

export type LetterCaseMode =
  | "uppercase"
  | "lowercase"
  | "titlecase_words"
  | "sentencecase";

export type LanguageMode =
  | "bg_hover_tr"
  | "tr_hover_bg"
  | "both_bg_first"
  | "both_tr_first"
  | "quiz_hide_secondary";

export type MarkerMode = "off" | "soft" | "strong";

export interface DisplayPreferences {
  scriptMode: ScriptMode;
  letterCaseMode: LetterCaseMode;
  languageMode: LanguageMode;
  markerMode: MarkerMode;
  showTransliteration: boolean;
  showPronunciation: boolean;
}
```

Varsayılan:

```ts
{
  scriptMode: "print",
  letterCaseMode: "sentencecase",
  languageMode: "bg_hover_tr",
  markerMode: "soft",
  showTransliteration: true,
  showPronunciation: true
}
```

---

# 2. Harf / kelime / cümle biçimlendirme kuralları

Tüm uygulamada Bulgarca metin render edilirken merkezi bir yardımcı fonksiyon kullanılmalı:

```ts
formatBulgarianText(text, displayPreferences, options)
```

## Harf stili

- `scriptMode: "print"` → basılı Kiril biçimi
- `scriptMode: "handwriting"` → mümkünse el yazısı alanı / el yazısı fontu / JSON’daki handwriting formu

Alfabe dersinde JSON’da `print_upper`, `print_lower`, `handwriting_upper`, `handwriting_lower` varsa doğrudan bunlar kullanılmalı.

Kelime ve cümlelerde gerçek el yazısı karakter formu yoksa CSS/font sınıfı kullanılmalı:

```css
.bg-handwriting {
  font-family: "Caveat", "Segoe Print", "Comic Sans MS", cursive;
}
```

Not: Font kesin değilse sistem fontu kullanılabilir. Harf kartlarında JSON’daki el yazısı formu önceliklidir.

## Harf büyüklüğü / case modu

Kullanıcıya her dersin üstünde, ayrıca ayarlar ekranında şu 4 seçenek sunulmalı:

1. **Büyük Harf**
   - Örnek: `ЗДРАВЕЙТЕ`
2. **Küçük Harf**
   - Örnek: `здравейте`
3. **Kelime İlk Harfi Büyük**
   - Örnek: `Добър Ден`
4. **Cümle İlk Harfi Büyük**
   - Örnek: `Добър ден`

Bu dört seçenek sadece alfabe kartlarında değil; ana sayfa, ders kartları, sağ panel, örnek kelimeler, diyaloglar, alıştırmalar ve review ekranında da geçerli olmalıdır.

---

# 3. Language Mode — Bulgarca/Türkçe gösterim seçeneği

Kullanıcı artık Bulgarca ve Türkçeyi her zaman birlikte görmek zorunda olmamalıdır.

Her dersin üstünde ve ayarlarda şu seçenekler olmalı:

## 3.1 Bulgarca göster, Türkçeyi hover’da göster

`languageMode = "bg_hover_tr"`

Ekranda sadece Bulgarca görünür.

Örnek:

```txt
Здравей!
```

Hover:

```txt
Merhaba! / Selam! (samimi)
```

Bu varsayılan mod olmalıdır.

## 3.2 Türkçe göster, Bulgarcayı hover’da göster

`languageMode = "tr_hover_bg"`

Ekranda Türkçe görünür.

Örnek:

```txt
Merhaba!
```

Hover:

```txt
Здравей!
```

## 3.3 İkisini birlikte göster — Bulgarca önce

`languageMode = "both_bg_first"`

```txt
Здравей!
Merhaba!
```

## 3.4 İkisini birlikte göster — Türkçe önce

`languageMode = "both_tr_first"`

```txt
Merhaba!
Здравей!
```

## 3.5 Quiz modu / ikincil dili gizle

`languageMode = "quiz_hide_secondary"`

Sadece ana dil görünür; hover veya tıklama ile cevap açılır.

---

# 4. Global Hover sistemi

`src/components/LangHover.tsx` veya mevcut `BulgarianHover.tsx` bileşenini genişlet.

## Props

```ts
interface LangHoverProps {
  bg?: string;
  tr?: string;
  tooltip?: string;
  detail?: string;
  sourceRef?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  forceMode?: LanguageMode;
}
```

## Davranış

- Ekranda Bulgarca görünüyorsa hover’da Türkçe göster.
- Ekranda Türkçe görünüyorsa hover’da Bulgarca göster.
- İki dil birlikte görünüyorsa hover’da kısa açıklama veya kural ipucu göster.
- Tooltip boşsa glossary lookup çalışsın.
- Glossary’de de yoksa “Türkçe açıklama henüz eklenmedi” gibi kaba bir ifade yerine küçük bir `?` info gösterebilir.
- Tooltip mobilde hover olmadığı için dokununca kısa popover olarak açılmalı.
- Tıklanınca sağ panel ilgili kelime/kural/ifade detayını açabilmeli.

## Global kural

Aşağıdaki tüm alanlarda LangHover kullanılmalı:

- Alfabe harfleri
- Harf örnek kelimeleri
- Ses/harf dönüşüm örnekleri
- Çoğul örnekleri
- Kural başlıkları içindeki Bulgarca parçalar
- Tanışma/selamlaşma ifadeleri
- Diyalog cümleleri
- Alıştırma soruları ve seçenekleri
- Sağ paneldeki tüm Bulgarca örnekler
- Dashboard’daki son ders / kelime örnekleri
- Review ekranı
- Sözlük ekranı

---

# 5. Sağ panel senkronizasyonu

Sağ panel artık kendi başına görünüm belirlememeli. Global display preferences üzerinden render etmeli.

## Harf detayı

Ana panelde:

- El yazısı seçiliyse sağ panel el yazısı göstermeli.
- Basılı seçiliyse sağ panel basılı göstermeli.
- Büyük harf seçiliyse sadece büyük form.
- Küçük harf seçiliyse sadece küçük form.
- Kelime/cümle case seçiliyse örnekler buna göre biçimlenmeli.

## Kelime detayı

Kelime detayında:

- `languageMode = bg_hover_tr` ise ana büyük gösterim Bulgarca olmalı, Türkçe hover veya küçük açıklama olarak opsiyonel olmalı.
- `languageMode = tr_hover_bg` ise ana gösterim Türkçe olmalı, Bulgarca hover’da görünmeli.
- Hem sağ panel hem ana içerik aynı modu kullanmalı.

---

# 6. Marker sistemi

Kural marker sistemi ayrı bir global ayar olmalı:

- `off`: hiçbir renkli marker yok
- `soft`: hafif mavi/yeşil arka plan
- `strong`: daha belirgin renkli marker + kural etiketi

Örnek:

```txt
анархия → анархии
```

Burada `ия` ve `ии` parçaları marker ile işaretlenmeli.

```txt
амоняк → амоняци
```

Burada `к → ц` değişimi marker ile gösterilmeli.

```txt
зоолог → зоолози
```

Burada `г → з` değişimi marker ile gösterilmeli.

Marker’a hover:

```txt
Bu kelimede çoğulda son ses değişimi var: г → з, ek -и gelir.
```

Marker’a tıklama:

Sağ panelde ilgili kural detayı açılır.

---

# 7. Boş ders fix

Şu anda bazı derslerde başlık görünüyor ama içerik boş kalıyor.

Özellikle:

- `lesson-002-ses-harf-donusumleri`
- başlık: “Türkçe-Bulgarca Ses ve Harf Dönüşümleri: Genişletilmiş”

Bu ders asla boş görünmemeli.

## Yapılacaklar

1. İlgili lesson JSON dosyasını kontrol et.
2. Renderer’ın beklediği schema ile lesson JSON schema’sı uyuşuyor mu kontrol et.
3. Eğer lesson içinde `sections`, `rule_groups`, `conversion_rules`, `examples`, `cards`, `tables` gibi alanlar varsa renderer hepsini desteklemeli.
4. Renderer bilinmeyen section type görünce boş geçmemeli; en azından “Bu bölüm tipi desteklenmiyor” debug kartı göstermeli.
5. Final kullanıcı görünümünde boş ders olmamalı.

## Zorunlu section renderer desteği

LessonRenderer şunları desteklemeli:

```ts
"type": "text"
"type": "alphabet_cards"
"type": "rule_cards"
"type": "conversion_rule_grid"
"type": "plural_rule_grid"
"type": "dialogue"
"type": "phrase_cards"
"type": "grammar_table"
"type": "word_table"
"type": "exercise_preview"
```

Eğer veri şu alanlardan geliyorsa otomatik map edilmeli:

```ts
lesson.sections
lesson.cards
lesson.rules
lesson.rule_groups
lesson.conversion_rules
lesson.examples
lesson.dialogues
lesson.tables
```

---

# 8. JSON import sistemi

Kullanıcı yeni JSON paketini arayüzden import edebilmeli.

Ayarlar veya ayrı `Developer Import` ekranı oluştur.

## Import seçenekleri

1. JSON yapıştır
2. JSON dosyası yükle
3. Import bundle yükle
4. Sadece önizle
5. Local uygula
6. GitHub’a uygula

## Import bundle tipi

Tek dosyalık import standardı:

```json
{
  "bundle_type": "bulgarca_import_bundle",
  "schema_version": "1.0",
  "bundle_id": "import-003-display-fix",
  "created_at": "2026-05-13",
  "lessons": [],
  "exercises": [],
  "patches": {
    "rules": [],
    "glossary": [],
    "source_index": [],
    "manifest": []
  },
  "ui_patch_notes": [],
  "migration_notes": []
}
```

## Önizleme ekranı

Import edilmeden önce kullanıcı şunları görmeli:

- Kaç ders eklenecek/güncellenecek?
- Kaç kelime eklenecek?
- Kaç kural eklenecek/güncellenecek?
- Hangi dosyalar değişecek?
- Çakışma var mı?
- Geri alma mümkün mü?

## GitHub’a uygulama

Statik MVP olduğu için GitHub’a yazmak için token gerekir.

Bu ekranda iki mod olsun:

1. **User-data mode**
   - progress/difficult/known/review dosyalarını yazar.
2. **Content repo developer mode**
   - `mustafasacar50/bulgarca` repo’sundaki `public/data` dosyalarını günceller.
   - Bu mod için tokenın ana repo’ya write izni olmalıdır.
   - Uyarı göster: “Bu işlem ders içeriklerini değiştirir.”

---

# 9. Veri schema genişletme

Mevcut lesson / glossary / rule JSON yapısına şu alanlar desteklenmeli:

## Kelime / ifade

```json
{
  "id": "phrase-zdravey",
  "bg": "Здравей!",
  "tr": "Merhaba! / Selam!",
  "tooltip_tr": "Samimi merhaba ifadesi.",
  "tooltip_bg": "Здравей!",
  "detail_tr": "Daha samimi konuşmada kullanılır.",
  "register": "informal",
  "source_refs": []
}
```

## Kural örneği

```json
{
  "bg_base": "анархия",
  "bg_result": "анархии",
  "tr": "anarşi",
  "markers": [
    {
      "from": "ия",
      "to": "ии",
      "rule_id": "plural_ia_to_ii",
      "tooltip_tr": "-ия ile biten kelime çoğulda -ии olur."
    }
  ]
}
```

## Harf

```json
{
  "letter_id": "bg-letter-a",
  "print_upper": "А",
  "print_lower": "а",
  "handwriting_upper": "А",
  "handwriting_lower": "а",
  "sound": "a",
  "transliteration": "A",
  "tr_hint": "Türkçedeki a sesine çok yakındır.",
  "examples": [
    {
      "bg": "азбука",
      "tr": "alfabe",
      "tooltip_tr": "alfabe"
    }
  ]
}
```

---

# 10. Mevcut dersleri düzelt

Aşağıdaki dersleri bu kurallara göre düzelt:

## lesson-001-alfabe

- 30 harf kartı görünmeli.
- Basılı / el yazısı toggle tüm kartlara ve sağ panele uygulanmalı.
- 4 case modu tüm örneklere uygulanmalı.
- Harfe tıklayınca sağ panelde aynı stil görünmeli.
- Örnek kelimelerde hover Türkçe anlam vermeli.

## lesson-002-ses-harf-donusumleri

- Boş kalmamalı.
- Tüm dönüşüm kuralları görünmeli.
- Her kuralda en az 5-10 örnek olmalı.
- Marker açıkken dönüşen parça renkli görünmeli.
- Kural kartına tıklayınca sağ panelde örnekler açılmalı.

## lesson-003-cogul-ve-ortak-kelimeler

- -ия → -ии
- -к → -ци
- -г → -зи
- Örnekler markerlı olmalı.
- Kelime tablosunda Bulgarca/Türkçe gösterimi language mode’a göre değişmeli.

## lesson-004-tanisma-ve-selamlasma

- Bulgarca/Türkçe birlikte zorunlu görünmemeli.
- Varsayılan: Bulgarca görünür, Türkçe hover’da çıkar.
- Sağ panelde de aynı dil modu geçerli olmalı.
- İfade kartları, diyaloglar, `казвам се`, `съм` tablosu hover desteklemeli.

---

# 11. Ayarlar UI

Üstte veya ders başlığının altında “Görünüm” paneli olsun:

- Yazı tipi: Basılı / El yazısı
- Harf görünümü:
  - Büyük
  - Küçük
  - Kelime ilk harf büyük
  - Cümle ilk harf büyük
- Dil görünümü:
  - Bulgarca + Türkçe hover
  - Türkçe + Bulgarca hover
  - İkisi birlikte: Bulgarca önce
  - İkisi birlikte: Türkçe önce
  - Quiz modu
- Marker:
  - Kapalı
  - Hafif
  - Belirgin

Bu ayarlar global olmalı ve her derste aynı kalmalı.

---

# 12. Test checklist

Aşağıdakileri tek tek test et:

- `/bulgarca/` açılınca ders sayısı sabit kalıyor mu?
- Bir derse girip geri dönünce ders sayısı değişmiyor mu?
- 2. ders artık boş değil mi?
- El yazısı seçilince sağ panel de el yazısı oluyor mu?
- Büyük harf seçilince sağ panel, örnekler, kartlar büyük harf oluyor mu?
- Küçük harf seçilince tüm Bulgarca içerikler küçük oluyor mu?
- Kelime ilk harf büyük modu çalışıyor mu?
- Cümle ilk harf büyük modu çalışıyor mu?
- Bulgarca + hover Türkçe modunda Türkçe metin doğrudan görünmüyor mu?
- Türkçe + hover Bulgarca modunda Bulgarca metin hover’da çıkıyor mu?
- İkisi birlikte modunda iki dil de görünüyor mu?
- Marker kapatılınca markerlar kayboluyor mu?
- Marker güçlü modda dönüşen parçalar belirginleşiyor mu?
- `анархия → анархии` markerlı mı?
- `амоняк → амоняци` markerlı mı?
- `зоолог → зоолози` markerlı mı?
- `Здравей!` hover’da Türkçe açıklama veriyor mu?
- Sağ paneldeki örnekler de hover destekli mi?
- `npm run build` hatasız mı?

---

# 13. Dokümantasyon güncelle

Aşağıdaki dosyaları da güncelle:

- `docs/RULE_ENGINE_SPEC.md`
- `docs/DATA_SCHEMA.md`
- `docs/CONTENT_WORKFLOW.md`
- `docs/CODEX_PROMPTS.md`

Yeni kalıcı kuralları bu dokümanlara ekle:

1. Global display preferences
2. Language mode
3. Sağ panel senkronizasyonu
4. Her Bulgarca/Türkçe öğrenme içeriği için hover
5. Marker mode
6. JSON import bundle standardı

---

# 14. Commit

Commit mesajı:

```txt
Add global display modes language hover system import UI and fix empty lesson rendering
```

---

# 15. Beklenen sonuç

Bu patch sonunda uygulama sadece “ders gösteren” bir ekran olmayacak; her ders aynı öğrenme sistemine bağlanacak:

- global stil
- global dil modu
- hover
- sağ panel
- marker
- JSON import
- boş ders koruması
- ileride gelecek PDF importlarına hazır modüler yapı
