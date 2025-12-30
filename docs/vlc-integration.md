# Modo Reproductor Embebido Tipo VLC

## Descripción

La aplicación usa un reproductor embebido con capacidades similares a VLC cuando el reproductor HTML5 nativo no muestra video (solo audio). Este modo usa HLS.js con configuraciones agresivas para manejar codecs de manera más robusta, similar a cómo VLC maneja los streams.

## Configuración

### Activar/Desactivar Modo Embebido Tipo VLC

En `js/config.js`, sección `PLAYER`:

```javascript
PLAYER: {
    // Usar reproductor embebido tipo VLC (mejor soporte de codecs)
    USE_EMBEDDED_VLC_MODE: true,  // true = usar modo embebido, false = usar reproductor HTML5
    
    // Configuración del reproductor embebido
    EMBEDDED: {
        // Forzar uso de HLS.js siempre (mejor soporte de codecs)
        FORCE_HLSJS: true,
        
        // Configuración agresiva de codecs
        AGGRESSIVE_CODEC_HANDLING: true,
        
        // Timeout para detección de codec (ms)
        CODEC_DETECTION_TIMEOUT: 5000,
        
        // Reintentos automáticos si detecta solo audio
        AUTO_RETRY_ON_AUDIO_ONLY: true,
        
        // Máximo de reintentos
        MAX_CODEC_RETRIES: 3
    }
}
```

### Cambiar entre Modo Embebido y Reproductor HTML5

**Para usar modo embebido tipo VLC:**
```javascript
USE_EMBEDDED_VLC_MODE: true
```

**Para usar reproductor HTML5 nativo:**
```javascript
USE_EMBEDDED_VLC_MODE: false
```

## Cómo Funciona

### Cuando USE_EMBEDDED_VLC_MODE está activado:

1. Al seleccionar un canal, usa HLS.js con configuraciones agresivas para codecs
2. El reproductor está **completamente embebido** en la aplicación (no se abre externo)
3. Funciona de manera similar a VLC:
   - **Mejor soporte de codecs**: Prioriza H.264 y AAC
   - **Detección automática**: Selecciona el mejor nivel de calidad con codecs compatibles
   - **Recuperación automática**: Si detecta solo audio, intenta cambiar de nivel automáticamente
   - **Buffering optimizado**: Configuración de buffer más grande para codecs complejos

### Métodos de Apertura

#### Método 1: Luna Service (webOS)
Usa la API de webOS para lanzar VLC como aplicación externa:
```javascript
webOS.service.request('luna://com.webos.applicationManager', {
    method: 'launch',
    parameters: {
        id: 'com.videolan.vlc',
        params: { uri: url }
    }
});
```

#### Método 2: Protocolo VLC
Intenta abrir usando el protocolo `vlc://`:
```
vlc://http://server.com/stream.m3u8
```

#### Método 3: Window.open
Abre la URL en una nueva ventana (puede ser interceptada por VLC si está configurado como reproductor por defecto).

#### Método 4: Diálogo Manual
Si todos los métodos automáticos fallan, muestra un diálogo con:
- La URL del stream
- Instrucciones para abrir manualmente en VLC
- Botón para copiar la URL al portapapeles

## Requisitos

### Para que funcione automáticamente:

1. **VLC debe estar instalado** en el dispositivo webOS
2. **VLC debe estar configurado** para abrir URLs de red automáticamente
3. **Permisos de aplicación** en webOS para lanzar aplicaciones externas

### Si VLC no se abre automáticamente:

1. El diálogo mostrará la URL
2. Copia la URL manualmente
3. Abre VLC
4. Ve a: **Medios → Abrir ubicación de red**
5. Pega la URL y presiona **Reproducir**

## Ventajas de Usar VLC

✅ **Mejor soporte de codecs**: VLC soporta más codecs que el reproductor HTML5  
✅ **Video + Audio garantizado**: VLC maneja mejor los codecs complejos  
✅ **Más estable**: Menos problemas de "solo audio"  
✅ **Soporte para más formatos**: VLC puede reproducir formatos que HTML5 no puede  

## Desventajas

⚠️ **Requiere VLC instalado**: El usuario debe tener VLC instalado  
⚠️ **Aplicación externa**: Sale de la aplicación IPTV para reproducir  
⚠️ **Menos integración**: No se pueden usar los controles de la app IPTV  

## Troubleshooting

### VLC no se abre automáticamente

**Solución 1**: Verificar que VLC esté instalado
- Abrir LG Content Store
- Buscar "VLC"
- Instalar si no está instalado

**Solución 2**: Verificar permisos
- En webOS, algunas aplicaciones requieren permisos para lanzar otras apps
- Verificar configuración de permisos de la aplicación

**Solución 3**: Usar método manual
- El diálogo mostrará la URL
- Copiar y abrir manualmente en VLC

### VLC se abre pero no reproduce

**Causa**: URL inválida o formato no soportado

**Solución**:
1. Verificar que la URL sea accesible
2. Probar la URL directamente en VLC
3. Verificar logs en consola para ver la URL exacta

### Quiero volver al reproductor HTML5

**Solución**: Cambiar configuración
```javascript
// En config.js
FORCE_VLC: false
```

## Integración con el Código

### En player.js

El método `loadChannel()` verifica `CONFIG.PLAYER.FORCE_VLC`:

```javascript
if (CONFIG.PLAYER && CONFIG.PLAYER.FORCE_VLC) {
    this.openInVLC(url, channel);
    return;
}
```

### Métodos Disponibles

- `openInVLC(url, channel)`: Método principal para abrir VLC
- `tryVLCUriMethod(url)`: Intenta con protocolo URI
- `openInVLCAlternative(url)`: Métodos alternativos
- `openInVLCFallback(url)`: Fallback final
- `showVLCUrlDialog(url)`: Muestra diálogo con URL

## Notas Técnicas

- La aplicación intenta múltiples métodos para máxima compatibilidad
- Si un método falla, automáticamente intenta el siguiente
- El diálogo manual es el último recurso si todo falla
- La URL se puede copiar al portapapeles con un click

## Futuras Mejoras

- [ ] Detectar si VLC está instalado antes de intentar abrir
- [ ] Permitir elegir reproductor (VLC, reproductor HTML5, etc.)
- [ ] Guardar preferencia de reproductor en localStorage
- [ ] Integración más profunda con VLC (controles remotos, etc.)

