const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function runDiagnostics() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  console.log("--- Diagnóstico de Efraín App ---");
  console.log("API Key encontrada:", apiKey ? "Sí (empieza por " + apiKey.substring(0, 7) + "...)" : "No");
  
  if (!apiKey) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("\n1. Probando conexión básica...");
    // Intentamos listar los modelos disponibles para esta clave
    // Nota: El SDK de JS no tiene un método directo sencillo para listar, 
    // así que probaremos una generación mínima con el modelo más básico.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hola, responde con la palabra 'OK'");
    const response = await result.response;
    console.log("Respuesta de Google:", response.text());
    console.log("✅ Conexión exitosa. El problema podría ser el formato del prompt o el tiempo de espera.");
  } catch (error) {
    console.error("❌ Error detectado:");
    console.error("Mensaje:", error.message);
    if (error.message.includes("404")) {
      console.log("\nSugerencia: El error 404 indica que el modelo 'gemini-1.5-flash' no está disponible para esta clave en tu región, o la clave no tiene permisos para la Generative Language API.");
    }
  }
}

runDiagnostics();
