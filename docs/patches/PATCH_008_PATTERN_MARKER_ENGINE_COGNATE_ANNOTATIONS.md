# PATCH 008 — Ortak kelime sözlüğünde otomatik kural markerları

Ana repo: `mustafasacar50/bulgarca`

## Sorun

Sözlük ekranında `KAMELYA → Камелия` gibi kelimeler gösteriliyor ancak kelimenin hangi kural ile oluştuğu marker ile gösterilmiyor. Oysa kaynak PDF'lerde bu kelime açıkça `YA → ИЯ` dönüşüm grubu altında veriliyor.

Örnek doğru görünüm:

```txt
KAMEL[YA] → Камел[ия]
```

Hover:

```txt
YA → ИЯ: Türkçedeki -ya bitişi Bulgarcada çoğu ortak kelimede -ия olur.
```

Sağ panel:

```txt
Kural: YA → ИЯ
Örnekler: İTALYA → Italia, KAMELYA → Kameliya, LİTOGRAFYA → litografiya, ASYA → Aziya
Kaynak: zup-tan-k BG Ders, s. 2; A1-V-1-2, s. 5; Küçük Sözlük, s. 58
```

## Kalıcı kural

Bundan sonra `glossary_table`, `word_table`, `rule_cards`, `conversion_rule_grid`, sağ panel ve arama sonuçlarında bir kelimenin `rule_refs`, `rule_marks`, `annotations` veya pattern eşleşmesi varsa dönüşen parça marker ile gösterilmelidir.

## 1. Rule matcher genişletmesi

`src/engine/ruleMatcher.ts` içine veya benzer dosyaya şu mantığı ekle:

```ts
export interface PairMarker {
  rule_id: string;
  color_key: string;
  tr_fragment?: string;
  bg_fragment?: string;
  tr_start?: number;
  tr_end?: number;
  bg_start?: number;
  bg_end?: number;
  tooltip_tr?: string;
}

export function findPairMarkers(params: {
  tr?: string;
  bg?: string;
  ruleRefs?: string[];
  rules: Rule[];
}): PairMarker[] {
  // 1. entry.rule_marks varsa önce onu kullan.
  // 2. rule_refs varsa ilgili rule.pattern.source_fragment / target_fragment ile eşle.
  // 3. suffix dönüşümlerinde önce suffix'i yakala.
  // 4. fragment dönüşümlerinde kelime içinde ilk güvenli eşleşmeyi yakala.
  // 5. Eşleşme yoksa boş dizi döndür.
}
```

## 2. Marker render bileşeni

`LearningText`, `LangHover` veya yeni `MarkedText` bileşeni şu alanları desteklemeli:

```ts
interface MarkedSegment {
  text: string;
  marked?: boolean;
  rule_id?: string;
  tooltip_tr?: string;
  color_key?: string;
}
```

Marker modu:

- `off`: düz metin
- `subtle` / `soft`: hafif alt çizgi veya hafif arka plan
- `strong`: belirgin arka plan + mümkünse küçük kural etiketi

## 3. Sözlük tablosunda marker

`glossary_table` satırlarında:

- Bulgarca sütununda `bg` markerlı gösterilmeli.
- Türkçe hover veya Türkçe sütunu aktifse `tr` tarafı da markerlı gösterilebilmeli.
- Arama sonucu tek satır olsa bile marker kaybolmamalı.
- Sağ panelde aynı markerlar korunmalı.

Örnek:

```txt
Камелия
```

Marker açıkken:

```txt
Камел[ия]
```

Hover:

```txt
YA → ИЯ: KAMELYA kelimesindeki YA, Bulgarcada ия olarak yazılır.
```

## 4. Sağ panel kural bağlantısı

Bir kelimeye tıklanınca sağ panel sadece kelimeyi göstermemeli; varsa ilişkili kuralları da göstermeli:

- Kelime
- Türkçe karşılık
- Rule badges
- Markerlı Türkçe → Bulgarca eşleşme
- Kaynak PDF/sayfa
- Aynı kurala ait diğer örnekler

## 5. Otomatik backfill

Tam sözlükteki mevcut girdilere, rule_refs yoksa pattern ile otomatik ekleme yapılabilir.

Özellikle şu patternler desteklensin:

- Turkish suffix `YA` + Bulgarian suffix `ия` → `tr-ya-to-bg-iya`
- Turkish suffix `JI` / `Jİ` + Bulgarian suffix `гия` → `tr-ji-to-bg-giya`
- Turkish suffix `SYON` + Bulgarian suffix `ция` → `tr-syon-to-bg-tsiya`
- Turkish suffix `İZM` + Bulgarian suffix `изъм` → `tr-izm-to-bg-izum`
- Turkish `Ü` + Bulgarian `ю` veya `у` → ilgili rule
- Turkish `Ö` + Bulgarian `ьо`, `о`, `ев`, `еу` → ilgili rule

İlk hedef: `KAMELYA → Камелия` satırında `YA → ИЯ` markerı görünmeli.

## 6. Data alanı standardı

Glossary entry şu alanları desteklemeli:

```json
{
  "entry_id": "word-bg-kameliya",
  "tr": "KAMELYA",
  "bg": "Камелия",
  "rule_refs": ["tr-ya-to-bg-iya"],
  "rule_marks": [
    {
      "rule_id": "tr-ya-to-bg-iya",
      "tr_fragment": "YA",
      "bg_fragment": "ия",
      "color_key": "blue",
      "tooltip_tr": "YA → ИЯ: Türkçedeki -ya bitişi Bulgarcada -ия olur."
    }
  ]
}
```

## 7. Test listesi

1. Sözlük dersinde `kamelya` ara.
2. `Камелия` satırında `ия` markerlı görünsün.
3. Hover’da `YA → ИЯ` açıklaması çıksın.
4. Kelimeye tıklayınca sağ panelde rule badge ve markerlı eşleşme görünsün.
5. `İTALYA`, `ASYA`, `İSPANYA`, `MALARYA` için de aynı kural çalışsın.
6. Marker kapalıyken marker görünmesin.
7. Marker güçlü modda dönüşen parça belirginleşsin.
8. `npm run build` hatasız çalışsın.

## Commit mesajı

```txt
Add automatic cognate pattern markers to glossary entries
```
