# Análisis del Reproductor IPTV - Estado Actual

## Fecha: 2024

## Estado Actual del Reproductor

### API Utilizada
- **HTML5 `<video>` element**: API principal para reproducción
- **HLS.js**: Biblioteca JavaScript como fallback para HLS/MPEGTS
- **No usa AVPlay**: No se está utilizando la API nativa AVPlay de webOS

### Manejo de URLs
- **Detección por extensión/patrón**: `detectFormat()` analiza la URL para determinar el tipo
- **Formatos soportados**: HLS (.m3u8), MPEGTS (.ts), MP4, DASH, RTMP, RTSP
- **Normalización**: Se normalizan URLs antes de reproducir

### Manejo de Codecs
- **Detección básica**: `checkSupportedCodecs()` verifica codecs soportados
- **Verificación de dimensiones**: `checkVideoDimensions()` detecta si hay video (width/height > 0)
- **Problema identificado**: La detección de "solo audio" es reactiva, no preventiva

## Problemas Identificados

### 1. No usa AVPlay de webOS
- **Impacto**: webOS tiene una API nativa (AVPlay) optimizada para IPTV que no se está utilizando
- **Solución**: Crear un adaptador que detecte webOS y use AVPlay cuando esté disponible

### 2. Configuración de MIME Types
- **Problema**: Los MIME types se configuran de forma genérica
- **Impacto**: Algunos streams pueden no ser reconocidos correctamente por el navegador
- **Solución**: Configurar MIME types específicos según el formato detectado

### 3. Detección de Codec Reactiva
- **Problema**: Solo detecta problemas de codec después de que el video empieza a reproducirse
- **Impacto**: El usuario ve "solo audio" antes de que se detecte el problema
- **Solución**: Implementar detección preventiva basada en metadata del stream

### 4. Fallback Limitado
- **Problema**: El fallback solo intenta HLS.js si falla el nativo
- **Impacto**: No hay múltiples estrategias de fallback
- **Solución**: Implementar una cadena de fallback más robusta

## Hipótesis sobre "Solo Audio"

### Causa Probable #1: MIME Type Incorrecto
- **Hipótesis**: El navegador no reconoce correctamente el tipo de contenido
- **Evidencia**: Algunos streams MPEGTS pueden requerir `video/mp2t` explícitamente
- **Solución**: Configurar MIME type correcto antes de asignar `src`

### Causa Probable #2: Codec de Video No Soportado
- **Hipótesis**: El stream contiene un codec de video que el navegador no puede decodificar
- **Evidencia**: webOS puede tener limitaciones en codecs soportados
- **Solución**: Usar HLS.js que tiene mejor soporte de codecs y puede transcode

### Causa Probable #3: Configuración de Video Element
- **Hipótesis**: Faltan atributos específicos de webOS en el elemento `<video>`
- **Evidencia**: webOS puede requerir configuraciones específicas
- **Solución**: Agregar atributos y configuraciones específicas de webOS

### Causa Probable #4: Stream MPEGTS Directo
- **Hipótesis**: Los streams MPEGTS directos (.ts) pueden no funcionar bien con HTML5 video nativo
- **Evidencia**: MPEGTS funciona mejor con HLS.js o como HLS
- **Solución**: Forzar uso de HLS.js para streams MPEGTS

## Recomendaciones

1. **Crear webOSPlayerAdapter**: Módulo centralizado para manejo de reproducción en webOS
2. **Mejorar detección de codecs**: Verificar codecs antes de reproducir
3. **Configurar MIME types correctamente**: Según formato detectado
4. **Implementar fallback robusto**: Múltiples estrategias de fallback
5. **Detección preventiva**: Verificar metadata antes de reproducir

