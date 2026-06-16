// ============================================================
//  Astrogalaxy — Cloud Function (OPCIONAL): verificar evidencia con IA
// ============================================================
//  Solo necesitas esto si quieres OCULTAR tu clave de IA en un
//  servidor. La forma más simple y gratuita es NO usar esta
//  función y poner tu clave de Gemini en script.js (AG_GEMINI_KEY).
//
//  Esta versión usa Google Gemini (capa gratuita).
//  Guarda tu clave como secreto:
//    firebase functions:secrets:set GEMINI_API_KEY
//  Desplegar:  firebase deploy --only functions
//  (requiere plan Blaze de Firebase)
// ============================================================

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

exports.verifyEvidence = onRequest(
  { secrets: [GEMINI_API_KEY], cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Usa POST" }); return; }

    try {
      const { challenge, image, mime } = req.body || {};
      if (!challenge || !image) {
        res.status(400).json({ error: "Faltan 'challenge' o 'image'" });
        return;
      }

      const prompt =
        'Eres el verificador de retos ambientales de Astrogalaxy. ' +
        'El estudiante debía cumplir este reto: "' + challenge + '". ' +
        'Analiza la foto de evidencia y decide si la acción mostrada corresponde realmente al reto. ' +
        'Sé estricto: si la foto no muestra una acción ambiental real y coherente con el reto, recházala. ' +
        'Responde SOLO con un objeto JSON válido, sin texto adicional, con esta forma exacta: ' +
        '{"ai_verified": true|false, "confidence": 0.0-1.0, "action": "texto corto", "message": "una frase de retroalimentación"}.';

      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY.value();

      const aiResp = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mime || "image/jpeg", data: image } }
            ]
          }]
        })
      });

      if (!aiResp.ok) {
        const detail = await aiResp.text();
        res.status(502).json({ error: "Error de la IA", detail });
        return;
      }

      const data = await aiResp.json();
      let text = "";
      try { text = data.candidates[0].content.parts[0].text; } catch (e) { text = ""; }
      const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const verdict = JSON.parse(jsonStr);

      res.json({
        ai_verified: !!verdict.ai_verified,
        confidence: Math.max(0, Math.min(1, Number(verdict.confidence) || 0)),
        action: verdict.action || "Acción detectada",
        message: verdict.message || ""
      });
    } catch (err) {
      res.status(500).json({ error: "No se pudo verificar", detail: String(err) });
    }
  }
);
