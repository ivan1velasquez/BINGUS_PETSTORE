/**
 * webOSTV-dev.js - Herramientas de desarrollo para LG WebOS TV
 * Proporciona funcionalidades adicionales para debugging
 */

(function() {
    'use strict';
    
    // Verificar que webOS esté disponible
    if (typeof window.webOS === 'undefined') {
        console.warn('webOSTV.js debe cargarse antes de webOSTV-dev.js');
        return;
    }
    
    // Extender webOS con funcionalidades de desarrollo
    window.webOS.dev = {
        // Logging mejorado
        log: function(message, data) {
            console.log('[webOS Dev]', message, data || '');
        },
        
        // Simular eventos de control remoto
        simulateKey: function(keyCode) {
            var event = new KeyboardEvent('keydown', {
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
        },
        
        // Información de debug
        getDebugInfo: function() {
            return {
                userAgent: navigator.userAgent,
                screen: {
                    width: screen.width,
                    height: screen.height,
                    availWidth: screen.availWidth,
                    availHeight: screen.availHeight
                },
                localStorage: {
                    available: typeof localStorage !== 'undefined',
                    used: localStorage ? JSON.stringify(localStorage).length : 0
                }
            };
        }
    };
    
    // Mapeo de teclas para desarrollo con teclado
    var keyMapping = {
        // Flechas ya funcionan nativamente
        // Teclas adicionales para simular control remoto
        'KeyR': 403,  // Rojo
        'KeyG': 404,  // Verde
        'KeyY': 405,  // Amarillo
        'KeyB': 406,  // Azul
        'KeyI': 457,  // Info
        'KeyP': 415,  // Play
        'KeyS': 413,  // Stop
        'PageUp': 427,    // Channel Up
        'PageDown': 428,  // Channel Down
        'BracketLeft': 412,  // Rewind
        'BracketRight': 417  // Fast Forward
    };
    
    // Interceptar teclas de desarrollo
    document.addEventListener('keydown', function(e) {
        var mappedKey = keyMapping[e.code];
        if (mappedKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // Solo si no estamos en un input
            if (document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                window.webOS.dev.simulateKey(mappedKey);
            }
        }
    });
    
    console.log('webOSTV-dev.js cargado');
    console.log('Teclas de desarrollo disponibles:');
    console.log('  R = Rojo, G = Verde, Y = Amarillo, B = Azul');
    console.log('  I = Info, P = Play, S = Stop');
    console.log('  PageUp/PageDown = Channel Up/Down');
    console.log('  [ = Rewind, ] = Fast Forward');
    
})();

