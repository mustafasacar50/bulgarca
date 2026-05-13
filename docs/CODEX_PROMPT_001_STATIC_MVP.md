# Görev: BULGARCA statik GitHub senkronlu MVP oluştur

Repo: https://github.com/mustafasacar50/bulgarca

React + Vite + TypeScript + Tailwind tabanlı kişisel Bulgarca öğrenme uygulaması oluştur.

## Önemli karar

Bu MVP’de Vercel, backend ve serverless API kullanılmayacak. Uygulama tamamen statik çalışacak. Kullanıcı GitHub tokenini uygulama arayüzünden manuel girecek. Token hiçbir dosyaya yazılmayacak ve repoya commitlenmeyecek.

## Ana hedef

Uygulama Bulgarca ders JSON dosyalarını okuyacak, dersleri listeleyecek, seçilen dersi gösterecek, kelime/kural marker sistemini destekleyecek ve kullanıcı ilerlemesini GitHub API ile ayrı `bulgarca-user-data` reposuna senkron edebilecek.

## Repo bilgileri

Ana repo:

```txt
owner: mustafasacar50
repo: bulgarca
branch: main
```

User-data repo:

```txt
owner: mustafasacar50
repo: bulgarca-user-data
branch: main
```

User data paths:

```txt
users/mustafa/progress.json
users/mustafa/difficult-words.json
users/mustafa/known-words.json
users/mustafa/review-queue.json
users/mustafa/lesson-state.json
```

## Zorunlu klasör yapısı

Aşağıdaki klasörleri oluştur:

```txt
docs/
src/components/
src/engine/
src/pages/
src/types/
public/data/lessons/
public/data/rules/
public/data/glossary/
public/data/exercises/
public/data/sources/
```

## İlk veri dosyaları

Aşağıdaki demo JSON dosyalarını oluştur:

```txt
public/data/manifest.json
public/data/lessons/lesson-001-demo.json
public/data/rules/phonetic-rules.json
public/data/rules/plural-rules.json
public/data/glossary/bg-tr-glossary.json
public/data/exercises/exercises-001-demo.json
public/data/sources/source-index.json
```

## İlk ekranlar

1. Dashboard
2. Lessons
3. LessonReader
4. Practice
5. Review
6. Settings / GitHub Sync

## Zorunlu bileşenler

```txt
src/components/LessonList.tsx
src/components/LessonReader.tsx
src/components/HighlightedText.tsx
src/components/RuleTooltip.tsx
src/components/RightInfoPanel.tsx
src/components/ExerciseCard.tsx
src/components/GitHubSyncPanel.tsx
```

## Engine dosyaları

```txt
src/engine/ruleMatcher.ts
src/engine/glossaryMatcher.ts
src/engine/exerciseGenerator.ts
src/engine/progressEngine.ts
src/engine/githubSync.ts
src/engine/storage.ts
```

## Type dosyaları

```txt
src/types/lesson.ts
src/types/rule.ts
src/types/glossary.ts
src/types/exercise.ts
src/types/progress.ts
src/types/sync.ts
```

## GitHub token davranışı

- Uygulama Settings / GitHub Sync ekranında token ister.
- Varsayılan olarak token sadece sessionStorage içinde tutulur.
- Kullanıcı isterse “Bu cihazda hatırla” seçeneğiyle localStorage’a kaydedilebilir.
- Token frontend koduna hard-code edilmeyecek.
- Token public/data içine yazılmayacak.
- Token console.log ile yazdırılmayacak.
- Token hata mesajında gösterilmeyecek.

## GitHub Sync fonksiyonları

`src/engine/githubSync.ts` içinde şu fonksiyonları yaz:

```ts
getGithubFile({ token, owner, repo, path, branch })
putGithubFile({ token, owner, repo, path, branch, content, sha, message })
loadJsonFile<T>(...)
saveJsonFile<T>(...)
loadProgress(...)
saveProgress(...)
loadDifficultWords(...)
saveDifficultWords(...)
```

GitHub Contents API kullan. Dosya güncellerken önce mevcut dosyanın sha değeri alınmalı, sonra PUT isteğiyle güncellenmeli.

## UI davranışı

- Ders JSON’larını `public/data/manifest.json` üzerinden listele.
- Ders seçilince lesson JSON yüklensin.
- Kelimelerde annotation varsa renkli gösterilsin.
- Hover kısa açıklama göstersin.
- Tıklanınca sağ panelde ayrıntılı açıklama açılsın.
- Ders tamamlandı bilgisi progress state’e yazılabilsin.
- Settings ekranından GitHub’a kaydet / GitHub’dan yükle yapılabilsin.

## Basit demo içerik

Demo derste şu örnek olsun:

```txt
Türkçe: MARŞ
Bulgarca: марш
Kural: Ş → Ш
Tooltip: Türkçedeki Ş sesi Bulgarcada Ш ile yazılır.
```

Ayrıca şu örnek çoğul kuralı yer alsın:

```txt
анархия → анархии
Kural: -ия ile biten bazı kelimeler çoğulda -ии olur.
```

## Stil

- Tailwind kullan.
- Mobil uyumlu olsun.
- Sağ panel desktopta sağda, mobilde alttan açılan panel olabilir.
- Öğrenme uygulaması gibi sade, ferah ve okunabilir tasarım kullan.

## Build kontrolü

Aşağıdaki komutlar çalışmalı:

```bash
npm install
npm run build
```

Build hatasız tamamlanmalı.

## Commit mesajı

```txt
Initial BULGARCA static MVP skeleton
```
