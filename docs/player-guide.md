# Guía del Reproductor IPTV para webOS

## Descripción General

El reproductor IPTV está diseñado para funcionar de manera óptima en televisores LG con webOS, proporcionando reproducción de video y audio confiable para streams IPTV.

## Arquitectura

### Componentes Principales

1. **webOSPlayerAdapter** (`js/webOSPlayerAdapter.js`)
   - Módulo centralizado para manejo de reproducción en webOS
   - Detecta automáticamente el entorno y capacidades del sistema
   - Selecciona el método de reproducción óptimo
   - Maneja codecs y MIME types correctamente

2. **Player** (`js/player.js`)
   - Reproductor principal que usa el adaptador
   - Maneja la interfaz de usuario y controles
   - Implementa fallback entre métodos de reproducción

### APIs Utilizadas

- **HTML5 `<video>` element**: API principal para reproducción
- **HLS.js**: Biblioteca JavaScript para HLS/MPEGTS cuando el nativo no funciona
- **webOSPlayerAdapter**: Capa de abstracción para webOS

## Flujo de Reproducción

### 1. Inicialización

```javascript
Player.init() → webOSPlayerAdapter.init(videoElement)
```

El adaptador detecta:
- Si está ejecutándose en webOS
- Codecs soportados por el navegador
- Versión de webOS (si está disponible)

### 2. Carga de Stream

```javascript
Player.loadChannel() → Player.loadWithNativePlayer() → webOSPlayerAdapter.prepareStream()
```

El adaptador:
1. Detecta el formato del stream (HLS, MPEGTS, MP4, etc.)
2. Determina el método de reproducción óptimo
3. Configura el elemento video con MIME types correctos
4. Recomienda usar HLS.js si es necesario

### 3. Verificación de Salud

```javascript
Player.checkVideoDimensions() → webOSPlayerAdapter.checkPlaybackHealth()
```

El adaptador verifica:
- Si hay video (dimensiones > 0)
- Si hay audio
- Estado de la red
- Problemas de codec

## Manejo de Codecs

### Codecs Soportados

El adaptador detecta automáticamente:
- **H.264 (AVC)**: Baseline, Main, High profiles
- **H.265 (HEVC)**: Menos común pero mejor compresión
- **VP8/VP9**: Menos común en IPTV
- **AAC/MP3**: Codecs de audio

### Estrategia de Codec

1. **Prioridad H.264 + AAC**: Estándar de la industria IPTV
2. **Detección automática**: El adaptador verifica qué codecs están disponibles
3. **Fallback inteligente**: Si un codec no funciona, intenta otro método

## Formatos de Stream

### HLS (.m3u8)
- **Método nativo**: Funciona bien en webOS si el codec es H.264
- **Método HLS.js**: Se usa si el nativo falla o para mejor compatibilidad
- **MIME type**: `application/vnd.apple.mpegurl`

### MPEGTS (.ts)
- **Método recomendado**: HLS.js (mejor soporte de codecs)
- **MIME type**: `video/mp2t`
- **Nota**: Los streams MPEGTS directos pueden no funcionar bien con HTML5 nativo

### MP4
- **Método nativo**: Funciona bien si el codec es H.264
- **MIME type**: `video/mp4`

## Solución de Problemas

### Problema: "Solo audio sin video"

**Causas posibles:**
1. Codec de video no compatible
2. MIME type incorrecto
3. Stream MPEGTS directo sin HLS.js

**Soluciones:**

1. **Verificar logs en consola**:
   ```javascript
   // Buscar estos mensajes:
   "Solo audio detectado - problema de codec de video"
   "Video sin dimensiones - posible problema de codec"
   ```

2. **El adaptador intenta automáticamente**:
   - Cambiar a HLS.js si está usando nativo
   - Recargar el stream con configuración diferente
   - Mostrar mensaje de error claro

3. **Si persiste el problema**:
   - Verificar que el servidor IPTV esté enviando streams con codec H.264
   - Cambiar el formato de salida en la configuración del servidor
   - Usar `output=hls` en lugar de `output=mpegts`

### Problema: "El canal no carga"

**Causas posibles:**
1. Error de red
2. URL inválida
3. Timeout del servidor

**Soluciones:**
- Verificar conexión a internet
- Verificar que la URL del canal sea válida
- Revisar logs de red en la consola del navegador

### Problema: "Error de codec"

**Causas posibles:**
1. Codec no soportado por webOS
2. Configuración incorrecta del stream

**Soluciones:**
- El adaptador intenta automáticamente con HLS.js
- Si falla, verificar que el servidor use codec H.264

## Configuración Recomendada

### Para Servidor XUI

```javascript
// En config.js
PLAYLIST_PATH: '/playlist/{username}/{password}/m3u_plus?output=hls'
```

**Razón**: HLS es más compatible que MPEGTS directo y funciona mejor con el reproductor nativo de webOS.

### Alternativa (si HLS no funciona)

```javascript
PLAYLIST_PATH: '/playlist/{username}/{password}/m3u_plus?output=mpegts'
```

**Nota**: Con MPEGTS, el adaptador usará HLS.js automáticamente para mejor compatibilidad.

## Extender Compatibilidad

### Agregar Nuevo Formato de Stream

1. **En `webOSPlayerAdapter.js`**, método `detectStreamInfo()`:
   ```javascript
   } else if (lowerUrl.includes('.nuevo-formato')) {
       info.format = 'nuevo-formato';
       info.mimeType = 'video/nuevo-mime';
       info.useHLSJS = true; // o false según corresponda
   }
   ```

2. **En `player.js`**, método `detectFormat()`:
   ```javascript
   if (lowerUrl.includes('.nuevo-formato')) {
       return 'nuevo-formato';
   }
   ```

3. **En `loadWithNativePlayer()`**, agregar caso:
   ```javascript
   } else if (format === 'nuevo-formato') {
       // Lógica de reproducción
   }
   ```

### Agregar Nuevo Codec

1. **En `webOSPlayerAdapter.js`**, método `detectSupportedCodecs()`:
   ```javascript
   nuevo_codec: videoElement.canPlayType('video/container; codecs="codec-string"')
   ```

2. **Actualizar lógica de detección** en `canPlayNative()` si es necesario

## Logging y Depuración

### Logs Importantes

El adaptador y el reproductor generan logs detallados:

```javascript
// Inicialización
"webOSPlayerAdapter inicializado"
"Codecs soportados: {...}"

// Carga de stream
"Stream preparado: {...}"
"Configuración de stream (webOSAdapter): {...}"

// Verificación de salud
"Estado de reproducción (webOSAdapter): {...}"
"Dimensiones del video: ..."

// Errores
"Solo audio detectado - problema de codec de video"
"Video sin dimensiones - posible problema de codec"
```

### Cómo Depurar

1. Abrir consola del navegador (F12 en modo desarrollo)
2. Filtrar por "webOSPlayerAdapter" o "Player"
3. Buscar mensajes de error o advertencia
4. Verificar el estado de reproducción reportado

## Mejores Prácticas

1. **Siempre usar webOSPlayerAdapter**: Proporciona mejor detección y manejo
2. **Configurar MIME types correctamente**: El adaptador lo hace automáticamente
3. **Usar HLS cuando sea posible**: Mejor compatibilidad en webOS
4. **Verificar codecs antes de reproducir**: El adaptador lo hace automáticamente
5. **Implementar fallback robusto**: Ya está implementado en el adaptador

## Referencias

- [webOS TV Developer Guide](https://webostv.developer.lge.com/)
- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [HTML5 Video API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement)

