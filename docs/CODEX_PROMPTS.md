# BULGARCA Codex / Antigravity Prompts

Bu dosya, kod asistanına verilecek ana görev promptlarını saklar.

---

# PROMPT 001 — Statik MVP İskeleti

```md
# Görev: BULGARCA statik GitHub senkronlu MVP oluştur

Repo: https://github.com/mustafasacar50/bulgarca

React + Vite + TypeScript + Tailwind tabanlı kişisel Bulgarca öğrenme uygulaması oluştur.

## Önemli karar

Bu MVP’de Vercel, backend ve serverless API kullanılmayacak. Uygulama tamamen statik çalışacak. Kullanıcı GitHub tokenini uygulama arayüzünden manuel girecek. Token hiçbir dosyaya yazılmayacak ve repoya commitlenmeyecek.

## Veri yapısı

Ana ders verileri public/data altında olacak:

public/data/lessons/
public/data/rules/
public/data/glossary/
public/data/exercises/
public/data/sources/

Kişisel ilerleme GitHub API ile ayrı private repo’ya yazılacak:

owner: mustafasacar50
repo: bulgarca-user-data
branch: main

path:
users/mustafa/progress.json
users/mustafa/difficult-words.json
users/mustafa/known-words.json
users/mustafa/review-queue.json
users/mustafa/lesson-state.json

## GitHub token davranışı

- Uygulama Settings / Sync ekranında token ister.
- Varsayılan olarak token sadece sessionStorage içinde tutulur.
- Kullanıcı isterse “Bu cihazda hatırla” seçeneğiyle localStorage’a kaydedilebilir.
- Token frontend koduna hard-code edilmeyecek.
- Token public/data içine yazılmayacak.
- Token console.log ile yazdırılmayacak.

## İlk ekranlar

1. Dashboard
2. Lessons
3. LessonReader
4. Practice
5. Review
6. Settings / GitHub Sync

## GitHub Sync fonksiyonları

src/engine/githubSync.ts içinde şu fonksiyonları yaz:

- getGithubFile({ token, owner, repo, path, branch })
- putGithubFile({ token, owner, repo, path, branch, content, sha, message })
- loadJsonFile()
- saveJsonFile()
- loadProgress()
- saveProgress()
- loadDifficultWords()
- saveDifficultWords()

GitHub Contents API kullan. Dosya güncellerken önce mevcut dosyanın sha değeri alınmalı, sonra PUT isteğiyle güncellenmeli.

## İlk UI davranışı

- Ders JSON’larını public/data/manifest.json üzerinden listele.
- Ders seçilince lesson JSON yüklensin.
- Kelimelerde rule markers varsa renkli gösterilsin.
- Hover kısa açıklama göstersin.
- Tıklanınca sağ panelde ayrıntılı açıklama açılsın.
- Ders tamamlandı bilgisi progress.json içine yazılabilsin.

## Klasör yapısı

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

## İlk demo veri

Basit bir lesson-001-demo.json oluştur.
Basit bir manifest.json oluştur.
Basit bir phonetic-rules.json oluştur.

## Kontrol

npm install
npm run build

Build hatasız tamamlanmalı.
```

---

# PROMPT 002 — Import paketi uygula

```md
# Görev: BULGARCA import paketini uygula

Bu görevde verilen IMPORT_PACKAGE klasöründeki JSON ve patch dosyalarını BULGARCA uygulamasına ekle.

## Yapılacaklar

1. lesson-XXX.json dosyasını public/data/lessons/ içine kopyala.
2. exercises-XXX.json dosyasını public/data/exercises/ içine kopyala.
3. glossary.patch.json içindeki operasyonları public/data/glossary/bg-tr-glossary.json dosyasına uygula.
4. rules.patch.json içindeki operasyonları ilgili rules dosyalarına uygula.
5. source-index.patch.json dosyasını public/data/sources/source-index.json dosyasına uygula.
6. public/data/manifest.json içine yeni ders kaydını ekle.
7. npm run build çalıştır.
8. Dersin uygulamada listelendiğini kontrol et.

## Kurallar

- Var olan entry_id varsa yeni kayıt oluşturma, extend_entry uygula.
- Var olan rule_id varsa yeni rule oluşturma, extend_rule uygula.
- JSON formatını bozma.
- Token veya secret dosyaya yazma.
```

---

# PROMPT 003 — GitHub Sync iyileştirmesi

```md
# Görev: BULGARCA GitHub Sync ekranını iyileştir

Settings / GitHub Sync ekranına şu özellikleri ekle:

- Token connection test
- Son senkron zamanı
- GitHub’dan yükle
- GitHub’a kaydet
- Otomatik senkron aç/kapat
- Conflict durumunda kullanıcı uyarısı
- Tokeni sessionStorage veya localStorage’da saklama tercihi

Token hiçbir şekilde console.log edilmemeli.
```

---

# PROMPT 004 — Patch 003 UI Standartları

```md
# Görev: BULGARCA Patch 003 UI Standartlarını Uygula

Uygulamayı yeni global görünüm, dil modu ve hover sistemine geçir.

## Kalıcı Kurallar

1. **Global Store**: `scriptMode`, `letterCaseMode`, `languageMode`, `markerMode` state'lerini yönet.
2. **Text Formatting**: `formatBulgarianText` fonksiyonu ile tüm Bulgarca metinleri (ders, panel, örnek) merkezi olarak biçimlendir.
3. **LangHover**: Tüm Bulgarca/Türkçe içerikleri `LangHover` bileşeni ile sarmala. Hover'da karşılık dil gösterilmeli.
4. **Right Panel Sync**: Sağ panel, ana paneldeki görünüm ayarlarıyla (el yazısı, harf büyüklüğü vb.) tam senkron çalışmalı.
5. **Marker System**: `off`, `soft`, `strong` modlarını destekle. Kural markerları bu modlara göre render edilmeli.
6. **Import Bundle**: `bulgarca_import_bundle` formatını destekleyen gelişmiş içe aktar ekranı oluştur.
7. **Boş Ders Koruması**: `LessonReader` bilinmeyen section'ları atlamamalı, debug bilgisi göstermeli.

Tüm derslerin (001-004) bu kurallara uyduğundan emin ol.
```
