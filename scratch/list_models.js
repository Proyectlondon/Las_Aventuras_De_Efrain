const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyAKqR-NRReZw-IY6UnzaVXSFEL4c0LK7Ug");
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAKqR-NRReZw-IY6UnzaVXSFEL4c0LK7Ug");
    const data = await response.json();
    console.log("Modelos disponibles:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error listando modelos:", err);
  }
}

listModels();
