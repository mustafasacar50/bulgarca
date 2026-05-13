# BULGARCA Data Schema

Bu dosya, Bulgarca öğrenme uygulamasında kullanılacak JSON veri katmanlarını tanımlar.

## Ana klasör yapısı

```txt
public/data/
  manifest.json
  lessons/
  rules/
  glossary/
  exercises/
  sources/
```

Kişisel ilerleme ayrı repoda tutulur:

```txt
users/mustafa/
  progress.json
  known-words.json
  difficult-words.json
  review-queue.json
  lesson-state.json

---

# 0. Global Display Preferences (UI State)

Kullanıcının görünüm tercihleri `localStorage` ve `lesson-state.json` içinde saklanır.

```json
{
  "scriptMode": "print",
  "letterCaseMode": "sentencecase",
  "languageMode": "bg_hover_tr",
  "markerMode": "soft",
  "showTransliteration": true,
  "showPronunciation": true
}
```

- `scriptMode`: "print" | "handwriting"
- `letterCaseMode`: "uppercase" | "lowercase" | "titlecase_words" | "sentencecase"
- `languageMode`: "bg_hover_tr" | "tr_hover_bg" | "both_bg_first" | "both_tr_first" | "quiz_hide_secondary"
- `markerMode`: "off" | "soft" | "strong"
```

---

# 1. manifest.json

Uygulama açıldığında önce bu dosyayı okur. Hangi derslerin, kural dosyalarının ve sözlük dosyalarının yükleneceğini buradan öğrenir.

```json
{
  "schema_version": "1.0",
  "app": "BULGARCA",
  "last_updated": "2026-05-13",
  "lessons": [
    {
      "lesson_id": "lesson-001",
      "title_tr": "Bulgar Alfabesi",
      "level": "A1",
      "path": "/data/lessons/lesson-001-alfabe.json",
      "exercise_path": "/data/exercises/exercises-001.json",
      "order": 1,
      "status": "active"
    }
  ],
  "rule_files": [
    "/data/rules/alphabet-rules.json",
    "/data/rules/phonetic-rules.json",
    "/data/rules/plural-rules.json",
    "/data/rules/grammar-rules.json"
  ],
  "glossary_files": [
    "/data/glossary/bg-tr-glossary.json",
    "/data/glossary/tr-bg-cognates.json"
  ]
}
```

---

# 2. Lesson JSON

Her ders bağımsız dosyada tutulur.

```json
{
  "schema_version": "1.0",
  "lesson_id": "lesson-001",
  "title_tr": "Bulgar Alfabesi",
  "level": "A1",
  "order": 1,
  "estimated_minutes": 30,
  "tags": ["alfabe", "telaffuz", "kirill"],
  "source_refs": [
    {
      "source_id": "src-a1-v-1-2",
      "pages": [1, 2],
      "note": "Bulgar alfabesi, telaffuz, transliterasyon ve özel sesler"
    }
  ],
  "learning_goals": [
    "Bulgar alfabesindeki 30 harfi tanımak",
    "Basılı ve el yazısı harfleri ayırt etmek",
    "Türkçe bilen biri için zor olabilecek harfleri fark etmek"
  ],
  "sections": [
    {
      "section_id": "lesson-001-sec-001",
      "type": "explanation",
      "title_tr": "Bulgar alfabesine giriş",
      "body_tr": "Bulgarca Kiril alfabesiyle yazılır. Bazı harfler Latin harflerine benzer görünür ama farklı ses verebilir.",
      "content_blocks": [
        {
          "block_id": "lesson-001-block-001",
          "type": "paragraph",
          "text_bg": "Българска азбука",
          "text_tr": "Bulgar alfabesi",
          "annotations": [
            {
              "target": "Българска",
              "entry_id": "word-bg-bulgarska",
              "tooltip_tr": "Bulgarca / Bulgar'a ait",
              "panel_ref": "panel-word-bg-bulgarska"
            }
          ]
        }
      ]
    }
  ],
  "linked_rules": ["alphabet-ya", "alphabet-yu", "alphabet-sht"],
  "linked_entries": ["word-bg-azbuka", "word-bg-bulgarska"]
}
```

## section.type değerleri

- `explanation`
- `alphabet_table`
- `dialogue`
- `grammar`
- `word_table`
- `exercise_intro`
- `review`

## content_blocks.type değerleri

- `paragraph`
- `word_pair`
- `rule_example`
- `dialogue_line`
- `alphabet_card`
- `table`
- `note`

---

# 3. Rule JSON

Kurallar ayrı dosyalarda tutulur. Kural motoru kelime içindeki marker alanlarını bu dosyalara göre işler.

```json
{
  "schema_version": "1.0",
  "rules": [
    {
      "rule_id": "tr-sh-to-bg-sh",
      "category": "phonetic_mapping",
      "title_tr": "Türkçedeki Ş sesi Bulgarcada Ш olur",
      "short_tr": "Ş → Ш dönüşümü",
      "description_tr": "Türkçedeki ş sesi Bulgarcada ш harfiyle yazılır. Örnek: MARŞ → марш.",
      "pattern": {
        "source_lang": "tr",
        "target_lang": "bg",
        "source_fragment": "Ş",
        "target_fragment": "Ш",
        "match_type": "fragment"
      },
      "marker": {
        "color_key": "blue",
        "highlight_source": "Ş",
        "highlight_target": "ш"
      },
      "examples": [
        {
          "tr": "MARŞ",
          "bg": "марш",
          "source": {
            "source_id": "src-zup-tan-k-bg-ders",
            "page": 1
          }
        }
      ],
      "tooltip_tr": "Türkçedeki Ş sesi Bulgarcada Ш ile yazılır.",
      "panel_tr": {
        "summary": "Bu kural Türkçe-Bulgarca ortak kelimelerde sık görülür.",
        "details": [
          "Bulgarca ş sesi için ш harfini kullanır.",
          "Bu harf Latin alfabesindeki sh gibi düşünülebilir.",
          "Örnek: душ, афиш, марш, гише."
        ]
      }
    }
  ]
}
```

---

# 4. Glossary JSON

Kelimeler tekil entry yapısında tutulur.

```json
{
  "schema_version": "1.0",
  "entries": [
    {
      "entry_id": "word-bg-anarhiya",
      "bg": "анархия",
      "tr": "anarşi",
      "type": "noun",
      "gender": "feminine",
      "plural": "анархии",
      "count_form": null,
      "pronunciation_hint_tr": "a-nar-hi-ya",
      "transliteration": "anarhiya",
      "tags": ["ortak_kelime", "iya_plural"],
      "rule_refs": ["plural-ia-to-ii"],
      "source": {
        "source_id": "src-kucuk-sozluk",
        "page": 27
      },
      "tooltip_tr": "анархия = anarşi",
      "panel_tr": {
        "meaning": "Türkçedeki anarşi kelimesiyle bağlantılıdır.",
        "grammar_note": "Женски род; -ия ile bittiği için çoğulda -ии olur.",
        "examples": [
          {
            "bg": "Това е анархия.",
            "tr": "Bu anarşidir."
          }
        ]
      }
    }
  ]
}
```

## gender değerleri

- `masculine`
- `feminine`
- `neuter`
- `plural_only`
- `unknown`
- `not_applicable`

---

# 5. Exercises JSON

Alıştırmalar derslerden bağımsız ama derslere bağlıdır.

```json
{
  "schema_version": "1.0",
  "lesson_id": "lesson-001",
  "exercise_set_id": "exercises-001",
  "title_tr": "Bulgar Alfabesi Alıştırmaları",
  "items": [
    {
      "exercise_id": "ex-001-001",
      "type": "multiple_choice",
      "prompt_tr": "Türkçedeki Ş sesi Bulgarcada hangi harfle yazılır?",
      "choices": ["Ж", "Ш", "Ч", "Ц"],
      "answer": "Ш",
      "explanation_tr": "Ş sesi Bulgarcada Ш harfiyle yazılır.",
      "rule_refs": ["tr-sh-to-bg-sh"],
      "entry_refs": [],
      "source": {
        "source_id": "src-zup-tan-k-bg-ders",
        "page": 1
      }
    }
  ]
}
```

## exercise.type değerleri

- `multiple_choice`
- `fill_blank`
- `match_pairs`
- `write_bg`
- `choose_rule`
- `true_false`
- `dialogue_order`
- `self_introduction`

---

# 6. Source Index

Kaynak dosyalar merkezi olarak kaydedilir.

```json
{
  "schema_version": "1.0",
  "sources": [
    {
      "source_id": "src-a1-v-1-2",
      "file_name": "A1-V-1-2.pdf",
      "type": "pdf",
      "description_tr": "A1 düzeyi Bulgarca kurs dökümanı",
      "page_count": 28,
      "uploaded_context": "İlk proje kurulumu",
      "used_in": ["lesson-001", "lesson-004", "lesson-005"]
    }
  ]
}
```

---

# 7. progress.json

Kişisel ilerleme user-data reposunda saklanır.

```json
{
  "schema_version": "1.0",
  "user_id": "mustafa",
  "updated_at": "2026-05-13T00:00:00Z",
  "lesson_progress": {
    "lesson-001": {
      "status": "in_progress",
      "completion_percent": 40,
      "last_section_id": "lesson-001-sec-002",
      "completed_sections": ["lesson-001-sec-001"],
      "exercise_scores": {
        "exercises-001": {
          "correct": 7,
          "total": 10,
          "last_attempt_at": "2026-05-13T00:00:00Z"
        }
      }
    }
  }
}
```

---

# 8. difficult-words.json

```json
{
  "schema_version": "1.0",
  "user_id": "mustafa",
  "updated_at": "2026-05-13T00:00:00Z",
  "items": [
    {
      "entry_id": "word-bg-anarhiya",
      "bg": "анархия",
      "tr": "anarşi",
      "difficulty_score": 3,
      "mistake_count": 2,
      "last_seen_at": "2026-05-13T00:00:00Z",
      "source_lesson_id": "lesson-002"
    }
  ]
}
```

---

# 9. Patch dosyası ilkeleri

Patch dosyaları doğrudan import edilebilir olmalıdır.

```json
{
  "patch_type": "glossary_patch",
  "schema_version": "1.0",
  "created_at": "2026-05-13",
  "operations": [
    {
      "op": "add_entry",
      "entry": {
        "entry_id": "word-bg-anarhiya",
        "bg": "анархия",
        "tr": "anarşi"
      }
    }
  ]
}
```

Desteklenen operasyonlar:

- `add_entry`
- `update_entry`
- `extend_entry`
- `add_rule`
- `extend_rule`
- `add_lesson`
- `add_exercises`
- `add_source_ref`
