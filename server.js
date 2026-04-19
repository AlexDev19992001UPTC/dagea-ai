// ==========================================
// DAGEA AI - Servidor Backend (Google Gemini)
// ==========================================

const express = require('express');
const cors = require('cors');

// ✅ Cargar dotenv SOLO si estamos en desarrollo local
// En producción (Render), las variables ya están en process.env
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// ✅ Verificar inmediatamente que tenemos la API Key
const apiKey = process.env.GEMINI_API_KEY;
console.log('🔑 API Key cargada:', apiKey ? '✅ SÍ (' + apiKey.substring(0, 10) + '...)' : '❌ NO');
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('📦 Todas las env vars:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('ENV')).join(', '));

const app = express();
const PORT = process.env.PORT || 3000;

// ... el resto del código sigue igual ...
// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-goog-api-key']
}));

app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// ENDPOINT PRINCIPAL: POST /api/chat
// ==========================================
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        if (!userMessage || userMessage.trim() === '') {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API Key de Gemini no configurada' });
        }

        // Prompt del sistema: personalidad de GeoAI
        const systemPrompt = `Eres GeoAI, asistente educativo de geografía de DAGEA (Geografía Aplicada y Cartografía Inteligente).

🎯 TU CONOCIMIENTO:
- Geografía física: relieve, clima, hidrografía, ecosistemas
- Geografía humana: población, cultura, urbanización, migración
- Geografía económica: recursos, comercio, actividades productivas
- Cartografía: mapas, escalas, proyecciones, simbología
- SIG/GIS: sistemas de información geográfica, análisis espacial
- Georreferenciación: coordenadas, GPS, sistemas de referencia
- Medio ambiente: sostenibilidad, cambio climático, conservación

✅ REGLAS DE RESPUESTA:
1. Responde SIEMPRE en español
2. Sé claro, didáctico y profesional
3. Usa ejemplos prácticos y cotidianos
4. Mantén respuestas concisas (máximo 3-4 párrafos)
5. Si no sabes algo, dilo honestamente
6. Puedes usar **negritas** para resaltar conceptos clave`;

        // URL de Gemini API con modelo que funciona
        const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

        // Enviar petición a Gemini
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey  // ← Header, no query param
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nUsuario pregunta: ${userMessage}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048  // ← Suficiente para respuestas completas
                }
            })
        });

        const data = await response.json();
        
        // Verificar errores HTTP
        if (!response.ok) {
            console.error('❌ Gemini HTTP error:', response.status, data);
            return res.status(response.status).json({ 
                error: data.error?.message || `Error ${response.status} en Gemini API` 
            });
        }

        // Extraer texto de la respuesta
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const finishReason = data?.candidates?.[0]?.finishReason;

        // Validar que haya texto
        if (!aiText) {
            console.warn('⚠️ Gemini no generó texto. finishReason:', finishReason);
            
            if (finishReason === 'MAX_TOKENS') {
                return res.json({ 
                    response: '⚠️ La respuesta fue muy extensa. Por favor, reformula tu pregunta de forma más específica.' 
                });
            }
            
            return res.status(500).json({ 
                error: 'Gemini no generó contenido válido',
                finishReason: finishReason 
            });
        }

        // ✅ Respuesta exitosa
        return res.json({ success: true, response: aiText });

    } catch (error) {
        console.error('❌ Error interno del servidor:', error);
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==========================================
// ENDPOINTS ADICIONALES (OPCIONALES)
// ==========================================

// Health check: para monitoreo
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'dagea-ai',
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// Info de la API
app.get('/api/info', (req, res) => {
    res.json({
        name: 'DAGEA AI',
        description: 'Asistente de enseñanza geográfica',
        version: '1.0.0',
        model: 'gemini-flash-latest',
        endpoints: {
            chat: 'POST /api/chat',
            health: 'GET /api/health',
            info: 'GET /api/info'
        }
    });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🤖 DAGEA AI - Servidor de Enseñanza Geográfica');
    console.log(`📡 Frontend: http://localhost:${PORT}`);
    console.log(`🧠 Backend: Google Gemini (gemini-flash-latest)`);
    console.log(`🔑 Auth: X-goog-api-key header`);
    console.log(`🔢 Tokens: maxOutputTokens=2048`);
    console.log('='.repeat(50) + '\n');
});