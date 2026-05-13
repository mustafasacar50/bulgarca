# BULGARCA Content Workflow

Bu dosya, yeni PDF/görsel ders geldiğinde içeriklerin nasıl işleneceğini ve uygulamaya nasıl import edileceğini tanımlar.

## Ana akış

```txt
PDF/görsel yüklenir
→ kaynak incelenir
→ ders birimlerine ayrılır
→ önceki kurallarla ilişkilendirilir
→ yeni kelimeler çıkarılır
→ yeni/var olan kurallar belirlenir
→ alıştırmalar üretilir
→ import paketi hazırlanır
→ Codex/Antigravity promptu ile repo’ya uygulanır
```

## Her yeni PDF için üretilecek dosyalar

```txt
IMPORT_PACKAGE_XXX/
  lesson-XXX.json
  glossary.patch.json
  rules.patch.json
  exercises-XXX.json
  source-index.patch.json
  changelog.md
  codex-apply-prompt.md
```

Gerekirse ek dosyalar:

```txt
assets.patch.json
manifest.patch.json
migration-notes.md
test-checklist.md
```

## Ders çıkarma ilkeleri

1. PDF birebir kopyalanmaz; öğrenilebilir ders yapısına dönüştürülür.
2. Her dersin açık öğrenme hedefleri olur.
3. Kelimeler, kurallar ve alıştırmalar ayrılır.
4. Kaynak sayfa bilgisi korunur.
5. Önceki kurallarla bağlantı kurulur.
6. Yeni kural varsa `rules.patch.json` içine eklenir.
7. Zaten var olan kural tekrar geçiyorsa kural genişletilir.
8. Türkçe açıklama sade ve pratik olur.
9. Bulgarca metinler Kiril alfabesiyle korunur.
10. Türkçe-Bulgarca ortak kelimeler özellikle vurgulanır.

## Patch stratejisi

### Yeni kural

```json
{
  "op": "add_rule",
  "rule": {
    "rule_id": "tr-sh-to-bg-sh"
  }
}
```

### Var olan kuralı genişletme

```json
{
  "op": "extend_rule",
  "rule_id": "tr-sh-to-bg-sh",
  "add_examples": [
    {
      "tr": "MARŞ",
      "bg": "марш"
    }
  ]
}
```

### Yeni kelime

```json
{
  "op": "add_entry",
  "entry": {
    "entry_id": "word-bg-marsh",
    "bg": "марш",
    "tr": "marş"
  }
}
```

### Var olan kelimeyi geliştirme

```json
{
  "op": "extend_entry",
  "entry_id": "word-bg-marsh",
  "add_rule_refs": ["tr-sh-to-bg-sh"]
}
```

## Kaynak indeksi

Her kaynak `source-index.patch.json` ile kaydedilir.

```json
{
  "op": "add_source",
  "source": {
    "source_id": "src-a1-v-1-2",
    "file_name": "A1-V-1-2.pdf",
    "type": "pdf",
    "page_count": 28,
    "description_tr": "A1 düzeyi Bulgarca kurs dokümanı"
  }
}
```

## Ders türleri

Başlangıçta şu ders türleri desteklenir:

- Alfabe
- Ses/harf dönüşümü
- Ortak kelimeler
- Tanışma ve selamlaşma
- Zamirler
- Fiil çekimi
- Soru kalıpları
- Diyalog
- Yazma alıştırması
- Tekrar dersi

## Alıştırma üretimi

Her ders için en az 5, mümkünse 10-20 alıştırma üretilir.

Alıştırma tipleri:

- Çoktan seçmeli
- Boşluk doldurma
- Eşleştirme
- Bulgarca yazma
- Kural seçme
- Doğru/yanlış
- Diyalog sıralama
- Kendini tanıtma

## Changelog standardı

`changelog.md` içinde şunlar olmalıdır:

```md
# Changelog

## Import Package XXX

### Eklenen dersler
- lesson-XXX

### Eklenen kelimeler
- ...

### Eklenen kurallar
- ...

### Genişletilen kurallar
- ...

### Alıştırmalar
- ...

### Kaynaklar
- ...
```

## Codex apply prompt standardı

Her import paketi içinde `codex-apply-prompt.md` bulunmalıdır. Bu prompt kod asistanına hangi dosyaları nereye koyacağını ve manifest dosyasını nasıl güncelleyeceğini söyler.

## İçerik kalite kontrol

Her import paketinde şu kontrol yapılır:

- JSON geçerli mi?
- `lesson_id`, `rule_id`, `entry_id` benzersiz mi?
- Kaynak bilgileri var mı?
- Yeni kelimeler glossary’ye eklendi mi?
- Kural referansları gerçekten rules dosyasında var mı?
- Alıştırma cevapları doğru mu?
- Manifest güncellemesi gerekiyor mu?
- Ders uygulamada kod değişmeden görünebilir mi?

## Proje büyüdükçe

Kaynak dosyalar zamanla güncellenmelidir:

- Yeni JSON alanı gerekirse `DATA_SCHEMA.md` güncellenir.
- Yeni marker/kural türü gerekirse `RULE_ENGINE_SPEC.md` güncellenir.
- Yeni senkron modeli gerekirse `SYNC_ARCHITECTURE.md` güncellenir.
- Yeni import standardı gerekirse `IMPORT_PACKAGE_TEMPLATE.md` güncellenir.
