const imageInput = document.getElementById("check-image");
const previewWrap = document.getElementById("preview-wrap");
const preview = document.getElementById("preview");
const readButton = document.getElementById("read-button");
const statusBox = document.getElementById("ocr-status");
const ocrText = document.getElementById("ocr-text");

imageInput.addEventListener("change", () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    statusBox.textContent = "בחרי קובץ תמונה תקין.";
    return;
  }
  preview.src = URL.createObjectURL(file);
  previewWrap.classList.remove("hidden");
  statusBox.textContent = "התמונה מוכנה. לחצי על הכפתור כדי לנסות לזהות טקסט.";
});

readButton.addEventListener("click", async () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) {
    statusBox.textContent = "קודם צלמי או בחרי תמונה.";
    return;
  }
  if (!window.Tesseract) {
    statusBox.textContent = "ספריית זיהוי הטקסט לא נטענה. בדקי את החיבור לאינטרנט ונסי שוב.";
    return;
  }

  readButton.disabled = true;
  readButton.textContent = "מנסה לקרוא את התמונה...";
  statusBox.textContent = "הזיהוי עשוי לקחת קצת זמן. איכות הצילום משפיעה על התוצאה.";

  try {
    // OCR ראשוני בלבד. כתב יד ופריסת צ׳קים עלולים להיות קשים לזיהוי.
    const result = await Tesseract.recognize(file, "heb+eng", {
      logger: (message) => {
        if (message.status === "recognizing text") {
          statusBox.textContent = `מזהה טקסט... ${Math.round((message.progress || 0) * 100)}%`;
        }
      }
    });
    const text = (result.data.text || "").trim();
    ocrText.value = text;
    autofillFromText(text);
    statusBox.textContent = text
      ? "הזיהוי הסתיים. בדקי את הטקסט ואת השדות לפני השמירה."
      : "לא זוהה טקסט ברור. נסי צילום חד יותר או הזיני את הפרטים ידנית.";
  } catch (error) {
    statusBox.textContent = "לא הצלחנו לקרוא את התמונה. נסי שוב או מלאי את הפרטים ידנית.";
  } finally {
    readButton.disabled = false;
    readButton.textContent = "✦ נסי לזהות טקסט מהתמונה";
  }
});

function autofillFromText(text) {
  // מילוי עזר בסיסי בלבד: זיהוי סכום/תאריך לפי תבניות נפוצות.
  // לא מניחים שכל מספר בתמונה הוא סכום או תאריך הצ׳ק.
  const amountField = document.getElementById("amount");
  const dateField = document.getElementById("date");

  const dateMatch = text.match(/\b(0?[1-9]|[12][0-9]|3[01])[./-](0?[1-9]|1[0-2])[./-](20\d{2}|\d{2})\b/);
  if (dateMatch && !dateField.value) dateField.value = dateMatch[0];

  const amountMatches = [...text.matchAll(/(?:₪|ש"ח|שח)?\s*([0-9]{1,3}(?:[,][0-9]{3})*(?:\.[0-9]{1,2})?)(?:\s*(?:₪|ש"ח|שח))?/g)]
    .map(m => m[1].replace(/,/g, ""))
    .map(Number)
    .filter(n => Number.isFinite(n) && n > 0 && n <= 100000000);

  // רק מציעים סכום אם נמצא מועמד יחיד, כדי לא להכניס בטעות מספר חשבון/צ׳ק.
  if (amountMatches.length === 1 && !amountField.value) {
    amountField.value = amountMatches[0];
  }
}
