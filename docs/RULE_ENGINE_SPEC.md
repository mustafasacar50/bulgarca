# BULGARCA Rule Engine Spec

Bu dosya, uygulamadaki kural yakalama, renkli marker, hover tooltip ve sağ panel açıklama sistemini tanımlar.

## Amaç

Kullanıcı Bulgarca bir kelime veya cümle gördüğünde, kelimenin içindeki öğrenme değeri taşıyan parçalar otomatik veya JSON tabanlı olarak işaretlenmelidir.

Örnek:

```txt
анархия → анархии
```

Burada `ия` ve `ии` parçaları kural marker ile gösterilebilir.

Hover açıklaması:

```txt
-ия ile biten bazı kelimeler çoğulda -ии olur.
```

Tıklanınca sağ panelde ayrıntılı açıklama açılır.

---

# 1. Kural kategorileri

## 1.1 phonetic_mapping

Türkçe-Bulgarca ses/harf dönüşümleri.

Örnekler:

- Ş → Ш
- J → Ж
- Ç → Ч
- Ç → Ц
- Ü → Ю
- Ü → У
- Ö → ЬО
- Ö → О
- S(YON) → Ц(ИЯ)
- -İZM → -ИЗЪМ

## 1.2 plural_rule

Çoğul yapıları.

Örnekler:

- -ия → -ии
- -к → -ци
- -г → -зи

## 1.3 grammar_rule

Cümle veya çekim kuralları.

Örnekler:

- `Казвам се ...` = Adım ...
- `Аз съм ...` = Ben ...
- `Глагол + ли?` = soru yapısı
- `Име + ли + съм/си/е...` = isimle soru yapısı

## 1.4 alphabet_rule

Harf, ses ve transliterasyon kuralları.

Örnekler:

- Ю = й + у
- Я = й + а
- Щ = ш + т
- Й özel yarı ünlü sesidir

## 1.5 word_note

Tek bir kelimeye ait açıklama.

Örnek:

- `здравейте` her zaman kullanılabilen “merhaba” benzeri selamlamadır.
- `сбогом` kalıcı ayrılıkta kullanılır.

---

# 2. Marker sistemi ve Görünüm Modları

Her kural, marker alanı taşımalıdır.

```json
{
  "marker": {
    "color_key": "blue",
    "highlight_source": "Ş",
    "highlight_target": "ш",
    "style": "underline"
  }
}
```

## 2.1 Marker Modları (MarkerMode)

Kullanıcı arayüzden marker yoğunluğunu seçebilir:

- `off`: Hiçbir renkli marker veya kural vurgusu gösterilmez. Sadece düz metin.
- `soft`: Hafif vurgu. Arka plan rengi yerine sadece altı çizili veya soluk renkli metin.
- `strong`: Belirgin vurgu. Arka plan rengi + kural etiketi + yüksek kontrast.

## 2.2 Global Görünüm Tercihleri (DisplayPreferences)

Kuralların ve metinlerin gösterimi şu global ayarlara uymalıdır:

- `scriptMode`: "print" (basılı) veya "handwriting" (el yazısı).
- `letterCaseMode`: "uppercase", "lowercase", "titlecase_words", "sentencecase".
- `languageMode`: "bg_hover_tr", "tr_hover_bg", "both_bg_first", "both_tr_first", "quiz_hide_secondary".

## 2.3 color_key önerileri

- `blue`: ses/harf dönüşümü
- `green`: kelime anlamı
- `amber`: çoğul/kural değişimi
- `purple`: gramer/çekim
- `red`: dikkat/istisna
- `gray`: kaynak notu

Renkler Tailwind sınıflarıyla eşleştirilebilir ama JSON içinde Tailwind sınıfı doğrudan saklanmamalıdır. UI tarafında color_key → class map kullanılmalıdır.

---

# 3. Kural eşleme tipleri

## 3.1 explicit annotation

Lesson JSON içindeki annotation doğrudan bir rule_id gösterir. En güvenli yöntem budur.

```json
{
  "target": "ия",
  "rule_id": "plural-ia-to-ii",
  "start": 5,
  "end": 7
}
```

## 3.2 pattern-based match

Kural motoru pattern alanına göre kelimeyi otomatik yakalar.

```json
{
  "pattern": {
    "target_lang": "bg",
    "target_fragment": "ия",
    "position": "suffix",
    "match_type": "suffix"
  }
}
```

## 3.3 paired comparison

Türkçe ve Bulgarca kelime birlikte geldiğinde dönüşüm yakalanır.

```json
{
  "tr": "MARŞ",
  "bg": "марш",
  "rule_refs": ["tr-sh-to-bg-sh"]
}
```

---

# 4. Tooltip standardı

Tooltip kısa olmalıdır.

İyi örnek:

```txt
Ş sesi Bulgarcada Ш ile yazılır.
```

Kötü örnek:

```txt
Bu kelime etimolojik olarak Türkçe üzerinden Bulgarcada tarihsel olarak farklı dönüşümlerle ...
```

Kural: Tooltip 1 cümle, sağ panel ayrıntılı olmalıdır.

---

# 5. Sağ panel standardı

Sağ panelde şu alanlar olmalıdır:

```json
{
  "panel_tr": {
    "summary": "Kısa özet",
    "details": [
      "Madde 1",
      "Madde 2"
    ],
    "examples": [
      {
        "bg": "анархия → анархии",
        "tr": "anarşi → anarşiler"
      }
    ],
    "practice_hint": "Bu kuralı -ия ile biten kelimelerde arayabilirsin."
  }
}
```

---

# 6. Öncelik sırası

Aynı kelimede birden fazla kural yakalanırsa:

1. Lesson JSON içindeki explicit annotations
2. Kelime entry’sindeki rule_refs
3. Pattern-based rule matching
4. Glossary tooltip
5. Genel fallback açıklaması

Explicit annotation her zaman pattern eşlemeden önceliklidir.

---

# 7. Çakışma yönetimi

Aynı kelime parçası birden fazla marker almak isterse:

- Öncelik explicit annotation’dadır.
- Aynı aralıkta iki marker varsa en spesifik olan seçilir.
- Bir kelime hem sözlük hem kural marker’ı taşıyorsa kelime tamamı yeşil, kural parçası amber alt çizgi olabilir.
- UI iç içe span karmaşasını engellemek için tokenization tabanlı render yapmalıdır.

---

# 8. Kullanıcı etkileşimi

## Hover

- Kısa tooltip göster.
- Mobilde hover yoktur; kısa dokunma tooltip, ikinci dokunma panel açabilir.

## Click / Tap

- Sağ panel açılır.
- Panelde kelime, kural, örnek, mini alıştırma ve kaynak bilgisi görünür.

## Uzun basma / alternatif

Mobilde kelime üzerine uzun basma “zor kelime olarak işaretle” seçeneği açabilir.

---

# 9. RuleMatcher fonksiyonu

`src/engine/ruleMatcher.ts`

Beklenen ana fonksiyonlar:

```ts
type MatchResult = {
  ruleId: string;
  start: number;
  end: number;
  matchedText: string;
  colorKey: string;
  tooltipTr: string;
};

export function matchRulesInText(text: string, rules: Rule[]): MatchResult[];
export function mergeExplicitAnnotationsWithMatches(annotations: Annotation[], matches: MatchResult[]): MatchResult[];
export function renderableSegments(text: string, matches: MatchResult[]): RenderSegment[];
```

---

# 10. İlk kural dosyaları

Başlangıçta şu dosyalar oluşturulmalıdır:

```txt
public/data/rules/alphabet-rules.json
public/data/rules/phonetic-rules.json
public/data/rules/plural-rules.json
public/data/rules/grammar-rules.json
```

---

# 11. Öğrenme yaklaşımı

Kural motorunun amacı sadece “renkli gösterme” değildir. Amaç, kullanıcının ortak kelimeler üzerinden Bulgarca yazım, ses ve gramer sezgisi kazanmasıdır.

Bu nedenle her kuralda mutlaka:

- kısa Türkçe açıklama
- en az 2 örnek
- mümkünse Türkçe-Bulgarca karşılaştırma
- kaynak bilgisi
- alıştırma bağlantısı

bulunmalıdır.
