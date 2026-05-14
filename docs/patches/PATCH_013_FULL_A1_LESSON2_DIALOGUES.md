# PATCH 013 — Full A1 Lesson 2 Dialogue Renderer and Practice

## Amaç

A1-V-1-2 PDF içindeki `Урок № 2. Как се казвате?` diyaloglarını sadece kısa kart değil, tam bir diyalog dersi olarak işler.

## Yapılacaklar

1. `lesson-009-a1-diyalog-kak-se-kazvate.json` dosyasını render et.
2. `dialogue_scenes` section tipini destekle:
   - sahne başlığı
   - speaker
   - bg/tr satır
   - her satırda `LearningText` / `LangHover`
   - tıklanınca sağ panel
3. `dialogue_practice` section tipini destekle.
4. `exercises-009-a1-dialogue-kak-se-kazvate.json` içindeki şu tipleri destekle veya mevcut renderer ile bağla:
   - dialogue_order
   - self_introduction
   - match_pairs
   - write_bg
   - choose_rule
5. Sağ panelde diyalog satırı için şu bilgiler gösterilsin:
   - Bulgarca cümle
   - Türkçe anlam
   - bağlı kurallar
   - kaynak sayfa
   - aynı kalıbın diğer örnekleri
6. `a1-dialogue-phrases.json` global hover fallback kaynaklarından biri olarak yüklensin.
7. `grammar-rules-a1-dialogue.json` rule matcher tarafından yüklensin.
8. Manifestte lesson-009 order 9 olarak görünsün.

## Kalıcı kural

Bir PDF içinde uzun diyalog varsa tek kartla geçiştirilmeyecek. Diyaloglar sahnelere ayrılacak, her satır hover/panel destekli olacak ve mutlaka `dialogue_order` + `self_introduction` alıştırmaları üretilecek.

## Test

- Ders 009 listede görünmeli.
- Kaynak diyalogdaki üç sahne ayrı ayrı görünmeli.
- `Казвам се...`, `Как се казвате?`, `Бихте ли повторили?` tıklanınca doğru panel açılmalı.
- Quiz bölümünde dialogue_order ve self_introduction çalışmalı.
- `npm run build` hatasız çalışmalı.

## Commit mesajı

Import full A1 lesson 2 dialogue practice
