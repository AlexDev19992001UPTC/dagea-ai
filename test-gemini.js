// test-gemini.js - Versión corregida con más tokens
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.log('❌ API Key no encontrada');
    process.exit(1);
}

const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

console.log('🌐 Probando Gemini con más tokens...\n');

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
    },
    body: JSON.stringify({
        contents: [{ 
            parts: [{ 
                text: '¿Qué es la geografía? Responde en español de forma breve.' 
            }] 
        }],
        generationConfig: { 
            maxOutputTokens: 2048,  // ← Aumentado de 50 a 2048
            temperature: 0.7
        }
    })
})
.then(async res => {
    console.log('📥 Status:', res.status, res.ok ? '✓' : '✗');
    const data = await res.json();
    
    console.log('\n📦 Respuesta:', JSON.stringify(data, null, 2));
    
    // Extraer texto
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiText) {
        console.log('\n✅ RESPUESTA DE GEMINI:');
        console.log(aiText);
    } else {
        console.log('\n⚠️ finishReason:', data?.candidates?.[0]?.finishReason);
        console.log('⚠️ No hay texto en la respuesta');
    }
})
.catch(err => console.log('❌ Error:', err.message));