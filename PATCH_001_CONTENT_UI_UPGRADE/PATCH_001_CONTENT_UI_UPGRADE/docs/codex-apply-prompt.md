# Görev: PATCH_001_CONTENT_UI_UPGRADE paketini uygula

Repo: mustafasacar50/bulgarca

## Amaç
İlk seed içerikleri zayıf kaldı. Bu paketle hem içerik zenginleşecek hem de uygulamaya ders import, marker toggle, zengin sağ panel ve alfabe görünüm modları eklenecek.

## Yapılacaklar

1. `lessons/` içindeki dört lesson JSON dosyasını `public/data/lessons/` içine yerleştir ve mevcut sürümlerin üzerine yaz.
2. `patches/manifest.patch.json` dosyasına göre manifest'i güncelle. Ders kartı açıklamalarında `summary_tr` görünsün.
3. `patches/glossary.patch.json` ve `patches/rules.patch.json` içeriğini mevcut veri yapısına merge et.
4. `patches/app-feature-patch.json` içindeki gereksinimlere göre UI patch uygula:
   - Alfabe görünüm modları: basılı/el yazısı, büyük/küçük toggle
   - Sağ panel: harf/kural detay paneli
   - Kural marker açık/kapalı anahtarı
   - Yerel JSON import ekranı (dosya yükle + metin yapıştır)
   - Dashboard kart açıklamaları ve görünmeyen 4. ders hatasının düzeltilmesi
5. LessonReader bileşenini zengin blok tiplerini destekleyecek şekilde genişlet:
   - alphabet_grid_v2
   - rule_cards_v2
   - plural_rule_cards
   - word_table_v2
   - phrase_cards
   - dialog_cards
   - grammar_panel
6. Sağ panel bileşeninde şu veri alanlarını destekle:
   - panel_examples
   - markers
   - note_tr
   - explanation_tr
7. Import edilen tek JSON veya çoklu patch dosyaları için doğrulama yap.
8. Build al, hataları düzelt.

## Commit mesajı
Apply PATCH_001 content and UI upgrade
