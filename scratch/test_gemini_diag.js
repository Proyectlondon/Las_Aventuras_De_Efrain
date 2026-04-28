const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  const genAI = new GoogleGenerativeAI("AIzaSyAKqR-NRReZw-IY6UnzaVXSFEL4c0LK7Ug");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  try {
    const result = await model.generateContent("Hola, di Shalom");
    const response = await result.response;
    console.log("Respuesta:", response.text());
  } catch (err) {
    console.error("Error DETECTADO:", err);
  }
}

testGemini();
