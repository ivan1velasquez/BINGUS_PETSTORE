# Guía de Configuración del Servidor IPTV

## Descripción General

El archivo `config.js` centraliza toda la configuración relacionada con el servidor IPTV y los formatos de stream. Esta guía explica cómo configurar y cambiar entre diferentes formatos para optimizar la compatibilidad con webOS.

## Estructura de Configuración

### SERVER.BASE_URL
URL base del servidor IPTV (Xtream Codes API).

```javascript
BASE_URL: 'http://iptv.ctvc.cl:80'
```

### SERVER.PLAYLIST_FORMAT
Formato de la lista de reproducción que se descarga del servidor.

**Opciones disponibles:**
- `'m3u'`: Formato básico sin metadatos adicionales
- `'m3u_plus'`: **Recomendado** - Incluye logos, categorías, etc.
- `'simple'`: Formato simple (solo URLs y nombres)
- `'webtvlist'`: Optimizado para aplicaciones web

**Recomendación:** Usar `'m3u_plus'` para máxima compatibilidad.

### SERVER.OUTPUT_FORMAT
Formato de salida del stream de video/audio. **CRÍTICO para compatibilidad webOS.**

**Opciones disponibles:**

#### `'hls'` (HTTP Live Streaming) - **Recomendado por defecto**
- ✅ Mejor compatibilidad con reproductor nativo de webOS
- ✅ Streaming adaptativo (ajusta calidad según conexión)
- ✅ Funciona bien en modelos webOS 3.0+
- ⚠️ Puede tener problemas con algunos codecs (resulta en "solo audio")

**Cuándo usar:**
- Por defecto en la mayoría de casos
- Si los canales cargan correctamente
- Si quieres usar el reproductor nativo de webOS

#### `'mpegts'` (MPEG Transport Stream)
- ✅ Mejor soporte de codecs (asegura video + audio)
- ✅ Más robusto para codecs complejos
- ⚠️ Requiere HLS.js (no funciona con reproductor nativo)
- ⚠️ Puede tener mayor latencia

**Cuándo usar:**
- Si HLS da problemas de "solo audio"
- Si algunos canales no cargan con HLS
- Si el servidor tiene problemas con codecs en HLS

## Perfiles de Compatibilidad

Los perfiles predefinidos combinan `PLAYLIST_FORMAT` y `OUTPUT_FORMAT` para diferentes escenarios.

### WEBOS_HLS_COMPAT (Por defecto)
```javascript
ACTIVE_PROFILE: 'WEBOS_HLS_COMPAT'
```

**Configuración:**
- Playlist: `m3u_plus`
- Output: `hls`

**Ventajas:**
- Mejor compatibilidad con reproductor nativo
- Funciona bien en modelos webOS 3.0+
- Metadatos completos (logos, categorías)

**Cuándo usar:**
- Por defecto
- Si todo funciona correctamente

**Si tienes problemas:**
- Algunos canales dan "solo audio" → Probar `WEBOS_MPEGTS_DIRECT`
- Algunos canales no cargan → Probar `WEBOS_MPEGTS_DIRECT`

### WEBOS_MPEGTS_DIRECT
```javascript
ACTIVE_PROFILE: 'WEBOS_MPEGTS_DIRECT'
```

**Configuración:**
- Playlist: `m3u_plus`
- Output: `mpegts`

**Ventajas:**
- Mejor soporte de codecs
- Asegura video + audio
- Útil para resolver problemas de "solo audio"

**Cuándo usar:**
- Si HLS da problemas de "solo audio"
- Si algunos canales no cargan con HLS
- Si experimentas problemas de codec

**Nota:** Requiere HLS.js (se activa automáticamente)

### BASIC_HLS
```javascript
ACTIVE_PROFILE: 'BASIC_HLS'
```

**Configuración:**
- Playlist: `m3u`
- Output: `hls`

**Ventajas:**
- Playlist más ligera
- Útil para conexiones lentas

**Desventajas:**
- Sin logos ni categorías
- Menos información visual

## Cómo Cambiar la Configuración

### Método 1: Cambiar Perfil Activo (Recomendado)

```javascript
// En config.js
ACTIVE_PROFILE: 'WEBOS_MPEGTS_DIRECT'  // Cambiar aquí
```

O programáticamente:
```javascript
CONFIG.setActiveProfile('WEBOS_MPEGTS_DIRECT');
```

### Método 2: Modificar Valores Directos

```javascript
// En config.js
ACTIVE_PROFILE: null,  // Desactivar perfil
PLAYLIST_FORMAT: 'm3u_plus',
OUTPUT_FORMAT: 'mpegts'  // Cambiar aquí
```

## Helper Functions

### buildPlaylistUrl(username, password)

Construye la URL completa de la playlist usando la configuración actual.

```javascript
const url = CONFIG.buildPlaylistUrl('usuario', 'password');
// Retorna: 'http://iptv.ctvc.cl:80/playlist/usuario/password/m3u_plus?output=hls'
```

**Uso en el código:**
```javascript
// En app.js (ya implementado)
const url = CONFIG.buildPlaylistUrl(username, password);
```

### setActiveProfile(profileName)

Cambia el perfil activo programáticamente.

```javascript
CONFIG.setActiveProfile('WEBOS_MPEGTS_DIRECT');
```

### getActiveProfileInfo()

Obtiene información del perfil activo.

```javascript
const info = CONFIG.getActiveProfileInfo();
console.log(info.name, info.description);
```

## Troubleshooting

### Problema: "Solo audio sin video"

**Causa:** Codec de video no compatible con HLS nativo en webOS.

**Solución:**
1. Cambiar a perfil MPEGTS:
   ```javascript
   ACTIVE_PROFILE: 'WEBOS_MPEGTS_DIRECT'
   ```
2. O cambiar directamente:
   ```javascript
   OUTPUT_FORMAT: 'mpegts'
   ```

**Por qué funciona:** MPEGTS tiene mejor soporte de codecs y se reproduce con HLS.js que maneja codecs mejor que el reproductor nativo.

### Problema: "Algunos canales no cargan"

**Causa:** El servidor puede tener problemas con HLS para ciertos canales.

**Solución:**
1. Probar perfil MPEGTS:
   ```javascript
   ACTIVE_PROFILE: 'WEBOS_MPEGTS_DIRECT'
   ```
2. Verificar logs en consola para ver errores específicos

### Problema: "Playlist vacía o error al descargar"

**Causa:** URL mal formada o credenciales incorrectas.

**Solución:**
1. Verificar que `BASE_URL` sea correcta
2. Verificar credenciales
3. Usar `buildPlaylistUrl()` para construir la URL correctamente

## Relación con el Reproductor

El reproductor (`player.js`) y el adaptador (`webOSPlayerAdapter.js`) detectan automáticamente el formato del stream basándose en la URL:

- Si `output=hls`: Detecta como HLS (`.m3u8`)
- Si `output=mpegts`: Detecta como MPEGTS (`.ts`)

El adaptador selecciona automáticamente el método de reproducción:
- HLS nativo si es compatible
- HLS.js si es necesario (especialmente para MPEGTS)

## Mejores Prácticas

1. **Empezar con el perfil por defecto** (`WEBOS_HLS_COMPAT`)
2. **Si hay problemas, probar MPEGTS** (`WEBOS_MPEGTS_DIRECT`)
3. **Usar `buildPlaylistUrl()`** en lugar de construir URLs manualmente
4. **Documentar cambios** si modificas valores directamente
5. **Probar ambos formatos** si un canal específico da problemas

## Compatibilidad Hacia Atrás

El código mantiene compatibilidad con el uso anterior:

```javascript
// Código antiguo (aún funciona)
CONFIG.SERVER.PLAYLIST_PATH.replace('{username}', username)

// Código nuevo (recomendado)
CONFIG.buildPlaylistUrl(username, password)
```

`PLAYLIST_PATH` se genera automáticamente basado en la configuración actual.

## Referencias

- [HLS vs MPEGTS para IPTV](https://necroiptv.com/shop/knowledgebase/65/HLS-or-MPEGTS.html)
- [webOS Streaming Protocol](https://webostv.developer.lge.com/develop/specifications/streaming-protocol-drm)
- [Xtream Codes API Documentation](https://xtream-codes.com/)

