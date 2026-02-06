---
trigger: always_on
---

# aSc Timetables asc.txt Element Açıklamaları

Bu dosya, asc.txt dosyasındaki başlıca elementlerin ve önemli attribute'larının (özelliklerinin) neyi ifade ettiğini açıklar.

---

## 1. `<period>`
Bir okul günündeki ders saatlerini tanımlar.
- **period**: Saatin sıra numarası (örn: 1, 2, 3…)
- **name**: Saatin adı (örn: "1. Ders")
- **short**: Kısa gösterim (örn: "1", "2")
- **starttime**: Dersin başlama saati (örn: "08:30")
- **endtime**: Dersin bitiş saati (örn: "09:10")

---

## 2. `<daysdef>`
Haftanın günlerini ve gün isimlerini tanımlar.
- **id**: Gün tanımının benzersiz ID'si
- **name**: Günlerin adı (örn: "Hafta içi")
- **short**: Kısa gösterim
- **days**: Günlerin kısa kodu veya listesi (örn: "Pazartesi,Salı,…")

---

## 3. `<subject>`
Dersleri tanımlar.
- **id**: Dersin benzersiz ID'si
- **name**: Dersin adı (örn: "Matematik")
- **short**: Kısa kod (örn: "MAT")

---

## 4. `<teacher>`
Öğretmenleri tanımlar.
- **id**: Öğretmenin benzersiz ID'si
- **name**: Ad Soyad
- **firstname**: Adı
- **lastname**: Soyadı
- **short**: Kısa kod
- **gender**: Cinsiyet ("M" veya "F")
- **email**: E-posta
- **mobile**: Telefon
- **color**: Renk kodu (görselde kullanılır)

---

## 5. `<classroom>`
Derslikleri tanımlar.
- **id**: Dersliğin benzersiz ID'si
- **name**: Dersliğin adı
- **short**: Kısa kod
- **capacity**: Kapasite

---

## 6. `<class>`
Sınıfları tanımlar.
- **id**: Sınıfın benzersiz ID'si
- **name**: Sınıf adı (örn: "5A")
- **short**: Kısa kod
- **teacherid**: Sınıf öğretmeninin ID'si
- **classroomids**: Sınıfın kullanabileceği dersliklerin ID'leri (virgülle ayrılmış)
- **grade**: Sınıf seviyesi

---

## 7. `<lesson>`
Bir dersin, hangi sınıfta, hangi öğretmen(ler) tarafından, haftada kaç saat verileceğini tanımlar.
- **id**: Benzersiz ders ID'si
- **subjectid**: Hangi ders (örn: Matematik)
- **classids**: Hangi sınıflar (virgülle ayrılmış)
- **teacherids**: Hangi öğretmen(ler) (virgülle ayrılmış)
- **classroomids**: Hangi derslik(ler) (virgülle ayrılmış)
- **periodspercard**: Bir kartta (blokta) kaç saat var
- **periodsperweek**: Haftada toplam kaç saat
- **daysdefid**: Hangi günler tanımı kullanılacak
- **groupids**: Grup ID'leri (varsa)

---

## 8. `<card>`
Ders programındaki tek bir dersi (bir saatlik veya blok ders) temsil eder.
- **lessonid**: Hangi dersin kartı
- **classroomids**: Hangi derslikte
- **period**: Kaçıncı ders saati (örn: 1, 2, 3…)
- **weeks**: Hangi haftalarda geçerli (genellikle "1" tüm haftalar için)
- **terms**: Hangi dönem(ler)de geçerli
- **days**: 5 karakterli binary string (örn: "10000" = Pazartesi, "01000" = Salı, …)
  - Her karakter bir günü temsil eder:
    - 1. karakter: Pazartesi
    - 2. karakter: Salı
    - 3. karakter: Çarşamba
    - 4. karakter: Perşembe
    - 5. karakter: Cuma
  - "1" o gün var, "0" yok.

---