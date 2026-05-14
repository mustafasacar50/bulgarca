# PATCH 014 — Küçük Sözlük Tam Metin, Her Kelime/Cümle İşleme ve Derslere Dağıtım

## Amaç

Kullanıcının yüklediği `Yapıştırılan metin.txt` içeriğini sadece sözlük listesi olarak değil, derslere bölünmüş, her kelimesi ve cümlesi hover/sağ panel/kural motoru tarafından işlenebilir bir öğrenme kaynağına dönüştür.

## Eklenen dersler

- `lesson-010-kucuk-sozluk-onsoz-amac`
- `lesson-011-grafik-sistemler-alfabe-koprusu`
- `lesson-012-fonetik-zorluklar-ve-telaffuz`
- `lesson-013-yazim-ve-donusum-kaliplari`
- `lesson-014-gramer-farklari-rod-cogul-fiil`
- `lesson-015-iletisim-diyalogdan-anlatima`
- `lesson-016-kucuk-sozluk-a-z-tam-calisma`

## Veri dosyaları

- `public/data/readings/kucuk-sozluk-source-sentences.full.json`: 1–22. sayfalardaki kaynak metin cümle/tokene ayrıldı. Toplam 298 cümle birimi.
- `public/data/glossary/kucuk-sozluk-cognates.full.v3.json`: 23–91. sayfalardan otomatik çıkarılan 650 sözlük girdisi.
- `public/data/rules/kucuk-sozluk-methodology-rules.json`: kaynak metinden çıkarılan fonetik, grafik ve gramer kuralları.

## Renderer / UI yapılacakları

1. `source_sentence_reader` section tipini destekle.
   - `reading_file_path` dosyasını yükle.
   - Cümleleri sayfaya göre listele.
   - Her cümlede Bulgarca/Türkçe tokenları `LearningText` ile render et.
   - Kelimeye tıklanınca glossary lookup + sağ panel aç.

2. `rule_grouped_word_table` section tipini destekle.
   - Glossary dosyasındaki `rule_refs` alanlarına göre kelimeleri grupla.
   - Aynı kurala uyan kelimeleri sağ panelde listele.
   - Marker motoru gerçek öğretici parçayı işaretlesin.

3. `pronunciation_drill` section tipini destekle.
   - ц, х, sessiz kümesi, л gibi telaffuz gruplarını kart olarak göster.

4. `rule_group_summary` section tipini destekle.
   - Hangi kuralda kaç kelime yakalandığını göster.

5. Tam sözlük modunda arama/filtreleme geliştir.
   - Türkçe arama
   - Bulgarca arama
   - harfe göre filtreleme
   - rule_id’ye göre filtreleme
   - kaynak sayfası gösterimi
   - zor kelimeye ekleme

## Kalıcı kalite kuralı

Yeni kaynak metin geldiğinde:

- düz metin cümle birimlerine ayrılacak,
- tüm kelimeler token düzeyinde işlenebilir olacak,
- sözlükteki her kelime entry_id ve source.page alacak,
- kural taşıyan parçalar markerlanacak,
- her ders en az bir alıştırma setiyle gelecek.

## Test

- `npm run build`
- Ders 010–016 listede görünmeli.
- Ders 010 kaynak cümle okuyucusunu açmalı.
- Ders 013 aynı kurala göre kelimeleri gruplayabilmeli.
- Ders 016 tüm sözlükte arama yapabilmeli.
- AMBAR → Хамбар örneğinde `∅ → Х` kuralı, ASETİLEN → Ацетилен örneğinde `S → Ц` kuralı görünmeli.

## Commit mesajı

Import full small dictionary source text as processed lessons
