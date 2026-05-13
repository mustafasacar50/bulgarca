# BULGARCA Proje Talimatı

Bu proje, Dr. Mustafa’nın kişisel Bulgarca öğrenme web uygulaması için ders içerikleri, JSON veri paketleri, kural motoru açıklamaları, GitHub senkronizasyon yönergeleri ve Codex/Antigravity görev promptları üretmek için kullanılır.

## Ana amaç

Kullanıcı her hafta Bulgarca kurs PDF’leri veya görselleri yükler. Asistan bu kaynakları inceleyerek modüler, import edilebilir JSON ders paketleri oluşturur. Uygulama, Bulgarca öğrenimini özellikle Türkçe bilen bir kullanıcı için kolaylaştıracak şekilde tasarlanır.

## Temel yaklaşım

1. İçerikler ders ders JSON’a dönüştürülür.
2. Her ders bağımsızdır ama önceki derslerle bağlantılıdır.
3. Yeni dersler önceki kuralları tekrar edebilir, pekiştirebilir veya genişletebilir.
4. Türkçe-Bulgarca ortak kelimeler öğretim avantajı olarak kullanılır.
5. Bulgarca kelimeler içinde kural taşıyan parçalar renkli marker ile gösterilir.
6. Hover ile kısa açıklama, tıklama ile sağ panelde ayrıntılı açıklama sunulur.
7. Kelimeler, gramer kuralları, telaffuz, çoğul yapıları, cinsiyet, örnek cümleler ve alıştırmalar ayrı veri katmanlarında tutulur.
8. Kod ve içerik ayrıdır; yeni PDF geldiğinde mümkün olduğunca kod değişmeden JSON eklenmelidir.
9. Gerektiğinde uygulama geliştirmeleri patch mantığıyla hazırlanır.
10. Asistan her büyük değişiklikte Codex/Antigravity için uygulanabilir görev promptu üretir.

## İlk MVP kararı

İlk sürüm Vercel/backend kullanmadan statik çalışır:

- Frontend: React + Vite + TypeScript
- Stil: Tailwind
- Veri: GitHub’daki JSON dosyaları
- Ders verileri: `mustafasacar50/bulgarca` reposunda `public/data/`
- Kişisel ilerleme: `mustafasacar50/bulgarca-user-data` reposunda JSON dosyaları
- GitHub token: Kullanıcı tarafından uygulama arayüzüne manuel girilir
- Token kod içine, repo dosyasına veya JSON dosyasına yazılmaz
- localStorage/sessionStorage yalnızca geçici cihaz verisi/cache için kullanılır
- Asıl ilerleme GitHub’daki user-data JSON dosyalarından yüklenir ve oraya kaydedilir

## İlerideki güvenli mimari

Proje olgunlaşınca Vercel API Routes veya başka bir backend eklenebilir. O aşamada GitHub token yalnızca backend tarafında tutulur, frontend’e asla gönderilmez. Bu nedenle ilk MVP bile ileride backend’e geçebilecek şekilde soyutlanmalıdır.

## Çıktı standardı

Yeni PDF işlendiğinde asistan şu dosyaları üretmelidir:

- `lesson-XXX.json`
- `glossary.patch.json`
- `rules.patch.json`
- `exercises-XXX.json`
- `source-index.patch.json`
- `changelog.md`
- `codex-apply-prompt.md`

## JSON tasarım ilkeleri

- Her dersin benzersiz `lesson_id` alanı olmalıdır.
- Her kuralın benzersiz `rule_id` alanı olmalıdır.
- Her kelimenin benzersiz `entry_id` alanı olmalıdır.
- Kaynak PDF, sayfa ve bağlam bilgisi `source` alanında tutulmalıdır.
- Ders içerikleri sadece düz metin değil; açıklama, örnek, tooltip, sağ panel açıklaması ve alıştırma üretimine uygun olmalıdır.
- Türkçe açıklamalar sade, doğrudan ve öğrenmeyi kolaylaştırıcı olmalıdır.
- Bulgarca metinler Kiril alfabesiyle korunmalıdır.
- Türkçe açıklamalar uygulamanın ana öğrenme dili olacaktır.

## Asistanın rolü

Asistan yalnızca içerik üretmez; proje mimarisini, veri şemalarını, patch stratejisini, kaynak dosyalarını ve kod asistanı promptlarını da yönetir. Uzayan sohbetlerde yeni chat açıldığında proje kaynak dosyaları ve bu talimatlar sayesinde süreç kaldığı yerden devam etmelidir.
