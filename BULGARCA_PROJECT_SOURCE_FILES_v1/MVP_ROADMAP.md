# BULGARCA MVP Roadmap

Bu dosya ilk çalışan sürüme kadar izlenecek teknik ve içerik yol haritasını tanımlar.

## Temel karar

İlk MVP statik çalışacaktır. Vercel/backend yoktur. GitHub token kullanıcı tarafından uygulama arayüzüne manuel girilir. Ders verileri `public/data` altındaki JSON dosyalarından okunur. Kişisel ilerleme `bulgarca-user-data` reposundaki JSON dosyalarına kaydedilir.

---

# Faz 0 — Repo ve kaynak dosyalar

## Hedef

Proje omurgasını belirleyen dokümantasyon ve klasör yapısı hazırlanır.

## Dosyalar

```txt
docs/
  PROJECT_INSTRUCTIONS.md
  DATA_SCHEMA.md
  RULE_ENGINE_SPEC.md
  CONTENT_WORKFLOW.md
  SYNC_ARCHITECTURE.md
  MVP_ROADMAP.md
  IMPORT_PACKAGE_TEMPLATE.md
  CODEX_PROMPTS.md
```

## Başarı kriteri

Codex/Antigravity yeni chat veya yeni görevde bu dosyaları okuyunca projeyi anlayabilmeli.

---

# Faz 1 — Vite React iskeleti

## Hedef

Çalışan statik uygulama kurulur.

## Teknoloji

- React
- Vite
- TypeScript
- Tailwind

## Klasörler

```txt
public/data/
  manifest.json
  lessons/
  rules/
  glossary/
  exercises/
  sources/

src/
  components/
  engine/
  pages/
  types/
```

## Başarı kriteri

Uygulama tarayıcıda açılır ve “BULGARCA Öğrenme Uygulaması” dashboardu görünür.

---

# Faz 2 — Ders manifest ve ders okuyucu

## Hedef

Uygulama `public/data/manifest.json` dosyasını okur, dersleri listeler, seçilen ders JSON’unu gösterir.

## Bileşenler

- Dashboard
- LessonList
- LessonReader
- LessonSection
- ContentBlockRenderer

## Başarı kriteri

Yeni bir `lesson-XXX.json` ve manifest kaydı eklendiğinde ders otomatik listelenir.

---

# Faz 3 — Marker, tooltip ve sağ panel

## Hedef

Kelimelerde kural marker’ları gösterilir. Hover ile kısa açıklama, tıklama ile sağ panel açılır.

## Bileşenler

- HighlightedText
- HighlightedWord
- RuleTooltip
- RightInfoPanel
- RulePanel
- WordPanel

## Engine

- ruleMatcher.ts
- glossaryMatcher.ts
- annotationMerger.ts

## Başarı kriteri

Örnek olarak `анархия → анархии` yapısında `ия → ии` kuralı işaretlenir ve panelde açıklanır.

---

# Faz 4 — Alıştırma modülü

## Hedef

Derslere bağlı alıştırmalar çalışır.

## Bileşenler

- ExerciseCard
- MultipleChoiceExercise
- FillBlankExercise
- MatchPairsExercise
- WriteBgExercise
- ExerciseResult

## Başarı kriteri

Kullanıcı alıştırma çözer, doğru/yanlış sonucu görür ve skor progress state’e yazılır.

---

# Faz 5 — GitHub Sync ayar ekranı

## Hedef

Kullanıcı GitHub token girer, bağlantıyı test eder, progress dosyalarını yükler/kaydeder.

## Bileşenler

- SettingsPage
- GitHubSyncPanel
- SyncStatusBadge

## Engine

- githubSync.ts
- progressEngine.ts
- storage.ts

## Başarı kriteri

`bulgarca-user-data/users/mustafa/progress.json` dosyası uygulamadan okunup yazılabilir.

---

# Faz 6 — İlk içerik importu

## Hedef

Mevcut PDF’lerden ilk ders paketleri üretilir.

## İlk dersler

```txt
lesson-001-alfabe.json
lesson-002-ses-harf-donusumleri.json
lesson-003-ortak-kelimeler.json
lesson-004-tanisma-ve-selamlasma.json
lesson-005-zamirler-kazvam-se-sum.json
```

## Başarı kriteri

İlk 5 ders uygulamada görünür, marker ve tooltip yapısı çalışır.

---

# Faz 7 — Kümülatif patch sistemi

## Hedef

Yeni PDF geldiğinde uygulama kodu değişmeden içerik eklenebilir.

## Başarı kriteri

Yeni import paketi şu dosyalarla uygulanır:

```txt
lesson-XXX.json
glossary.patch.json
rules.patch.json
exercises-XXX.json
source-index.patch.json
changelog.md
codex-apply-prompt.md
```

---

# Faz 8 — İyileştirmeler

İlk MVP sonrası eklenebilecek özellikler:

- Otomatik senkron
- Spaced repetition
- Zor kelimeleri otomatik tekrar ettirme
- Sesli okuma / telaffuz desteği
- Mobil görünüm iyileştirmesi
- Vercel API / güvenli backend
- Çoklu kullanıcı sistemi
- PDF import paneli
- Admin içerik import aracı
