# PATCH 010 — Marker doğruluğu: ASETİLEN ve S → Ц / ц (ts) düzeltmesi

## Sorun

Sözlük arama ekranında `ASETİLEN → Ацетилен` örneğinde uygulama yanlış biçimde `A → а` ve/veya `E → е` gibi geniş ve önemsiz eşleşmeleri markerlıyor. Oysa kaynak PDF’de bu kelime `S (YON) → Ц (ИЯ)` grubu altında verilmiştir. Burada asıl öğrenme değeri taşıyan dönüşüm:

```txt
ASETİLEN → Ацетилен
S → Ц / ц
```

Bulgarcadaki `ц` harfi Türkçe kulağa `ts` gibi gelir. Bu nedenle `Ацетилен` kelimesinde marker `ц` üzerinde olmalıdır. Türkçe görünüm modunda ise `ASETİLEN` içindeki `S` markerlanmalıdır.

## Kaynak dayanağı

- `zup-tan-k BG Ders.pdf`, sayfa 3: `S (YON) → Ц (ИЯ)` başlığı altında `ASETİLEN → ацетилен`, `ASETON → ацетон`, `SİRK → цирк`, `SİVİL → цивилен` örnekleri yer alır.
- `kucuk-sozlukWORD-yeil`, sayfa 31: sözlükte `ASETİLEN → Ацетилен`, `ASETON → Ацетон` girdileri vardır.

## Ana karar

Marker motoru sadece yüzeysel harf benzerliğiyle marker üretmemeli. Öncelik şu sırada olmalıdır:

1. `entry.rule_marks` içindeki explicit markerlar
2. `rule.examples[].rule_marks` içindeki birebir kaynak örnekleri
3. Özel/ayırt edici consonant ve cluster kuralları: `Ş→Ш`, `J→Ж`, `S→Ц`, `SYON→ЦИЯ`, `Ç→Ч/Ц`, `P→Б`, `OTO→АВТО` vb.
4. Suffix / prefix kuralları
5. Geniş vowel kuralları (`A→E`, `E→A`, `A→O`, `I/İ varyantları`) sadece birebir kaynak örneği varsa uygulanmalı; otomatik tüm kelimelere uygulanmamalı.

## Yapılacaklar

### 1. `cog-tr-syon-to-bg-tsiya` kuralını genişlet

`public/data/rules/cognate-pattern-rules.full.json` içindeki `cog-tr-syon-to-bg-tsiya` kuralının örnekleri eksik. Aşağıdaki tüm örnekler eklenmeli:

```txt
SİGARA → цигара       Sİ → ци
DESİGRAM → дециграм   Sİ → ци
DEKORASYON → декорация SYON → ция
DELEGASYON → делегация SYON → ция
AKASYA → акация       SYA → ция
ASETİLEN → ацетилен   S → ц
ASETON → ацетон       S → ц
NAVİGASYON → навигация SYON → ция
SİRK → цирк           Sİ → ци
SİVİL → цивилен       Sİ → ци
```

### 2. `ASETİLEN` için explicit glossary marker ekle

Sözlük kaydında şu alan desteklenmeli:

```json
{
  "tr": "ASETİLEN",
  "bg": "Ацетилен",
  "rule_refs": ["cog-tr-syon-to-bg-tsiya"],
  "rule_marks": [
    {
      "rule_id": "cog-tr-syon-to-bg-tsiya",
      "source_text": "ASETİLEN",
      "source_fragment": "S",
      "target_text": "Ацетилен",
      "target_fragment": "ц",
      "tooltip_tr": "Bu ortak kelimede Türkçedeki S, Bulgarcada Ц/ц yani ts sesiyle yazılır."
    }
  ]
}
```

Aynı mantık `ASETON → Ацетон` için de uygulanmalı.

### 3. Yanlış geniş vowel markerlarını engelle

Şu rule_id’ler otomatik tüm kelimelere uygulanmamalı:

```txt
cog-tr-e-to-bg-a
cog-tr-a-to-bg-e
cog-tr-a-to-bg-o
cog-tr-i-variants
```

Bu kurallara şu davranış eklenmeli:

```json
"auto_apply": false,
"apply_mode": "explicit_examples_only"
```

Bu kurallar yalnızca kendi `examples` listesindeki birebir örneklerde marker üretmeli. Örneğin `ASETİLEN` içinde `A` ve `E` markerlanmamalı.

### 4. Marker motoru seçim skoru

`findCognatePatternMatches(pair, rules)` içinde eşleşmelere skor ver:

- explicit `rule_marks`: 100
- exact example pair match: 90
- consonant/cluster transform: 70
- suffix/prefix transform: 60
- broad vowel transform: 20 ve sadece explicit ise

Aynı harf aralığında daha düşük skor varsa atılsın.

### 5. Sağ panelde yalnızca gerçekten markerlanan kural üstte gösterilsin

`ASETİLEN` sağ panelinde üstte şu görünmeli:

```txt
S → Ц / ц
Türkçedeki S bu kelimede Bulgarcada ц ile yazılır. Ц harfi ts gibi okunur.
```

`A → а` veya `E → е` gibi kimlik/benzerlik bilgileri “ilgili kural” olarak gösterilmemeli.

## Test

1. Sözlükte `asetilen` ara.
2. Sonuçta `Ацетилен` görünmeli.
3. Marker sadece `ц` üzerinde olmalı.
4. Sağ panelde sadece `S → Ц / ц` kuralı görünmeli.
5. `ASETON → Ацетон` için de aynı davranış olmalı.
6. `DEKORASYON → декорация` için `SYON → ция` markerı korunmalı.
7. `KAMELYA → Камелия` için `YA → ия` markerı korunmalı.
8. `npm run build` hatasız çalışmalı.

## Commit mesajı

```txt
Fix cognate marker specificity for S to TS examples
```
