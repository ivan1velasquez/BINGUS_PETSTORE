/**
 * webOSTV.js - LG WebOS TV JavaScript Library Stub
 * Este archivo proporciona stubs para desarrollo local
 * En producción, usar la librería oficial de LG
 */

// Crear namespace webOS si no existe
if (typeof window.webOS === 'undefined') {
    window.webOS = {
        // Información de la plataforma
        platform: {
            tv: true
        },
        
        // Obtener ID de la aplicación
        fetchAppId: function() {
            return 'com.ctvc.iptv';
        },
        
        // Obtener información de la aplicación
        fetchAppInfo: function(callback, errorCallback) {
            if (callback) {
                callback({
                    id: 'com.ctvc.iptv',
                    version: '1.0.0',
                    vendor: 'CTVC'
                });
            }
        },
        
        // Volver a la pantalla anterior del sistema
        platformBack: function() {
            console.log('webOS.platformBack() llamado');
            // En desarrollo, simular cierre
            if (window.confirm('¿Salir de la aplicación?')) {
                window.close();
            }
        },
        
        // Servicio Luna (stub)
        service: {
            request: function(uri, params) {
                console.log('webOS.service.request:', uri, params);
                if (params && params.onSuccess) {
                    params.onSuccess({});
                }
                return {
                    cancel: function() {}
                };
            }
        },
        
        // Información del dispositivo
        deviceInfo: function(callback) {
            if (callback) {
                callback({
                    modelName: 'Development',
                    version: '1.0.0',
                    versionMajor: 1,
                    versionMinor: 0,
                    versionDot: 0,
                    sdkVersion: '1.0.0',
                    screenWidth: 1920,
                    screenHeight: 1080,
                    uhd: false
                });
            }
        },
        
        // Sistema de archivos (stub)
        libPath: 'webOSTVjs-1.2.10/',
        
        // Keyboard
        keyboard: {
            isShowing: function() {
                return false;
            }
        },
        
        // Sistema de notificaciones
        notification: {
            showToast: function(params) {
                console.log('Toast:', params.message);
            }
        }
    };
}

// DRM (stub para desarrollo)
if (typeof window.webOSDev === 'undefined') {
    window.webOSDev = {
        DRM: {
            Type: {
                PLAYREADY: 'playready',
                WIDEVINE: 'widevine'
            }
        }
    };
}

console.log('webOSTV.js cargado (modo desarrollo)');

