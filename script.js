// ==========================================
// DAGEA AI - Frontend Logic
// ✅ Versión FINAL - Scroll Mejorado + Gemini
// ==========================================

// ==========================================
// REFERENCIAS AL DOM
// ==========================================
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

// Estado del chat
let isProcessing = false;

// ==========================================
// RED NEURONAL (Fondo animado)
// ==========================================
let nodes = [];

/**
 * Ajustar canvas al tamaño de la ventana
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createNodes();
}

/**
 * Crear nodos aleatorios para la red neuronal
 */
function createNodes() {
    nodes = [];
    // Calcular cantidad de nodos según tamaño de pantalla
    const count = Math.floor((canvas.width * canvas.height) / 15000);
    
    for (let i = 0; i < count; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,  // Velocidad X
            vy: (Math.random() - 0.5) * 0.5,  // Velocidad Y
            size: Math.random() * 2 + 1        // Tamaño del nodo
        });
    }
}

/**
 * Dibujar conexiones entre nodos cercanos
 */
function drawConnections() {
    const maxDist = 120;
    
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < maxDist) {
                // Opacidad basada en distancia: más cerca = más visible
                const opacity = 0.15 * (1 - dist / maxDist);
                
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `rgba(107, 142, 35, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

/**
 * Dibujar los nodos (puntos)
 */
function drawNodes() {
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(107, 142, 35, 0.6)';
        ctx.fill();
    });
}

/**
 * Actualizar posiciones de los nodos
 */
function updateNodes() {
    nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        
        // Rebotar en los bordes del canvas
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
    });
}

/**
 * Loop principal de animación (60fps)
 */
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();
    drawNodes();
    updateNodes();
    requestAnimationFrame(animate);
}

// Inicializar animación de red neuronal
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animate();

// ==========================================
// FUNCIONES DE CHAT
// ==========================================

/**
 * Obtener hora actual formateada
 */
function getTime() {
    return new Date().toLocaleTimeString('es', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * ✅ SCROLL SUAVE MEJORADO
 * Hace scroll al último mensaje con animación suave
 */
function scrollToBottom() {
    setTimeout(() => {
        if (chatMessages) {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'  // Animación suave
            });
        }
    }, 100);  // Pequeño delay para asegurar que el DOM se actualizó
}

/**
 * Agregar mensaje al chat visualmente
 * @param {string} text - Contenido del mensaje
 * @param {string} sender - 'user' o 'bot'
 */
function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    
    // Icono según el remitente
    const icon = sender === 'bot' ? 'ph-robot' : 'ph-user';
    
    // Formatear texto: saltos de línea y negritas con **
    const formattedText = text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    div.innerHTML = `
        <div class="msg-avatar">
            <i class="ph ${icon}"></i>
        </div>
        <div class="msg-content">
            <div class="bubble">${formattedText}</div>
            <span class="time">${getTime()}</span>
        </div>
    `;
    
    chatMessages.appendChild(div);
    
    // ✅ Auto-scroll al agregar mensaje
    scrollToBottom();
}

/**
 * Mostrar indicador de "escribiendo..."
 */
function showTyping() {
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
        scrollToBottom();
    }
}

/**
 * Ocultar indicador de "escribiendo..."
 */
function hideTyping() {
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

// ==========================================
// ✅ FUNCIÓN PRINCIPAL: Enviar mensaje
// ==========================================
async function sendMessage() {
    const text = messageInput.value.trim();
    
    // Validaciones
    if (!text || isProcessing) return;
    
    // Bloquear mientras procesa
    isProcessing = true;
    sendBtn.disabled = true;
    
    // Mostrar mensaje del usuario
    addMessage(text, 'user');
    
    // Limpiar input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Mostrar indicador de carga
    showTyping();
    
    try {
        console.log('📤 Enviando mensaje:', text);
        
        // Petición POST al backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ message: text })
        });
        
        console.log('📥 Status respuesta:', response.status);
        
        // Parsear respuesta JSON
        const data = await response.json();
        console.log('📦 Data recibida:', data);
        
        // Ocultar indicador de carga
        hideTyping();
        
        // Manejar errores del backend
        if (data.error) {
            console.error('❌ Error del backend:', data.error);
            addMessage(`⚠️ ${data.error}`, 'bot');
            if (data.debug) {
                console.log('🔍 Debug:', data.debug);
            }
            return;
        }
        
        // ✅ Mostrar respuesta exitosa de la IA
        if (data.response) {
            console.log('✅ Respuesta IA:', data.response.substring(0, 100) + '...');
            addMessage(data.response, 'bot');
        } else {
            console.warn('⚠️ Sin respuesta en data:', data);
            addMessage('⚠️ No se recibió respuesta válida de la IA', 'bot');
        }
        
    } catch (error) {
        // Manejar errores de red/conexión
        hideTyping();
        console.error('❌ Error de red:', error);
        addMessage('❌ Error de conexión. Verifica que el servidor esté corriendo.', 'bot');
        
    } finally {
        // Reactivar input sin importar el resultado
        isProcessing = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Enviar sugerencia rápida (desde los botones)
 */
function sendSuggestion(text) {
    messageInput.value = text;
    sendMessage();
}

/**
 * Manejar tecla Enter en el textarea
 * Enter = enviar, Shift+Enter = nueva línea
 */
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();  // Evitar salto de línea
        sendMessage();
    }
}

/**
 * Auto-redimensionar textarea según contenido
 */
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// ==========================================
// MEJORAS DE UX / SCROLL
// ==========================================

/**
 * Prevenir que el scroll del chat interfiera con el scroll de la página
 */
if (chatMessages) {
    chatMessages.addEventListener('wheel', (e) => {
        e.stopPropagation();
    }, { passive: true });
}

/**
 * Auto-scroll inicial al cargar la página
 */
function initializeChat() {
    scrollToBottom();
    if (messageInput) {
        messageInput.focus();
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
console.log('🤖 DAGEA AI - GeoAssistant cargado');
console.log('📡 Backend URL: /api/chat');
console.log('✨ Scroll mejorado: activo');

// Ejecutar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeChat, 500);
});

// ==========================================
// FUNCIONES GLOBALES (para usar en HTML)
// ==========================================
window.sendMessage = sendMessage;
window.sendSuggestion = sendSuggestion;
window.handleKeyDown = handleKeyDown;
window.autoResize = autoResize;

// ==========================================
// RESUMEN DEL FLUJO:
// ==========================================
// 1. Usuario escribe → sendMessage()
// 2. addMessage() muestra mensaje user + scroll
// 3. fetch() envía POST a /api/chat
// 4. Backend procesa con Gemini API
// 5. Respuesta JSON → addMessage() muestra bot + scroll
// ==========================================