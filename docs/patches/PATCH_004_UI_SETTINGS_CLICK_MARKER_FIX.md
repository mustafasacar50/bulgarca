# BULGARCA Patch 004 — Global ayar paneli, tıklama davranışı ve marker sistemi düzeltmesi

Ana repo: `mustafasacar50/bulgarca`

## Amaç

Mevcut uygulamada görünüm ayarları çok sıkışık ve bazı ayarlar tüm kelimelere/örneklere uygulanmıyor. Bazı kelimelere veya örneklere tıklanınca sağ panel açılıyor; sonra başka öğeye tıklanınca panel güncellenmeyebiliyor. Marker vurguları da her yerde tutarlı çalışmıyor.

Bu patch ile görünüm ayarları merkezi, sade ve her ders/kelime/panel için geçerli hale getirilecek.

## Kalıcı proje kuralları

1. Görünüm ayarları tüm uygulamada tek merkezden yönetilecek.
2. Ana panel, sağ panel, tablo, örnek, kart, quiz ve hover bileşenleri aynı ayarları kullanacak.
3. Varsayılan dil modu: Bulgarca görünür, Türkçe hover.
4. Türkçe görünür, Bulgarca hover modu da desteklenecek.
5. İki dili aynı anda gösterme opsiyonel olacak; varsayılan olmayacak.
6. Marker modu kapalı / sade / güçlü olarak yönetilecek.
7. Kullanıcı bir öğeye tıkladığında sağ panel her seferinde yeni seçilen öğeye güncellenecek.
8. Her Bulgarca metin/kelime/örnek/cümle hover ile Türkçe anlam veya kısa açıklama göstermeli.
9. Her Türkçe görünen öğrenme öğesi de ters modda hover ile Bulgarca karşılık göstermeli.
10. Sağ paneldeki metinler de ana paneldeki yazı tipi/stil/büyük-küçük harf ayarlarıyla senkron olmalı.

---

## 1. Ayar butonlarını sadeleştir

Şu an ayarlar ders başlığının altında sıkışık ve iç içe görünüyor. Bunu kaldır.

### Yeni davranış

Ders başlığının sağında tek bir dişli butonu olsun:

- `Görünüm`
- veya sadece ikon: `⚙`

Butona basınca küçük, düzenli bir panel/popover açılsın.

### Popover içeriği

Bölümler halinde göster:

#### Yazı tipi
- Basılı
- El yazısı

#### Harf düzeni
- Normal
- BÜYÜK HARF
- küçük harf
- Kelime İlk Harf Büyük
- Cümle İlk Harf Büyük

#### Dil gösterimi
- Bulgarca göster, Türkçe hover
- Türkçe göster, Bulgarca hover
- Bulgarca + Türkçe
- Sadece quiz/gizli mod

#### Marker
- Kapalı
- Sade
- Güçlü

---

## 2. DisplaySettingsProvider oluştur

`src/state/DisplaySettingsContext.tsx` veya benzer bir dosya oluştur.

Aşağıdaki tipleri kullan:

```ts
export type ScriptMode = "print" | "handwriting";
export type LetterCaseMode =
  | "normal"
  | "uppercase"
  | "lowercase"
  | "titlecase"
  | "sentencecase";
export type LanguageMode =
  | "bg_hover_tr"
  | "tr_hover_bg"
  | "bg_tr"
  | "quiz_hidden";
export type MarkerMode = "off" | "subtle" | "strong";

export interface DisplaySettings {
  scriptMode: ScriptMode;
  letterCaseMode: LetterCaseMode;
  languageMode: LanguageMode;
  markerMode: MarkerMode;
}
```

Varsayılan:

```ts
{
  scriptMode: "print",
  letterCaseMode: "normal",
  languageMode: "bg_hover_tr",
  markerMode: "strong"
}
```

Ayarlar localStorage’a kaydedilsin:

`bulgarca.displaySettings.v1`

Bu context bütün uygulamayı sarmalı.

---

## 3. Format yardımcıları oluştur

`src/engine/displayFormatter.ts` oluştur.

Fonksiyonlar:

```ts
formatBulgarianText(text: string, settings: DisplaySettings, context?: "word" | "sentence" | "letter"): string
formatTurkishText(text: string, settings: DisplaySettings): string
getPrimaryText(item, settings): string
getHoverText(item, settings): string
```

---

## 4. Bulgarca el yazısı her yerde

Ana panelde el yazısı seçildiyse:

- harf kartları
- kelime örnekleri
- çoğul örnekleri
- sağ panel
- tablo satırları
- quiz seçenekleri

aynı sınıfı almalı.

---

## 5. Global öğrenme metni bileşeni oluştur

`src/components/LearningText.tsx` oluştur.

Props:

```ts
interface LearningTextProps {
  bg?: string;
  tr?: string;
  tooltip_tr?: string;
  tooltip_bg?: string;
  detail?: any;
  type?: "letter" | "word" | "rule" | "phrase" | "sentence" | "example";
  ruleIds?: string[];
  onSelect?: (detail: any) => void;
  className?: string;
}
```

---

## 6. Sağ panel güncellenmeme bug’ını düzelt

Her tıklamada `selectedItem` güncellenmeli ve panel `key` ile re-render olmalı.

---

## 7. Marker sistemi tutarlı hale getir

Marker sadece ders kartlarında değil, her yerde çalışmalı.

---

## 8. Ayarlar bütün kelimelere uygulanmalı

Hiçbir yerde hard-coded `bg + tr` birlikte gösterilmemeli. Dil gösterimi `languageMode` üzerinden yönetilmeli.

---

## 9. Sağ panelde dil modu uygulanmalı

Kullanıcı hangi moddaysa sağ panel başlığı da o modu takip etmeli.

---

## 10. Ders 2 boş görünme sorununu ayrıca kontrol et

Bilinmeyen section type gelirse debug kutusu göstersin:

`Bu section türü henüz desteklenmiyor: transformation_rules`

---

## 12. Test listesi

1. Ayarlar tek dişli butonundan açılıyor mu?
2. El yazısı seçilince her yer aynı stile geçiyor mu?
3. Büyük/Küçük harf modları tüm metne uygulanıyor mu?
4. Sağ panel tıklayınca her seferinde güncelleniyor mu?
5. `npm run build` hatasız mı?
