// Scratch script to test translation API response
async function test() {
  const targetLang = "ta"; // Tamil
  const texts = ["Crack Government Exams with Ease", "Premium Membership Active"];
  
  const results = [];
  for (const text of texts) {
    const trimmed = text.trim();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
    console.log("Fetching URL:", url);
    try {
      const response = await fetch(url);
      console.log("Status:", response.status);
      const data = await response.json();
      console.log("Data:", JSON.stringify(data));
      let translated = "";
      if (data && data[0]) {
        translated = data[0].map((x) => x[0]).join("");
      }
      results.push(translated || text);
    } catch (err) {
      console.error("Error fetching:", err);
      results.push(text);
    }
  }
  console.log("Results:", results);
}

test();
