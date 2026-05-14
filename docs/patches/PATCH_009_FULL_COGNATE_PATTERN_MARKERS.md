# PATCH 009 — Full Cognate Pattern Marker Engine

## Amaç

Önceki patch yalnızca `YA → ИЯ` örneğini görünür hale getirdi. Bu yeterli değildir. `zup-tan-k BG Ders.pdf` içinde onlarca Türkçe-Bulgarca ses/harf dönüşümü vardır ve sözlük/sağ panel/lesson renderer bu kuralların tamamını markerlayabilmelidir.

## Eklenecek dosyalar

- `public/data/rules/cognate-pattern-rules.full.json`
- `public/data/lessons/lesson-002-ses-harf-donusumleri.json`
- `public/data/exercises/exercises-002-full-pattern-rules.json`

## Ana kural

Sözlükte, ders kartlarında, sağ panelde ve arama sonucunda bir Türkçe-Bulgarca ortak kelime çifti varsa uygulama sadece `rule_refs` alanına bakmayacak. Aşağıdaki sırayla marker arayacak:

1. `entry.rule_marks`
2. `entry.rule_refs`
3. `rule.examples[].rule_marks`
4. `cognate-pattern-rules.full.json` içindeki pattern-based / paired comparison eşleme
5. fallback: marker yok

## Desteklenmesi gereken kurallar

Bu patch içindeki JSON dosyasında 36 kural vardır. Örnek gruplar:

- Ş → Ш
- J → Ж
- -Jİ → -ГИ(Я)
- Ç → Ч / Ц
- Ö → ЬО / О / ЕВ / ЕУ
- Ü → Ю / У
- (İ)Y → Й
- YA → ИЯ / Я
- (İ)YA → ИА
- (İ)YE → ИЕ
- (İ)YO → ИО
- (İ)YU → ИУ
- S(YON) → Ц(ИЯ)
- T → Д
- F → В
- K/Ş/Y/∅/H → Х/Ф grubu
- -İZM → -ИЗЪМ
- I/İ varyantları
- OTO- → АВТО-
- E/A/P varyantları

## Marker örneği

`KAMELYA → Камелия`

Ekranda:

- Türkçe tarafta `YA` markerlanmalı.
- Bulgarca tarafta `ия` markerlanmalı.
- Hover: `YA → ИЯ: -ya bitişi Bulgarcada -ия olur.`
- Tıklama: sağ panelde kural detayı açılmalı.

`DEKORASYON → декорация`

- Türkçe tarafta `SYON`
- Bulgarca tarafta `ция`

`OTOBÜS → автобус`

- Türkçe tarafta `OTO`
- Bulgarca tarafta `авто`

## Kod değişikliği

### 1. Rule loader

`cognate-pattern-rules.full.json` manifest/rule_files içine eklenmeli ve global rule registry'ye yüklenmeli.

### 2. Marker engine

`src/engine/ruleMatcher.ts` veya mevcut marker motorunda yeni fonksiyon:

```ts
findCognatePatternMatches(pair: { tr: string; bg: string }, rules: Rule[]): RuleMatch[]
```

Bu fonksiyon:
- exact example eşleşmesini öncelemeli
- sonra pattern eşlemesine geçmeli
- aynı kelimede birden fazla kural varsa hepsini döndürmeli
- çakışan aralıklar için explicit `rule_marks` öncelikli olmalı

### 3. LearningText / WordTable

Sözlük satırı render edilirken:

```tsx
<LearningText bg={entry.bg} tr={entry.tr} ruleRefs={entry.rule_refs} ruleMarks={computedMatches} />
```

### 4. Sağ panel

Kelime detay panelinde:
- `Uygulanan kurallar` bölümü gösterilmeli
- her rule chip tıklanabilir olmalı
- chip tıklanınca RuleDetail paneli açılmalı

### 5. Lesson 002

`conversion_rule_grid` section tipi `rule_file_ref` üzerinden tüm kuralları okuyup gruplu göstermeli.

## Test

- KAMELYA → Камелия: YA/ия marker görünmeli
- MORFOLOJİ → морфология: Jİ/гия marker görünmeli
- DEKORASYON → декорация: SYON/ция marker görünmeli
- OTOBÜS → автобус: OTO/авто marker görünmeli
- ATEİZM → атеизъм: İZM/изъм marker görünmeli
- MİKROP → микроб: P/б marker görünmeli
- NÖROLOG → невролог: NÖRO/невро marker görünmeli
- Marker kapalı/sade/güçlü modları tüm örneklere uygulanmalı
- npm run build hatasız çalışmalı

## Commit mesajı

Apply full cognate pattern marker engine
