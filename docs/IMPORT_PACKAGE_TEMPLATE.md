# BULGARCA Import Package Template

Her yeni PDF/görsel ders işlendiğinde aşağıdaki paket yapısı üretilecektir.

## Klasör adı

```txt
IMPORT_PACKAGE_XXX_SHORT_TITLE/
```

Örnek:

```txt
IMPORT_PACKAGE_001_INITIAL_ALPHABET/
IMPORT_PACKAGE_006_VERB_PRESENT_TENSE/
```

## Zorunlu dosyalar

```txt
lesson-XXX.json
glossary.patch.json
rules.patch.json
exercises-XXX.json
source-index.patch.json
changelog.md
codex-apply-prompt.md
```

## Opsiyonel dosyalar

```txt
manifest.patch.json
assets.patch.json
migration-notes.md
test-checklist.md
```

---

# 1. lesson-XXX.json

Dersin ana içeriğidir.

```json
{
  "schema_version": "1.0",
  "lesson_id": "lesson-XXX",
  "title_tr": "",
  "level": "A1",
  "order": 0,
  "estimated_minutes": 20,
  "tags": [],
  "source_refs": [],
  "learning_goals": [],
  "sections": [],
  "linked_rules": [],
  "linked_entries": []
}
```

---

# 2. glossary.patch.json

Yeni kelimeler ve mevcut kelimelere eklenecek bilgiler.

```json
{
  "patch_type": "glossary_patch",
  "schema_version": "1.0",
  "created_at": "",
  "operations": [
    {
      "op": "add_entry",
      "entry": {}
    }
  ]
}
```

---

# 3. rules.patch.json

Yeni kurallar veya mevcut kuralların genişletilmesi.

```json
{
  "patch_type": "rules_patch",
  "schema_version": "1.0",
  "created_at": "",
  "operations": [
    {
      "op": "add_rule",
      "rule": {}
    },
    {
      "op": "extend_rule",
      "rule_id": "",
      "add_examples": []
    }
  ]
}
```

---

# 4. exercises-XXX.json

Derse bağlı alıştırmalar.

```json
{
  "schema_version": "1.0",
  "lesson_id": "lesson-XXX",
  "exercise_set_id": "exercises-XXX",
  "title_tr": "",
  "items": []
}
```

---

# 5. source-index.patch.json

Kaynak PDF/görsel kayıtları.

```json
{
  "patch_type": "source_index_patch",
  "schema_version": "1.0",
  "created_at": "",
  "operations": [
    {
      "op": "add_source",
      "source": {}
    }
  ]
}
```

---

# 6. changelog.md

```md
# Changelog

## Import Package XXX

### Eklenen dersler

### Eklenen kelimeler

### Eklenen kurallar

### Genişletilen kurallar

### Alıştırmalar

### Kaynaklar

### Notlar
```

---

# 7. codex-apply-prompt.md

Kod asistanına verilecek uygulanabilir prompt.

```md
# Görev: BULGARCA Import Package XXX dosyalarını uygula

Aşağıdaki dosyaları repo içindeki ilgili konumlara ekle/güncelle.

## Kopyalanacak dosyalar

- lesson-XXX.json → public/data/lessons/
- exercises-XXX.json → public/data/exercises/

## Patch uygulanacak dosyalar

- glossary.patch.json → public/data/glossary/bg-tr-glossary.json
- rules.patch.json → public/data/rules/...
- source-index.patch.json → public/data/sources/source-index.json

## Manifest güncelle

public/data/manifest.json içine yeni lesson kaydını ekle.

## Kontrol

- npm run build çalışmalı
- JSON dosyaları parse edilebilir olmalı
- Ders uygulamada listelenmeli
```

---

# Kalite kontrol listesi

Her paket teslim edilmeden önce:

- [ ] JSON geçerli
- [ ] lesson_id benzersiz
- [ ] rule_id benzersiz
- [ ] entry_id benzersiz
- [ ] kaynak sayfa bilgisi var
- [ ] alıştırma cevapları kontrol edildi
- [ ] patch operasyonları açık
- [ ] manifest güncellemesi belirtildi
- [ ] Codex prompt uygulanabilir
