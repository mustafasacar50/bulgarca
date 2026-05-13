# BULGARCA Sync Architecture

Bu dosya ilk MVP’de kullanılacak GitHub tabanlı senkronizasyon modelini ve ilerideki Vercel/backend geçiş yolunu tanımlar.

## İlk MVP kararı

İlk sürüm statik çalışır. Vercel, backend veya serverless API kullanılmaz.

```txt
React/Vite statik uygulama
        ↓
public/data JSON dosyaları
        ↓
Kullanıcının manuel girdiği GitHub token
        ↓
GitHub Contents API
        ↓
bulgarca-user-data reposundaki progress JSON dosyaları
```

## Repo yapısı

Ana repo:

```txt
mustafasacar50/bulgarca
```

İçerik:

```txt
public/data/lessons/
public/data/rules/
public/data/glossary/
public/data/exercises/
public/data/sources/
src/
docs/
```

Kişisel ilerleme reposu:

```txt
mustafasacar50/bulgarca-user-data
```

Öneri: private repo.

İçerik:

```txt
users/mustafa/progress.json
users/mustafa/known-words.json
users/mustafa/difficult-words.json
users/mustafa/review-queue.json
users/mustafa/lesson-state.json
```

## Token davranışı

- Token uygulama arayüzünden manuel girilir.
- Token hiçbir zaman kaynak koda yazılmaz.
- Token hiçbir zaman GitHub repo’ya commitlenmez.
- Token hiçbir zaman JSON veri dosyalarına kaydedilmez.
- Token console.log ile yazdırılmaz.
- Varsayılan saklama: `sessionStorage`
- Opsiyonel: Kullanıcı açıkça seçerse `localStorage`

## Token ekranı

Settings / GitHub Sync ekranında alanlar:

```txt
GitHub Token
Owner: mustafasacar50
Repo: bulgarca-user-data
Branch: main
User path prefix: users/mustafa
```

Butonlar:

```txt
Test connection
GitHub’dan yükle
GitHub’a kaydet
Otomatik senkronu aç/kapat
```

## Fine-grained token önerisi

İlk MVP’de token kullanıcı tarafından girilecek olsa da izinler mümkün olduğunca sınırlı olmalıdır.

Önerilen izin:

```txt
Repository access:
- Only selected repositories
- mustafasacar50/bulgarca-user-data

Permissions:
- Contents: Read and write
- Metadata: Read
```

Ana repo public ise dersleri okumak için token gerekmez.

## Sync dosyaları

### progress.json

Ders ilerleme durumu.

### known-words.json

Bilinen kelimeler.

### difficult-words.json

Zorlanılan kelimeler.

### review-queue.json

Tekrar kuyruğu.

### lesson-state.json

Ders içi UI/okuma durumu.

## GitHub Contents API mantığı

Dosya okumak:

```txt
GET /repos/{owner}/{repo}/contents/{path}?ref={branch}
```

Dosya yazmak:

1. Önce dosya okunur.
2. Mevcut dosyanın `sha` değeri alınır.
3. Yeni içerik base64 encode edilir.
4. PUT isteği yapılır.

```txt
PUT /repos/{owner}/{repo}/contents/{path}
```

Güncellemede `sha` zorunludur. Dosya yoksa `sha` olmadan create yapılabilir.

## githubSync.ts fonksiyonları

`src/engine/githubSync.ts`

```ts
export async function getGithubFile(params): Promise<GithubFileResult>;
export async function putGithubFile(params): Promise<void>;
export async function loadJsonFile<T>(params): Promise<T | null>;
export async function saveJsonFile<T>(params): Promise<void>;
export async function loadProgress(): Promise<ProgressState>;
export async function saveProgress(progress: ProgressState): Promise<void>;
```

## Çakışma/conflict yönetimi

Basit MVP’de şu yaklaşım kullanılacaktır:

1. Uygulama dosyayı yüklerken son `sha` değerini saklar.
2. Kaydederken aynı `sha` ile update dener.
3. GitHub conflict dönerse:
   - Son dosya tekrar çekilir.
   - Basit merge denenir.
   - Merge edilemiyorsa kullanıcıya “GitHub’daki kayıt daha yeni, önce yükleyin” uyarısı gösterilir.

## Otomatik senkron

İlk sürümde manuel kaydet/yükle yeterlidir.

İkinci aşamada:

- Ders tamamlanınca otomatik kaydet
- Alıştırma bitince otomatik kaydet
- 30 saniyede bir debounce kayıt
- Sayfa kapanmadan önce son kayıt

eklenebilir.

## Offline/cache davranışı

localStorage şunlar için kullanılabilir:

- son açılan ders
- son çekilen progress cache
- token saklama tercihi
- geçici çalışma durumu

Ama ana veri GitHub’daki JSON dosyalarıdır.

## İleride Vercel/backend geçişi

İleride güvenli sürümde mimari şöyle olur:

```txt
React uygulaması
        ↓
Vercel API Routes
        ↓
GitHub API
        ↓
user-data repo
```

Bu geçiş için frontend’de GitHub API çağrıları doğrudan bileşenlerden yapılmamalı; `syncClient.ts` gibi bir soyutlama kullanılmalıdır. Böylece ileride sadece syncClient değiştirilir.

## Güvenlik uyarısı

Kullanıcı tokeni sohbet, ekran görüntüsü, GitHub repo, public dosya veya frontend kod içinde paylaşırsa token güvenli kabul edilmez ve iptal edilmelidir.
