/**
 * Reproductor IPTV nativo integrado - Similar a SSIPTV
 * La aplicación actúa como reproductor nativo, usando el reproductor del sistema
 * y bibliotecas externas solo como fallback cuando sea necesario
 */
const Player = {
    // Referencias a elementos del DOM
    video: null,
    controls: null,
    loading: null,
    
    // Instancia de HLS.js (solo como fallback)
    hls: null,
    
    // Estado del reproductor
    isPlaying: false,
    controlsVisible: false,
    controlsTimer: null,
    
    // Lista de canales y posición actual
    channels: [],
    currentIndex: -1,
    
    // Input de número de canal
    channelNumberInput: '',
    channelNumberTimer: null,
    
    // Calidad actual
    currentQuality: 'AUTO',
    
    // Control de reintentos y timeouts
    loadTimeout: null,
    retryCount: 0,
    maxRetries: 3,
    retryTimer: null,
    videoCheckInterval: null,
    codecCheckInterval: null, // Interval para verificación agresiva de codec
    continuousVideoCheckInterval: null, // Verificación continua de video
    lastVideoTime: 0,
    stuckCheckCount: 0,
    currentChannelUrl: null,
    useNativePlayer: true, // Priorizar reproductor nativo
    hlsLevels: null, // Niveles HLS disponibles
    triedLevels: [], // Niveles ya probados para evitar loops
    
    /**
     * Inicializa el reproductor nativo
     * Usa webOSPlayerAdapter para configuración óptima en webOS
     */
    init() {
        const videoElement = document.getElementById('video-player');
        this.controls = document.getElementById('player-controls');
        this.loading = document.getElementById('player-loading');
        this.video = videoElement;
        
        // Inicializar adaptador webOS si está disponible
        if (typeof webOSPlayerAdapter !== 'undefined') {
            try {
                this.webOSAdapter = webOSPlayerAdapter.init(videoElement);
                console.log('webOSPlayerAdapter inicializado');
            } catch (error) {
                console.warn('Error al inicializar webOSPlayerAdapter:', error);
                this.webOSAdapter = null;
            }
        } else {
            console.warn('webOSPlayerAdapter no disponible, usando configuración básica');
            this.webOSAdapter = null;
        }
        
        // Configurar video nativo para máxima compatibilidad
        // Si tenemos el adaptador, usará su configuración, sino usar valores por defecto
        if (!this.webOSAdapter) {
            this.video.setAttribute('playsinline', '');
            this.video.setAttribute('webkit-playsinline', '');
            this.video.setAttribute('x5-playsinline', '');
            this.video.setAttribute('preload', 'auto');
            this.video.setAttribute('x-webkit-airplay', 'allow');
            this.video.setAttribute('controls', 'false');
            this.video.controls = false;
            this.video.setAttribute('crossorigin', 'anonymous');
        }
        
        // Verificar codecs soportados
        this.checkSupportedCodecs();
        
        this.setupEventListeners();
        this.currentQuality = Storage.getQuality();
        
        console.log('Reproductor IPTV nativo inicializado', {
            hasWebOSAdapter: !!this.webOSAdapter,
            isWebOS: this.webOSAdapter?.isWebOS || false
        });
    },
    
    /**
     * Configura los event listeners del reproductor
     */
    setupEventListeners() {
        // Eventos del video nativo
        this.video.addEventListener('playing', () => this.onPlaying());
        this.video.addEventListener('waiting', () => this.onBuffering());
        this.video.addEventListener('error', (e) => this.onError(e));
        this.video.addEventListener('timeupdate', () => this.updateProgress());
        this.video.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        this.video.addEventListener('loadstart', () => {
            console.log('Carga iniciada');
            this.showLoading();
        });
        this.video.addEventListener('canplay', () => {
            console.log('Video puede reproducirse');
        });
        this.video.addEventListener('canplaythrough', () => {
            console.log('Video puede reproducirse completamente');
            this.hideLoading();
        });
        
        // Botones de control
        document.getElementById('btn-back').addEventListener('click', () => this.goBack());
        document.getElementById('btn-play-pause').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('btn-prev-channel').addEventListener('click', () => this.previousChannel());
        document.getElementById('btn-next-channel').addEventListener('click', () => this.nextChannel());
        document.getElementById('btn-rewind').addEventListener('click', () => this.rewind());
        document.getElementById('btn-forward').addEventListener('click', () => this.forward());
        document.getElementById('btn-channel-list').addEventListener('click', () => this.openChannelList());
        document.getElementById('btn-quality').addEventListener('click', () => this.showQualitySelector());
        document.getElementById('btn-close-panel').addEventListener('click', () => this.closeChannelList());
        document.getElementById('btn-retry-channel').addEventListener('click', () => this.retryCurrentChannel());
        
        // Click en el video para mostrar/ocultar controles
        this.video.addEventListener('click', () => this.toggleControls());
        
        // Escuchar teclas específicas del reproductor
        document.addEventListener('tvKeyPress', (e) => this.handlePlayerKeys(e.detail));
    },
    
    /**
     * Carga y reproduce un canal - Método principal nativo
     * Si CONFIG.PLAYER.FORCE_VLC está activado, abre el canal en VLC
     * @param {Array} channels - Lista de canales
     * @param {number} index - Índice del canal a reproducir
     */
    loadChannel(channels, index) {
        this.channels = channels;
        this.currentIndex = index;
        
        const channel = channels[index];
        if (!channel) return;
        
        // Limpiar timers y estados anteriores
        this.clearAllTimers();
        this.hideErrorNotification();
        this.retryCount = 0;
        this.stuckCheckCount = 0;
        this.lastVideoTime = 0;
        this.triedLevels = []; // Resetear niveles probados
        
        // Validar y normalizar URL
        if (!channel.url) {
            console.error('Canal sin URL:', channel);
            this.showError('El canal no tiene URL válida');
            return;
        }
        
        let url = channel.url.trim();
        
        // Normalizar URL
        if (!url.match(/^https?:\/\//i) && !url.match(/^rtmp?:\/\//i) && !url.match(/^rtsp:\/\//i)) {
            // Si parece una URL pero le falta protocolo
            if (url.includes('.') && !url.startsWith('/')) {
                url = 'http://' + url;
                console.log('URL normalizada (agregado http://):', url);
            }
        }
        
        if (!this.isValidUrl(url)) {
            console.error('URL inválida:', url);
            this.showError('URL del canal no válida: ' + url.substring(0, 50));
            return;
        }
        
        console.log(`Cargando canal ${channel.number}: ${channel.name}`);
        console.log('URL:', url);
        
        // CRÍTICO: Forzar siempre HLS.js si está configurado
        // Esto asegura mejor soporte de codecs y video garantizado
        if (CONFIG.PLAYER && (CONFIG.PLAYER.FORCE_HLSJS_ALWAYS || CONFIG.PLAYER.USE_EMBEDDED_VLC_MODE)) {
            console.log('FORZANDO HLS.js - Modo embebido tipo VLC (garantiza video + audio)');
            this.loadWithEmbeddedVLCMode(url, channel);
            return;
        }
        
        // Mostrar loading
        this.showLoading();
        
        // Actualizar información del canal
        document.getElementById('channel-number-display').textContent = channel.number;
        document.getElementById('channel-name-display').textContent = channel.name;
        
        this.currentChannelUrl = url;
        
        // Timeout para carga (20 segundos)
        this.loadTimeout = setTimeout(() => {
            if (this.loading.style.display !== 'none') {
                console.warn('Timeout al cargar canal');
                this.handleLoadTimeout();
            }
        }, 20000);
        
        // Si FORCE_HLSJS_ALWAYS está activado, nunca usar nativo
        if (CONFIG.PLAYER && CONFIG.PLAYER.FORCE_HLSJS_ALWAYS) {
            console.log('FORCE_HLSJS_ALWAYS activado - usando HLS.js directamente');
            this.loadWithHLSJSAggressive(url);
        } else {
            // Intentar cargar con reproductor nativo primero (solo si no está forzado HLS.js)
            this.loadWithNativePlayer(url);
        }
        
        // Guardar último canal
        Storage.saveLastChannel(index);
        
        // Mostrar controles
        this.showControls();
        
        // Iniciar verificación de video stuck
        this.startVideoStuckCheck();
    },
    
    /**
     * Carga el stream con modo embebido tipo VLC (mejor soporte de codecs)
     * Usa HLS.js con configuraciones agresivas para asegurar video + audio
     * @param {string} url - URL del stream
     * @param {Object} channel - Información del canal
     */
    loadWithEmbeddedVLCMode(url, channel) {
        console.log('Cargando con modo embebido tipo VLC:', url);
        
        // Actualizar información del canal en la UI
        if (document.getElementById('channel-number-display')) {
            document.getElementById('channel-number-display').textContent = channel.number;
        }
        if (document.getElementById('channel-name-display')) {
            document.getElementById('channel-name-display').textContent = channel.name;
        }
        
        // Guardar URL actual
        this.currentChannelUrl = url;
        
        // Mostrar loading
        this.showLoading();
        
        // Limpiar instancias anteriores
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        // Limpiar video anterior completamente
        this.video.pause();
        this.video.src = '';
        this.video.load();
        
        // Forzar uso de HLS.js con configuraciones agresivas para codecs
        this.loadWithHLSJSAggressive(url);
        
        // Guardar último canal
        Storage.saveLastChannel(this.currentIndex);
        
        // Mostrar controles
        this.showControls();
        
        // Iniciar verificación agresiva de codec
        this.startAggressiveCodecCheck();
    },
    
    /**
     * Carga con HLS.js usando configuraciones ULTRA agresivas para codecs
     * Garantiza video + audio en todos los canales
     * @param {string} url - URL del stream
     */
    loadWithHLSJSAggressive(url) {
        if (typeof Hls === 'undefined' || !Hls.isSupported()) {
            console.error('HLS.js no disponible - CRÍTICO: No se puede garantizar video');
            this.showError('HLS.js no está disponible. El reproductor requiere HLS.js para funcionar correctamente.');
            return;
        }
        
        console.log('🔴 MODO CRÍTICO: HLS.js con configuraciones ULTRA agresivas (GARANTIZA VIDEO)');
        this.useNativePlayer = false;
        this.retryCount = 0; // Resetear contador de reintentos
        
        // Destruir instancia anterior completamente
        if (this.hls) {
            try {
                this.hls.destroy();
            } catch (e) {
                console.warn('Error al destruir HLS anterior:', e);
            }
            this.hls = null;
        }
        
        // Configuración ULTRA agresiva de HLS.js - GARANTIZA VIDEO
        // Configurado específicamente para asegurar que siempre haya video, no solo audio
        this.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            
            // Buffering ULTRA optimizado para codecs complejos
            backBufferLength: 120,
            maxBufferLength: 90,
            maxMaxBufferLength: 180,
            maxBufferSize: 180 * 1000 * 1000, // 180MB - buffer grande para codecs complejos
            maxBufferHole: 0.3, // Más estricto para detectar problemas
            
            // Timeouts MUY largos para codecs complejos
            maxFragLoadingTimeOut: 45000,
            fragLoadingTimeOut: 45000,
            manifestLoadingTimeOut: 30000,
            levelLoadingTimeOut: 30000,
            
            // Configuración de codecs ULTRA agresiva
            xhrSetup: (xhr, url) => {
                xhr.withCredentials = false;
                // Headers adicionales para mejor compatibilidad
                xhr.setRequestHeader('Accept', '*/*');
                xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
                xhr.setRequestHeader('Accept-Language', '*');
                // Timeout más largo
                xhr.timeout = 45000;
            },
            
            // Configuración para mejor compatibilidad de codecs
            abrEwmaDefaultEstimate: 500000,
            abrBandWidthFactor: 0.95,
            abrBandWidthUpFactor: 0.7,
            maxStarvationDelay: 6,
            maxLoadingDelay: 6,
            minAutoBitrate: 0,
            emeEnabled: false,
            
            // Forzar codecs compatibles - SIEMPRE priorizar H.264 y AAC
            capLevelToPlayerSize: false,
            startLevel: CONFIG.PLAYER?.EMBEDDED?.FORCE_LEVEL ?? -1, // Usar nivel forzado si está configurado
            testBandwidth: true,
            progressive: false,
            codecSwitching: true,
            
            // Configuración adicional para codecs (modo VLC ULTRA)
            preferManagedMediaSource: false,
            maxAudioFramesDrift: 1,
            forceKeyFrameOnDiscontinuity: true,
            
            // Configuración específica para GARANTIZAR video + audio
            renderTextTracks: false,
            renderNatively: false,
            
            // Forzar decodificación de video - CRÍTICO
            enableStreaming: true,
            autoStartLoad: true,
            startPosition: -1,
            
            // Configuración de codecs preferidos - H.264 SIEMPRE
            // Priorizar H.264 sobre otros codecs
            preferCodec: 'avc1.42e01e', // H.264 Baseline - más compatible
            maxCodecSupport: {
                'video/mp4': 'avc1.42e01e',
                'video/webm': 'vp8'
            },
            
            // Configuración adicional para asegurar video
            // Forzar que siempre intente decodificar video
            debug: false,
            enableSoftwareAES: true,
            drmSystemOptions: {}
        });
        
        this.hls.loadSource(url);
        this.hls.attachMedia(this.video);
        
        // Eventos de HLS.js con manejo ULTRA agresivo de errores
        this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log('✅ HLS.js manifest cargado (MODO CRÍTICO), niveles:', data.levels.length);
            this.hlsLevels = data.levels;
            
            // Verificar codecs disponibles - CRÍTICO
            if (data.levels && data.levels.length > 0) {
                console.log('📊 Análisis de niveles disponibles:');
                data.levels.forEach((level, index) => {
                    const hasH264 = level.codecSet && level.codecSet.includes('avc1');
                    const hasAAC = level.audioCodec && level.audioCodec.includes('mp4a');
                    console.log(`  Nivel ${index}: codecs=${level.codecSet || 'N/A'}, H.264=${hasH264}, AAC=${hasAAC}, ${level.width}x${level.height}, bitrate=${level.bitrate}`);
                    
                    // Priorizar niveles con codec H.264
                    if (hasH264) {
                        console.log(`  ✅ Nivel ${index} usa H.264 - ÓPTIMO para video`);
                    } else {
                        console.warn(`  ⚠️ Nivel ${index} NO usa H.264 - puede tener problemas`);
                    }
                });
            } else {
                console.warn('⚠️ No se encontraron niveles en el manifest');
            }
            
            // Seleccionar mejor nivel (priorizar H.264) - CRÍTICO
            const selectedLevel = this.selectBestLevel(data.levels);
            console.log(`🎯 Nivel seleccionado: ${selectedLevel} (prioriza H.264 para garantizar video)`);
            
            // Si hay nivel forzado, usarlo
            if (CONFIG.PLAYER?.EMBEDDED?.FORCE_LEVEL !== null && CONFIG.PLAYER?.EMBEDDED?.FORCE_LEVEL !== undefined) {
                const forcedLevel = CONFIG.PLAYER.EMBEDDED.FORCE_LEVEL;
                if (forcedLevel >= 0 && forcedLevel < data.levels.length) {
                    this.hls.currentLevel = forcedLevel;
                    console.log(`🔒 Nivel forzado: ${forcedLevel}`);
                }
            }
            
            this.applyQualitySetting();
            
            // Esperar un momento para que el video se prepare
            setTimeout(() => {
                const playPromise = this.video.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('▶️ Reproducción HLS.js iniciada (MODO CRÍTICO - GARANTIZA VIDEO)');
                        
                        // Verificación INMEDIATA de codec (más rápido)
                        setTimeout(() => {
                            this.aggressiveCodecCheck();
                        }, 2000); // Verificar después de 2 segundos
                        
                        // Verificación continua si está activada
                        if (CONFIG.PLAYER?.EMBEDDED?.CONTINUOUS_VIDEO_CHECK) {
                            this.startContinuousVideoCheck();
                        }
                    }).catch(err => {
                        console.error('❌ Error al reproducir con HLS.js:', err);
                        // Reintentar inmediatamente
                        if (this.retryCount < (CONFIG.PLAYER?.EMBEDDED?.MAX_CODEC_RETRIES || 5)) {
                            this.retryCount++;
                            console.log(`🔄 Reintentando reproducción (${this.retryCount}/${CONFIG.PLAYER?.EMBEDDED?.MAX_CODEC_RETRIES || 5})`);
                            setTimeout(() => {
                                this.video.play().catch(() => {
                                    this.handlePlayError(err);
                                });
                            }, 1000);
                        } else {
                            this.handlePlayError(err);
                        }
                    });
                }
            }, 300); // Reducido a 300ms para iniciar más rápido
        });
        
        // Manejo agresivo de errores
        this.hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('Error HLS.js (modo VLC embebido):', data);
            
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        if (this.retryCount < (CONFIG.PLAYER?.EMBEDDED?.MAX_CODEC_RETRIES || 3)) {
                            this.retryCount++;
                            console.log(`Reintentando HLS.js (${this.retryCount}/${CONFIG.PLAYER?.EMBEDDED?.MAX_CODEC_RETRIES || 3})`);
                            setTimeout(() => {
                                this.hls.startLoad();
                            }, 1000 * this.retryCount);
                        } else {
                            this.handleNetworkError('Error de conexión. El canal no está disponible.');
                        }
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error('❌ Error de codec detectado (MEDIA_ERROR) - iniciando recuperación agresiva');
                        // Usar recuperación agresiva en lugar de solo recoverMediaError
                        if (this.retryCount < (CONFIG.PLAYER?.EMBEDDED?.MAX_CODEC_RETRIES || 5)) {
                            // Intentar recuperación agresiva (cambiar nivel, recargar, etc.)
                            this.handleAudioOnlyProblem();
                            // También intentar recoverMediaError de HLS.js
                            try {
                                this.hls.recoverMediaError();
                            } catch (e) {
                                console.warn('Error al llamar recoverMediaError:', e);
                            }
                        } else {
                            console.error('❌ Máximo de reintentos alcanzado para error de codec');
                            this.handleMediaError('Error al decodificar el video. El codec no es compatible después de múltiples intentos.');
                        }
                        break;
                    default:
                        this.handleFatalError('Error fatal en la reproducción.');
                        break;
                }
            }
        });
        
        // Evento cuando se carga un fragmento
        this.hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
            // Verificar que el fragmento tenga video
            if (data.frag && data.frag.type === 'main') {
                // Fragmento de video cargado correctamente
            }
        });
    },
    
    /**
     * Selecciona el mejor nivel basado en codecs (prioriza H.264) - CRÍTICO
     * Garantiza que se seleccione un nivel con codec compatible que muestre video
     * @param {Array} levels - Niveles disponibles
     * @returns {number} Índice del nivel seleccionado
     */
    selectBestLevel(levels) {
        if (!levels || levels.length === 0) {
            console.warn('⚠️ No hay niveles disponibles');
            return -1;
        }
        
        let bestLevel = 0;
        let bestScore = -1;
        const h264Levels = [];
        
        // Primera pasada: encontrar todos los niveles con H.264
        levels.forEach((level, index) => {
            if (level.codecSet && level.codecSet.includes('avc1')) {
                h264Levels.push({ index, level, score: 0 });
            }
        });
        
        console.log(`📊 Niveles con H.264 encontrados: ${h264Levels.length} de ${levels.length}`);
        
        // Si hay niveles con H.264, priorizarlos
        const levelsToCheck = h264Levels.length > 0 ? h264Levels.map(h => ({ index: h.index, level: h.level })) : levels.map((l, i) => ({ index: i, level: l }));
        
        levelsToCheck.forEach(({ index, level }) => {
            let score = 0;
            
            // CRÍTICO: Priorizar H.264 (máxima prioridad)
            if (level.codecSet && level.codecSet.includes('avc1')) {
                score += 1000; // Puntuación muy alta para H.264
                console.log(`  ✅ Nivel ${index}: H.264 detectado - SCORE ALTO`);
            } else {
                console.warn(`  ⚠️ Nivel ${index}: NO tiene H.264 - score bajo`);
            }
            
            // Priorizar AAC para audio
            if (level.audioCodec && level.audioCodec.includes('mp4a')) {
                score += 100;
            }
            
            // Priorizar resoluciones estándar (pero menos importante que codec)
            if (level.width && level.height) {
                if (level.width === 1920 && level.height === 1080) score += 30;
                else if (level.width === 1280 && level.height === 720) score += 20;
                else if (level.width === 854 && level.height === 480) score += 10;
            }
            
            // Priorizar bitrates razonables
            if (level.bitrate) {
                if (level.bitrate >= 1000000 && level.bitrate <= 5000000) score += 20;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestLevel = index;
            }
        });
        
        if (bestLevel >= 0 && this.hls) {
            this.hls.currentLevel = bestLevel;
            const selectedLevel = levels[bestLevel];
            console.log(`🎯 Nivel seleccionado: ${bestLevel} (score: ${bestScore})`);
            console.log(`   Codec: ${selectedLevel.codecSet || 'N/A'}, Resolución: ${selectedLevel.width}x${selectedLevel.height}`);
            
            // Verificar que el nivel seleccionado tenga H.264
            if (selectedLevel.codecSet && selectedLevel.codecSet.includes('avc1')) {
                console.log('   ✅ Nivel seleccionado usa H.264 - VIDEO GARANTIZADO');
            } else {
                console.warn('   ⚠️ Nivel seleccionado NO usa H.264 - puede tener problemas');
            }
        }
        
        return bestLevel;
    },
    
    /**
     * Verificación ULTRA agresiva de codec - GARANTIZA VIDEO
     * Detecta problemas inmediatamente y los corrige automáticamente
     */
    aggressiveCodecCheck() {
        if (!this.video) return;
        
        const health = webOSPlayerAdapter?.checkPlaybackHealth?.(this.video) || this.checkVideoDimensionsBasic();
        
        console.log('🔍 Verificación CRÍTICA de codec:', {
            hasVideo: health.hasVideo,
            hasAudio: health.hasAudio,
            dimensions: `${health.videoWidth}x${health.videoHeight}`,
            readyState: health.readyState,
            currentTime: health.currentTime
        });
        
        // CRÍTICO: Si no hay video pero hay audio, es un problema de codec
        if (!health.hasVideo && health.hasAudio && health.readyState >= 2) {
            console.error('❌ PROBLEMA CRÍTICO: Solo audio detectado - SIN VIDEO');
            
            // Recuperación INMEDIATA y agresiva
            if (CONFIG.PLAYER?.EMBEDDED?.AUTO_RETRY_ON_AUDIO_ONLY) {
                this.handleAudioOnlyProblem();
            } else {
                this.showError('El canal solo reproduce audio. Intentando recuperación automática...');
                this.handleAudioOnlyProblem();
            }
        } else if (health.hasVideo && health.hasAudio) {
            console.log('✅ Video + Audio funcionando correctamente');
            this.hideErrorNotification();
        } else if (!health.hasVideo && !health.hasAudio && health.currentTime > 5) {
            console.warn('⚠️ Sin video ni audio después de 5 segundos - problema de conexión o codec');
            if (this.retryCount < (CONFIG.PLAYER?.EMBEDDED?.MAX_CODEC_RETRIES || 5)) {
                this.handleAudioOnlyProblem();
            }
        }
    },
    
    /**
     * Maneja el problema de solo audio - RECUPERACIÓN AGRESIVA
     */
    handleAudioOnlyProblem() {
        if (this.retryCount >= (CONFIG.PLAYER?.EMBEDDED?.MAX_CODEC_RETRIES || 5)) {
            console.error('❌ Máximo de reintentos alcanzado');
            this.showError('No se pudo recuperar el video. El codec no es compatible.');
            return;
        }
        
        this.retryCount++;
        console.log(`🔄 RECUPERACIÓN AGRESIVA (intento ${this.retryCount}/${CONFIG.PLAYER?.EMBEDDED?.MAX_CODEC_RETRIES || 5})`);
        this.showError(`Recuperando video... (${this.retryCount}/${CONFIG.PLAYER?.EMBEDDED?.MAX_CODEC_RETRIES || 5})`);
        
        if (!this.hls || !this.hlsLevels || this.hlsLevels.length === 0) {
            console.error('❌ HLS o niveles no disponibles para recuperación');
            return;
        }
        
        // Estrategia 1: Cambiar a otro nivel con H.264
        if (CONFIG.PLAYER?.EMBEDDED?.TRY_ALL_LEVELS_ON_FAILURE && this.hlsLevels.length > 1) {
            const currentLevel = this.hls.currentLevel >= 0 ? this.hls.currentLevel : 0;
            
            // Buscar siguiente nivel con H.264
            let nextH264Level = -1;
            for (let i = 1; i <= this.hlsLevels.length; i++) {
                const testIndex = (currentLevel + i) % this.hlsLevels.length;
                const level = this.hlsLevels[testIndex];
                if (level.codecSet && level.codecSet.includes('avc1')) {
                    nextH264Level = testIndex;
                    break;
                }
            }
            
            if (nextH264Level >= 0 && nextH264Level !== currentLevel) {
                console.log(`🔄 Cambiando a nivel ${nextH264Level} (tiene H.264)`);
                this.hls.currentLevel = nextH264Level;
            } else {
                // Si no hay otro nivel con H.264, probar el siguiente nivel
                const newLevel = (currentLevel + 1) % this.hlsLevels.length;
                console.log(`🔄 Cambiando a nivel ${newLevel} (siguiente disponible)`);
                this.hls.currentLevel = newLevel;
            }
        }
        
        // Estrategia 2: Recargar el stream completamente
        setTimeout(() => {
            if (this.hls) {
                console.log('🔄 Recargando stream completamente...');
                this.hls.stopLoad();
                setTimeout(() => {
                    this.hls.startLoad();
                }, 500);
            }
        }, 1000);
        
        // Estrategia 3: Si sigue fallando, intentar recargar el video element
        setTimeout(() => {
            if (this.video && (this.video.videoWidth === 0 || this.video.videoHeight === 0)) {
                console.log('🔄 Reiniciando elemento video...');
                this.video.load();
                const playPromise = this.video.play();
                if (playPromise) {
                    playPromise.catch(err => {
                        console.error('Error al reproducir después de reload:', err);
                    });
                }
            }
        }, 3000);
    },
    
    /**
     * Inicia verificación continua de video (cada 2 segundos)
     */
    startContinuousVideoCheck() {
        if (this.continuousVideoCheckInterval) {
            clearInterval(this.continuousVideoCheckInterval);
        }
        
        console.log('🔄 Iniciando verificación continua de video (cada 2 segundos)');
        
        this.continuousVideoCheckInterval = setInterval(() => {
            if (this.video && !this.video.paused) {
                this.aggressiveCodecCheck();
            }
        }, 2000); // Cada 2 segundos
    },
    
    /**
     * Verificación básica de dimensiones (fallback)
     */
    checkVideoDimensionsBasic() {
        return {
            hasVideo: this.video.videoWidth > 0 && this.video.videoHeight > 0,
            hasAudio: !this.video.muted && this.video.volume > 0,
            videoWidth: this.video.videoWidth,
            videoHeight: this.video.videoHeight
        };
    },
    
    /**
     * Inicia verificación agresiva de codec
     */
    startAggressiveCodecCheck() {
        if (this.codecCheckInterval) {
            clearInterval(this.codecCheckInterval);
        }
        
        // Si la verificación continua está activada, usarla en lugar del intervalo normal
        if (CONFIG.PLAYER?.EMBEDDED?.CONTINUOUS_VIDEO_CHECK) {
            this.startContinuousVideoCheck();
            return;
        }
        
        // Verificación periódica (más lenta que la continua)
        const checkInterval = CONFIG.PLAYER?.EMBEDDED?.CODEC_DETECTION_TIMEOUT || 3000;
        
        this.codecCheckInterval = setInterval(() => {
            this.aggressiveCodecCheck();
        }, checkInterval);
    },
    
    /**
     * Abre el stream en VLC como reproductor externo (LEGACY - mantenido para compatibilidad)
     * @param {string} url - URL del stream
     * @param {Object} channel - Información del canal
     */
    openInVLC(url, channel) {
        console.log('Abriendo en VLC:', url);
        
        // Actualizar información del canal en la UI
        if (document.getElementById('channel-number-display')) {
            document.getElementById('channel-number-display').textContent = channel.number;
        }
        if (document.getElementById('channel-name-display')) {
            document.getElementById('channel-name-display').textContent = channel.name;
        }
        
        // Mostrar mensaje informativo
        this.showError('Abriendo en VLC...');
        
        // Guardar URL actual
        this.currentChannelUrl = url;
        
        // Intentar diferentes métodos para abrir VLC
        
        // Método 1: Usar API de webOS Luna Service para lanzar aplicación
        if (typeof webOS !== 'undefined' && webOS.service && webOS.service.request) {
            console.log('Intentando abrir VLC usando webOS Luna Service');
            
            // Intentar lanzar VLC con la URL como parámetro
            const vlcAppId = CONFIG.PLAYER?.VLC_APP_ID || 'com.videolan.vlc';
            
            webOS.service.request('luna://com.webos.applicationManager', {
                method: 'launch',
                parameters: {
                    id: vlcAppId,
                    params: {
                        uri: url,
                        target: url
                    }
                },
                onSuccess: (response) => {
                    console.log('VLC lanzado exitosamente:', response);
                    this.showError('VLC abierto. El canal se está reproduciendo en VLC.');
                    // Ocultar mensaje después de 5 segundos
                    setTimeout(() => {
                        this.hideErrorNotification();
                    }, 5000);
                },
                onFailure: (error) => {
                    console.error('Error al lanzar VLC con webOS API:', error);
                    console.log('Intentando método alternativo...');
                    // Intentar método alternativo
                    this.openInVLCAlternative(url);
                }
            });
            
            // También intentar con método de URI directa
            setTimeout(() => {
                this.tryVLCUriMethod(url);
            }, 500);
        } else {
            // Método alternativo si no hay API de webOS
            console.log('API de webOS no disponible, usando método alternativo');
            this.openInVLCAlternative(url);
        }
    },
    
    /**
     * Intenta abrir VLC usando método de URI directa
     * @param {string} url - URL del stream
     */
    tryVLCUriMethod(url) {
        // En webOS, algunas aplicaciones pueden abrirse con URI schemes
        // Intentar con diferentes formatos
        
        // Formato 1: vlc://url
        const vlcProtocol = CONFIG.PLAYER?.VLC_PROTOCOL || 'vlc://';
        const vlcUrl1 = `${vlcProtocol}${url}`;
        
        // Formato 2: Intentar con window.location (puede funcionar en algunos casos)
        try {
            // Crear un iframe oculto para intentar abrir la URL
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = vlcUrl1;
            document.body.appendChild(iframe);
            
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
            
            console.log('Intentado abrir con protocolo VLC:', vlcUrl1);
        } catch (error) {
            console.error('Error con método de URI:', error);
        }
    },
    
    /**
     * Método alternativo para abrir VLC (usando protocolo o window.open)
     * @param {string} url - URL del stream
     */
    openInVLCAlternative(url) {
        console.log('Intentando método alternativo para abrir VLC');
        
        // Método 2: Intentar con protocolo vlc://
        const vlcProtocol = CONFIG.PLAYER?.VLC_PROTOCOL || 'vlc://';
        const vlcUrl = `${vlcProtocol}${url}`;
        
        // Intentar abrir con protocolo VLC
        try {
            // Crear un enlace temporal y hacer click
            const link = document.createElement('a');
            link.href = vlcUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Protocolo VLC intentado:', vlcUrl);
            this.showError('Intentando abrir VLC. Si no se abre, VLC puede no estar instalado.');
            
            // Si el protocolo falla, intentar con window.open
            setTimeout(() => {
                this.openInVLCFallback(url);
            }, 1000);
        } catch (error) {
            console.error('Error con protocolo VLC:', error);
            this.openInVLCFallback(url);
        }
    },
    
    /**
     * Método de fallback: usar window.open o mostrar URL
     * @param {string} url - URL del stream
     */
    openInVLCFallback(url) {
        console.log('Usando método de fallback para VLC');
        
        // Método 3: Intentar window.open (puede funcionar en algunos navegadores)
        try {
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
                console.log('URL abierta en nueva ventana');
                this.showError('URL abierta. Copia la URL y ábrela en VLC manualmente si es necesario.');
            } else {
                // Si window.open falla (bloqueado), mostrar URL para copiar
                this.showVLCUrlDialog(url);
            }
        } catch (error) {
            console.error('Error con window.open:', error);
            this.showVLCUrlDialog(url);
        }
    },
    
    /**
     * Muestra un diálogo con la URL para copiar manualmente
     * @param {string} url - URL del stream
     */
    showVLCUrlDialog(url) {
        // Crear diálogo con la URL
        const dialog = document.createElement('div');
        dialog.id = 'vlc-url-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            z-index: 10000;
            max-width: 80%;
            text-align: center;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin-top: 0;">Abrir en VLC</h3>
            <p>Para reproducir este canal en VLC:</p>
            <p style="font-size: 12px; word-break: break-all; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin: 15px 0;">
                ${url}
            </p>
            <p>1. Copia la URL arriba</p>
            <p>2. Abre VLC</p>
            <p>3. Ve a Medios → Abrir ubicación de red</p>
            <p>4. Pega la URL y presiona Reproducir</p>
            <button id="vlc-dialog-close" style="
                margin-top: 20px;
                padding: 10px 20px;
                background: #0078d4;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            ">Cerrar</button>
        `;
        
        document.body.appendChild(dialog);
        
        // Botón para cerrar
        document.getElementById('vlc-dialog-close').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Cerrar con ESC
        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                if (document.body.contains(dialog)) {
                    document.body.removeChild(dialog);
                }
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
        
        // Intentar copiar URL al portapapeles al hacer click en la URL
        const urlElements = dialog.querySelectorAll('p');
        const urlElement = urlElements[1]; // El segundo <p> contiene la URL
        if (urlElement) {
            urlElement.style.cursor = 'pointer';
            urlElement.title = 'Click para copiar';
            const originalText = urlElement.textContent;
            urlElement.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(url);
                    urlElement.textContent = '¡URL copiada al portapapeles!';
                    setTimeout(() => {
                        urlElement.textContent = originalText;
                    }, 2000);
                } catch (error) {
                    console.error('Error al copiar:', error);
                    // Fallback: seleccionar texto
                    const range = document.createRange();
                    range.selectNodeContents(urlElement);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            });
        }
    },
    
    /**
     * Carga con reproductor nativo (método principal)
     * Usa webOSPlayerAdapter para determinar el método óptimo de reproducción
     * @param {string} url - URL del stream
     */
    loadWithNativePlayer(url) {
        // Limpiar y normalizar URL
        url = url.trim();
        console.log('Intentando reproducir con reproductor nativo:', url);
        this.useNativePlayer = true;
        
        // Limpiar instancias anteriores
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        // Limpiar video anterior completamente
        this.video.pause();
        this.video.src = '';
        this.video.load();
        
        // Usar webOSPlayerAdapter si está disponible para mejor detección
        let streamConfig = null;
        if (this.webOSAdapter) {
            try {
                streamConfig = webOSPlayerAdapter.prepareStream(url);
                console.log('Configuración de stream (webOSAdapter):', streamConfig);
                
                // Configurar elemento video con el adaptador
                webOSPlayerAdapter.configureVideoElement(this.video, streamConfig.streamInfo);
                
                // Si el adaptador recomienda HLS.js, usarlo directamente
                if (streamConfig.requiresHLSJS || streamConfig.playbackMethod === 'hlsjs') {
                    console.log('webOSAdapter recomienda HLS.js');
                    this.loadWithHLSJS(url);
                    return;
                }
            } catch (error) {
                console.warn('Error usando webOSPlayerAdapter:', error);
                // Continuar con método tradicional
            }
        }
        
        // Método tradicional si no hay adaptador o falla
        const format = this.detectFormat(url);
        console.log('Formato detectado:', format, 'URL:', url.substring(0, 100));
        
        // Para MPEGTS, usar HLS.js directamente para mejor soporte de codecs
        if (format === 'ts') {
            console.log('Reproducción MPEGTS con HLS.js (mejor soporte de codecs)');
            // HLS.js maneja mejor los codecs de MPEGTS y asegura video y audio
            this.loadWithHLSJS(url);
        } else if (format === 'hls') {
            // Para WebOS/LG TV, el reproductor nativo soporta HLS muy bien
            // Verificar si el navegador soporta HLS nativamente
            const supportsHLS = this.video.canPlayType('application/vnd.apple.mpegurl') || 
                                this.video.canPlayType('application/x-mpegURL') ||
                                this.isWebOS();
            
            if (supportsHLS) {
                // Usar reproductor nativo HLS
                console.log('Usando reproductor HLS nativo del sistema');
                
                // Configurar tipo MIME explícitamente
                this.video.setAttribute('type', 'application/vnd.apple.mpegurl');
                this.video.src = url;
                this.video.load();
                
                // Esperar un momento antes de intentar reproducir
                setTimeout(() => {
                    const playPromise = this.video.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log('Reproducción nativa HLS iniciada');
                            
                            // Verificar dimensiones después de 3 segundos
                            setTimeout(() => {
                                if (this.video.videoWidth === 0 && this.video.videoHeight === 0) {
                                    console.warn('Video sin dimensiones - problema de codec, cambiando a HLS.js');
                                    this.loadWithHLSJS(url);
                                }
                            }, 3000);
                        }).catch((error) => {
                            console.error('Error al reproducir nativo HLS:', error);
                            // Fallback a HLS.js después de 2 segundos
                            setTimeout(() => {
                                this.loadWithHLSJS(url);
                            }, 2000);
                        });
                    }
                }, 500);
            } else {
                // Fallback a HLS.js si no hay soporte nativo
                console.log('HLS nativo no soportado, usando HLS.js');
                this.loadWithHLSJS(url);
            }
        } else if (format === 'mp4') {
            // Reproducción directa para MP4
            console.log('Reproducción directa MP4 nativa');
            this.video.setAttribute('type', 'video/mp4');
            this.video.src = url;
            this.video.load();
            
            setTimeout(() => {
                const playPromise = this.video.play();
                if (playPromise !== undefined) {
                    playPromise.catch((error) => {
                        console.error('Error al reproducir MP4:', error);
                        this.handlePlayError(error);
                    });
                }
            }, 500);
        } else {
            // Intentar reproducción directa como último recurso
            console.log('Intentando reproducción directa genérica');
            this.video.src = url;
            this.video.load();
            
            setTimeout(() => {
                const playPromise = this.video.play();
                if (playPromise !== undefined) {
                    playPromise.catch((error) => {
                        console.error('Error al reproducir:', error);
                        // Si falla, intentar con HLS.js
                        if (format === 'hls' || url.includes('m3u8')) {
                            this.loadWithHLSJS(url);
                        } else {
                            this.handlePlayError(error);
                        }
                    });
                }
            }, 500);
        }
    },
    
    /**
     * Carga con HLS.js (fallback)
     * @param {string} url - URL del stream
     */
    loadWithHLSJS(url) {
        if (typeof Hls === 'undefined' || !Hls.isSupported()) {
            console.error('HLS.js no disponible');
            this.showError('El formato HLS no es compatible con este dispositivo');
            return;
        }
        
        console.log('Usando HLS.js como fallback');
        this.useNativePlayer = false;
        
        // Destruir instancia anterior
        if (this.hls) {
            this.hls.destroy();
        }
        
        this.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 2,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 3,
            maxFragLoadingTimeOut: 20000,
            fragLoadingTimeOut: 20000,
            manifestLoadingTimeOut: 10000,
            levelLoadingTimeOut: 10000,
            xhrSetup: (xhr, url) => {
                xhr.withCredentials = false;
            },
            // Configuración para mejor compatibilidad de codecs
            abrEwmaDefaultEstimate: 500000,
            abrBandWidthFactor: 0.95,
            abrBandWidthUpFactor: 0.7,
            maxStarvationDelay: 4,
            maxLoadingDelay: 4,
            minAutoBitrate: 0,
            emeEnabled: false,
            // Forzar codecs compatibles - priorizar H.264 y AAC
            capLevelToPlayerSize: false,
            startLevel: -1,
            // Mejorar detección de codecs
            testBandwidth: true,
            progressive: false,
            // Configuración de codecs preferidos
            codecSwitching: true,
            // Forzar codecs compatibles para asegurar video y audio
            preferManagedMediaSource: false,
            // Configuración adicional para codecs
            maxAudioFramesDrift: 1,
            maxBufferHole: 0.5,
            // Asegurar que se use el codec de video correcto
            forceKeyFrameOnDiscontinuity: true
        });
        
        this.hls.loadSource(url);
        this.hls.attachMedia(this.video);
        
        this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log('HLS.js manifest cargado, niveles:', data.levels.length);
            this.hlsLevels = data.levels;
            
            // Verificar codecs disponibles
            if (data.levels && data.levels.length > 0) {
                data.levels.forEach((level, index) => {
                    console.log(`Nivel ${index}: codecs=${level.codecSet || 'N/A'}, width=${level.width}, height=${level.height}`);
                });
            }
            
            this.applyQualitySetting();
            
            // Esperar un momento para que el video se prepare
            setTimeout(() => {
                const playPromise = this.video.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('Reproducción HLS.js iniciada');
                        // Verificar dimensiones después de 2 segundos
                        setTimeout(() => {
                            this.checkVideoDimensions();
                        }, 2000);
                    }).catch(err => {
                        console.error('Error al reproducir con HLS.js:', err);
                        this.handlePlayError(err);
                    });
                }
            }, 500);
        });
        
        this.hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('Error HLS.js:', data);
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        if (this.retryCount < this.maxRetries) {
                            this.retryCount++;
                            console.log(`Reintentando HLS.js (${this.retryCount}/${this.maxRetries})`);
                            setTimeout(() => {
                                this.hls.startLoad();
                            }, 1000 * this.retryCount);
                        } else {
                            this.handleNetworkError('Error de conexión. El canal no está disponible.');
                        }
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        if (this.retryCount < this.maxRetries) {
                            this.retryCount++;
                            this.hls.recoverMediaError();
                        } else {
                            this.handleMediaError('Error al decodificar el video.');
                        }
                        break;
                    default:
                        this.handleFatalError('Error fatal en la reproducción.');
                        break;
                }
            }
        });
    },
    
    /**
     * Detecta el formato del stream
     * @param {string} url - URL del stream
     * @returns {string} Formato detectado
     */
    detectFormat(url) {
        if (!url) return 'hls';
        
        const lowerUrl = url.toLowerCase().trim();
        
        // Detectar por extensión o patrón en URL
        if (lowerUrl.includes('.m3u8') || lowerUrl.includes('m3u8') || lowerUrl.includes('/hls/')) {
            return 'hls';
        }
        if (lowerUrl.includes('.mpd') || lowerUrl.includes('dash') || lowerUrl.includes('/dash/')) {
            return 'dash';
        }
        if (lowerUrl.includes('.mp4') || lowerUrl.includes('mp4') || lowerUrl.match(/\.mp4(\?|$)/)) {
            return 'mp4';
        }
        if (lowerUrl.includes('.ts') || lowerUrl.includes('.m2ts') || lowerUrl.match(/\.ts(\?|$)/)) {
            return 'ts';
        }
        if (lowerUrl.includes('rtmp://') || lowerUrl.includes('rtmps://')) {
            return 'rtmp';
        }
        if (lowerUrl.includes('rtsp://')) {
            return 'rtsp';
        }
        
        // Detectar por parámetros de query
        if (lowerUrl.includes('format=m3u8') || lowerUrl.includes('output=hls')) {
            return 'hls';
        }
        if (lowerUrl.includes('format=mp4') || lowerUrl.includes('output=mp4')) {
            return 'mp4';
        }
        if (lowerUrl.includes('output=mpegts') || lowerUrl.includes('output=ts') || lowerUrl.includes('format=mpegts')) {
            return 'ts';
        }
        
        // Por defecto para IPTV, asumir HLS (más común)
        return 'hls';
    },
    
    /**
     * Verifica si es WebOS
     * @returns {boolean}
     */
    isWebOS() {
        return typeof webOS !== 'undefined' || 
               navigator.userAgent.includes('webOS') ||
               navigator.userAgent.includes('WebOS');
    },
    
    /**
     * Verifica codecs soportados por el navegador
     */
    checkSupportedCodecs() {
        const codecs = {
            h264: this.video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
            h265: this.video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"'),
            vp8: this.video.canPlayType('video/webm; codecs="vp8"'),
            vp9: this.video.canPlayType('video/webm; codecs="vp9"'),
            hls: this.video.canPlayType('application/vnd.apple.mpegurl') || 
                 this.video.canPlayType('application/x-mpegURL')
        };
        
        console.log('Codecs soportados:', codecs);
        return codecs;
    },
    
    /**
     * Verifica si la URL es válida
     * @param {string} url - URL a validar
     * @returns {boolean}
     */
    isValidUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        url = url.trim();
        if (url.length < 5) return false;
        
        try {
            const urlObj = new URL(url);
            // Aceptar http, https, rtmp, rtsp
            const validProtocols = ['http:', 'https:', 'rtmp:', 'rtmps:', 'rtsp:'];
            return validProtocols.includes(urlObj.protocol);
        } catch (e) {
            // Si falla URL(), puede ser una URL relativa o mal formada
            // Verificar si parece una URL válida
            return /^(https?|rtmp|rtsp):\/\//i.test(url) || 
                   (url.includes('.') && !url.startsWith('/'));
        }
    },
    
    /**
     * Aplica la configuración de calidad al stream HLS
     */
    applyQualitySetting() {
        if (!this.hls) return;
        
        const quality = this.currentQuality;
        
        if (quality === 'AUTO') {
            this.hls.currentLevel = -1;
            console.log('Calidad: Automática');
        } else {
            const targetBitrate = CONFIG.QUALITY[quality]?.bitrate || -1;
            if (targetBitrate > 0 && this.hlsLevels) {
                let bestLevel = 0;
                let minDiff = Infinity;
                this.hlsLevels.forEach((level, index) => {
                    const diff = Math.abs(level.bitrate - targetBitrate);
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestLevel = index;
                    }
                });
                this.hls.currentLevel = bestLevel;
                console.log('Calidad fijada a nivel:', bestLevel);
            }
        }
    },
    
    /**
     * Reproduce el canal anterior
     */
    previousChannel() {
        if (this.currentIndex > 0) {
            this.loadChannel(this.channels, this.currentIndex - 1);
        }
    },
    
    /**
     * Reproduce el siguiente canal
     */
    nextChannel() {
        if (this.currentIndex < this.channels.length - 1) {
            this.loadChannel(this.channels, this.currentIndex + 1);
        }
    },
    
    /**
     * Cambia a un canal por número
     * @param {number} number - Número del canal
     */
    changeToChannel(number) {
        const index = M3UParser.getChannelIndexByNumber(this.channels, number);
        if (index >= 0) {
            this.loadChannel(this.channels, index);
        } else {
            console.log('Canal no encontrado:', number);
        }
    },
    
    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.video.paused) {
            this.video.play();
            this.isPlaying = true;
            document.getElementById('btn-play-pause').textContent = '⏸';
        } else {
            this.video.pause();
            this.isPlaying = false;
            document.getElementById('btn-play-pause').textContent = '▶';
        }
        this.resetControlsTimer();
    },
    
    /**
     * Retrocede 5 segundos
     */
    rewind() {
        this.video.currentTime = Math.max(0, this.video.currentTime - 5);
        this.resetControlsTimer();
    },
    
    /**
     * Adelanta 5 segundos
     */
    forward() {
        this.video.currentTime = Math.min(this.video.duration || Infinity, this.video.currentTime + 5);
        this.resetControlsTimer();
    },
    
    /**
     * Vuelve a la pantalla principal
     */
    goBack() {
        this.stop();
        App.showScreen('main-screen');
    },
    
    /**
     * Detiene la reproducción
     */
    stop() {
        this.clearAllTimers();
        
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        this.video.pause();
        this.video.src = '';
        this.video.load(); // Limpiar buffer
        this.isPlaying = false;
        this.hideControls();
        this.hideErrorNotification();
        this.hideLoading();
        clearTimeout(this.controlsTimer);
        
        this.retryCount = 0;
        this.stuckCheckCount = 0;
        this.lastVideoTime = 0;
        this.currentChannelUrl = null;
        this.useNativePlayer = true;
    },
    
    /**
     * Muestra los controles
     */
    showControls() {
        this.controls.classList.add('visible');
        this.controlsVisible = true;
        this.resetControlsTimer();
    },
    
    /**
     * Oculta los controles
     */
    hideControls() {
        this.controls.classList.remove('visible');
        this.controlsVisible = false;
    },
    
    /**
     * Toggle visibilidad de controles
     */
    toggleControls() {
        if (this.controlsVisible) {
            this.hideControls();
        } else {
            this.showControls();
        }
    },
    
    /**
     * Reinicia el timer para ocultar controles
     */
    resetControlsTimer() {
        clearTimeout(this.controlsTimer);
        this.controlsTimer = setTimeout(() => {
            this.hideControls();
        }, CONFIG.TIMEOUTS.CONTROLS_HIDE);
    },
    
    /**
     * Muestra el indicador de carga
     */
    showLoading() {
        this.loading.style.display = 'flex';
    },
    
    /**
     * Oculta el indicador de carga
     */
    hideLoading() {
        this.loading.style.display = 'none';
    },
    
    /**
     * Callback cuando el video comienza a reproducirse
     */
    onPlaying() {
        this.clearLoadTimeout();
        this.hideLoading();
        this.hideErrorNotification();
        this.isPlaying = true;
        this.retryCount = 0;
        this.stuckCheckCount = 0;
        document.getElementById('btn-play-pause').textContent = '⏸';
        console.log('Video reproduciéndose correctamente', this.useNativePlayer ? '(nativo)' : '(HLS.js)');
        
        // Verificar dimensiones de video después de un momento
        setTimeout(() => {
            this.checkVideoDimensions();
        }, 2000);
    },
    
    /**
     * Verifica las dimensiones del video para detectar problemas de codec
     * Usa webOSPlayerAdapter para verificación más robusta si está disponible
     */
    checkVideoDimensions() {
        if (!this.video) return;
        
        // Usar webOSPlayerAdapter si está disponible para verificación más robusta
        if (this.webOSAdapter && typeof webOSPlayerAdapter !== 'undefined') {
            try {
                const health = webOSPlayerAdapter.checkPlaybackHealth(this.video);
                console.log('Estado de reproducción (webOSAdapter):', health);
                
                if (!health.healthy && health.issues.length > 0) {
                    console.warn('Problemas detectados:', health.issues);
                    
                    // Si detecta "solo audio", manejar el error
                    if (health.issues.some(issue => issue.includes('Solo audio'))) {
                        this.handleVideoCodecError();
                        return;
                    }
                }
            } catch (error) {
                console.warn('Error verificando salud con webOSAdapter:', error);
                // Continuar con método tradicional
            }
        }
        
        // Método tradicional de verificación
        const videoWidth = this.video.videoWidth;
        const videoHeight = this.video.videoHeight;
        const readyState = this.video.readyState;
        const hasVideoTracks = this.video.getVideoTracks && this.video.getVideoTracks().length > 0;
        
        console.log('Dimensiones del video:', videoWidth, 'x', videoHeight, 'ReadyState:', readyState);
        console.log('Tracks de video:', this.video.videoTracks?.length || 'N/A');
        
        // Verificar si hay audio pero no video
        const hasAudio = !this.video.muted && this.video.volume > 0;
        const hasVideo = videoWidth > 0 && videoHeight > 0;
        
        // Si el video está reproduciéndose pero no tiene dimensiones válidas
        if (readyState >= 2 && !hasVideo && !this.video.paused) {
            console.warn('Video sin dimensiones - posible problema de codec de video');
            // Si hay audio pero no video, es un problema de codec
            if (hasAudio) {
                console.warn('Solo audio detectado - problema de codec de video');
                this.handleVideoCodecError();
            } else {
                // Esperar un poco más antes de marcar como error
                setTimeout(() => {
                    if (this.video.videoWidth === 0 && this.video.videoHeight === 0) {
                        this.handleVideoCodecError();
                    }
                }, 2000);
            }
        }
    },
    
    /**
     * Maneja errores de codec de video
     */
    handleVideoCodecError() {
        if (this.currentChannelUrl) {
            if (this.useNativePlayer) {
                console.log('Problema de codec detectado, intentando con HLS.js...');
                this.showError('Problema de codec detectado. Intentando método alternativo...');
                
                // Intentar con HLS.js que tiene mejor soporte de codecs
                setTimeout(() => {
                    this.loadWithHLSJS(this.currentChannelUrl);
                }, 1000);
            } else if (this.hls) {
                // Ya estamos usando HLS.js, intentar recargar o cambiar nivel
                console.log('Problema de codec con HLS.js, intentando recargar...');
                this.showError('Ajustando codec...');
                
                // Intentar recargar el stream
                setTimeout(() => {
                    if (this.hls) {
                        this.hls.startLoad();
                    }
                }, 2000);
            } else {
                this.showError('El canal solo reproduce audio. El codec de video no es compatible.');
            }
        } else {
            this.showError('Error: URL del canal no disponible');
        }
    },
    
    /**
     * Callback cuando el video está buffering
     */
    onBuffering() {
        if (this.loading.style.display === 'none' && !this.isErrorVisible()) {
            this.showLoading();
        }
    },
    
    /**
     * Callback cuando ocurre un error
     */
    onError(error) {
        console.error('Error de reproducción:', error);
        this.clearLoadTimeout();
        
        const videoError = this.video?.error;
        if (videoError) {
            let errorMessage = 'Error desconocido';
            switch (videoError.code) {
                case videoError.MEDIA_ERR_ABORTED:
                    errorMessage = 'Reproducción cancelada';
                    break;
                case videoError.MEDIA_ERR_NETWORK:
                    errorMessage = 'Error de red. Verifique su conexión.';
                    // Intentar reintentar
                    if (this.retryCount < this.maxRetries && this.currentChannelUrl) {
                        this.retryCount++;
                        setTimeout(() => {
                            this.loadChannel(this.channels, this.currentIndex);
                        }, 2000 * this.retryCount);
                        return;
                    }
                    break;
                case videoError.MEDIA_ERR_DECODE:
                    errorMessage = 'Error al decodificar el video.';
                    // Si estamos usando nativo, intentar con HLS.js
                    if (this.useNativePlayer && this.currentChannelUrl) {
                        console.log('Error de decodificación nativo, intentando HLS.js...');
                        this.loadWithHLSJS(this.currentChannelUrl);
                        return;
                    }
                    break;
                case videoError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Formato no soportado.';
                    // Intentar con HLS.js si no estamos usándolo
                    if (this.useNativePlayer && this.currentChannelUrl) {
                        console.log('Formato no soportado nativamente, intentando HLS.js...');
                        this.loadWithHLSJS(this.currentChannelUrl);
                        return;
                    }
                    break;
            }
            this.showError(errorMessage);
        } else {
            this.showError('Error al reproducir el canal');
        }
        this.hideLoading();
    },
    
    /**
     * Callback cuando se carga la metadata del video
     */
    onMetadataLoaded() {
        this.clearLoadTimeout();
        console.log('Metadata cargada');
    },
    
    /**
     * Maneja timeout de carga
     */
    handleLoadTimeout() {
        console.warn('Timeout al cargar canal');
        this.clearLoadTimeout();
        this.hideLoading();
        this.showError('El canal está tardando demasiado en cargar. Intente nuevamente.');
    },
    
    /**
     * Maneja errores de red
     */
    handleNetworkError(message) {
        this.clearLoadTimeout();
        this.hideLoading();
        this.showError(message || 'Error de conexión');
    },
    
    /**
     * Maneja errores de media
     */
    handleMediaError(message) {
        this.clearLoadTimeout();
        this.hideLoading();
        this.showError(message || 'Error al reproducir el video');
    },
    
    /**
     * Maneja errores fatales
     */
    handleFatalError(message) {
        this.clearLoadTimeout();
        this.hideLoading();
        this.showError(message || 'Error fatal en la reproducción');
    },
    
    /**
     * Maneja errores de reproducción
     */
    handlePlayError(error) {
        console.error('Error al iniciar reproducción:', error);
        this.clearLoadTimeout();
        this.hideLoading();
        this.showError('No se pudo iniciar la reproducción. El canal puede no estar disponible.');
    },
    
    /**
     * Muestra notificación de error
     */
    showError(message) {
        const notification = document.getElementById('player-error-notification');
        const messageEl = notification.querySelector('.error-message-text');
        messageEl.textContent = message;
        notification.style.display = 'flex';
        this.showControls();
    },
    
    /**
     * Oculta notificación de error
     */
    hideErrorNotification() {
        const notification = document.getElementById('player-error-notification');
        notification.style.display = 'none';
    },
    
    /**
     * Verifica si hay error visible
     */
    isErrorVisible() {
        const notification = document.getElementById('player-error-notification');
        return notification.style.display !== 'none';
    },
    
    /**
     * Reintenta cargar el canal actual
     */
    retryCurrentChannel() {
        if (this.currentIndex >= 0 && this.channels.length > 0) {
            this.hideErrorNotification();
            this.loadChannel(this.channels, this.currentIndex);
        }
    },
    
    /**
     * Limpia todos los timers
     */
    clearAllTimers() {
        this.clearLoadTimeout();
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
        if (this.videoCheckInterval) {
            clearInterval(this.videoCheckInterval);
            this.videoCheckInterval = null;
        }
        if (this.codecCheckInterval) {
            clearInterval(this.codecCheckInterval);
            this.codecCheckInterval = null;
        }
        if (this.continuousVideoCheckInterval) {
            clearInterval(this.continuousVideoCheckInterval);
            this.continuousVideoCheckInterval = null;
        }
    },
    
    /**
     * Limpia el timeout de carga
     */
    clearLoadTimeout() {
        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout);
            this.loadTimeout = null;
        }
    },
    
    /**
     * Inicia verificación de video stuck
     */
    startVideoStuckCheck() {
        if (this.videoCheckInterval) {
            clearInterval(this.videoCheckInterval);
        }
        
        this.videoCheckInterval = setInterval(() => {
            this.checkVideoStuck();
        }, 3000);
    },
    
    /**
     * Verifica si el video está stuck
     */
    checkVideoStuck() {
        if (!this.video || this.video.paused) {
            this.stuckCheckCount = 0;
            return;
        }
        
        const currentTime = this.video.currentTime;
        const readyState = this.video.readyState;
        const networkState = this.video.networkState;
        const videoWidth = this.video.videoWidth;
        const videoHeight = this.video.videoHeight;
        
        // Verificar si el tiempo no avanza
        if (Math.abs(currentTime - this.lastVideoTime) < 0.1 && this.lastVideoTime > 0) {
            this.stuckCheckCount++;
            if (this.stuckCheckCount >= 3) {
                console.warn('Video detectado como stuck (tiempo no avanza)');
                this.handleVideoStuck();
                return;
            }
        } else {
            this.stuckCheckCount = 0;
        }
        
        // Verificar si no hay datos suficientes
        if (readyState < 2 && networkState === 2) {
            console.warn('Video sin datos suficientes');
            this.handleVideoStuck();
            return;
        }
        
        // Verificar dimensiones de video - detecta problemas de codec
        if (readyState >= 2 && videoWidth === 0 && videoHeight === 0 && currentTime > 3) {
            console.warn('Video sin dimensiones válidas - posible problema de codec');
            this.stuckCheckCount++;
            if (this.stuckCheckCount >= 2) {
                // Si el video está reproduciéndose pero sin dimensiones, es un problema de codec
                this.handleVideoCodecError();
                return;
            }
        }
        
        this.lastVideoTime = currentTime;
    },
    
    /**
     * Maneja video stuck
     */
    handleVideoStuck() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Reintentando canal (intento ${this.retryCount}/${this.maxRetries})`);
            this.showLoading();
            this.showError(`Reintentando... (${this.retryCount}/${this.maxRetries})`);
            
            this.retryTimer = setTimeout(() => {
                if (this.currentIndex >= 0 && this.channels.length > 0) {
                    this.loadChannel(this.channels, this.currentIndex);
                }
            }, 2000 * this.retryCount);
        } else {
            this.showError('El canal no está respondiendo. Intente cambiar de canal.');
            this.hideLoading();
        }
    },
    
    /**
     * Actualiza la barra de progreso
     */
    updateProgress() {
        if (!this.video) return;
        
        const current = this.video.currentTime;
        const duration = this.video.duration || 0;
        
        if (duration > 0) {
            const progress = (current / duration) * 100;
            document.getElementById('progress-fill').style.width = `${progress}%`;
            document.getElementById('current-time').textContent = this.formatTime(current);
            document.getElementById('total-time').textContent = this.formatTime(duration);
        } else {
            // Para streams en vivo
            document.getElementById('current-time').textContent = 'EN VIVO';
            document.getElementById('total-time').textContent = '';
            document.getElementById('progress-fill').style.width = '100%';
        }
    },
    
    /**
     * Formatea segundos a MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Muestra/oculta el panel de lista de canales
     */
    toggleChannelList() {
        const panel = document.getElementById('channel-list-panel');
        if (panel.style.display === 'none') {
            this.openChannelList();
        } else {
            this.closeChannelList();
        }
    },
    
    /**
     * Abre el panel de lista de canales
     */
    openChannelList() {
        const panel = document.getElementById('channel-list-panel');
        const content = document.getElementById('channel-list-content');
        
        content.innerHTML = this.channels.map((channel, index) => `
            <div class="channel-list-item focusable ${index === this.currentIndex ? 'active' : ''}" 
                 data-index="${index}" tabindex="0">
                <span class="channel-list-number">${channel.number}</span>
                <span class="channel-list-name">${channel.name}</span>
            </div>
        `).join('');
        
        content.querySelectorAll('.channel-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.loadChannel(this.channels, index);
                this.closeChannelList();
            });
        });
        
        panel.style.display = 'flex';
        
        const activeItem = content.querySelector('.channel-list-item.active');
        if (activeItem) {
            activeItem.focus();
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },
    
    /**
     * Cierra el panel de lista de canales
     */
    closeChannelList() {
        document.getElementById('channel-list-panel').style.display = 'none';
    },
    
    /**
     * Muestra el selector de calidad
     */
    showQualitySelector() {
        const modal = document.getElementById('quality-modal');
        const options = document.getElementById('quality-options');
        
        options.innerHTML = Object.entries(CONFIG.QUALITY).map(([key, value]) => `
            <div class="quality-option focusable ${this.currentQuality === key ? 'active' : ''}" 
                 data-quality="${key}" tabindex="0">
                <span class="quality-label">${value.label}</span>
                ${this.currentQuality === key ? '<span class="quality-check">✓</span>' : ''}
            </div>
        `).join('');
        
        options.querySelectorAll('.quality-option').forEach(option => {
            option.addEventListener('click', () => {
                this.setQuality(option.dataset.quality);
                this.hideQualitySelector();
            });
        });
        
        modal.style.display = 'flex';
        
        const activeOption = options.querySelector('.quality-option.active');
        if (activeOption) {
            activeOption.focus();
        }
    },
    
    /**
     * Oculta el selector de calidad
     */
    hideQualitySelector() {
        document.getElementById('quality-modal').style.display = 'none';
    },
    
    /**
     * Establece la calidad de video
     */
    setQuality(quality) {
        this.currentQuality = quality;
        Storage.saveQuality(quality);
        console.log('Calidad establecida:', quality);
        this.applyQualitySetting();
    },
    
    /**
     * Maneja las teclas específicas del reproductor
     */
    handlePlayerKeys(detail) {
        const { keyCode } = detail;
        
        if (App.currentScreen !== 'player-screen') return;
        
        if (!this.controlsVisible) {
            this.showControls();
            return;
        }
        
        if (Navigation.isNumberKey(keyCode)) {
            this.handleChannelNumberInput(Navigation.getNumberFromKey(keyCode));
            return;
        }
        
        switch (keyCode) {
            case CONFIG.KEYS.UP:
            case CONFIG.KEYS.CHANNEL_UP:
            case CONFIG.KEYS.NEXT:
                this.nextChannel();
                break;
            case CONFIG.KEYS.DOWN:
            case CONFIG.KEYS.CHANNEL_DOWN:
            case CONFIG.KEYS.PREVIOUS:
                this.previousChannel();
                break;
            case CONFIG.KEYS.PLAY:
            case CONFIG.KEYS.PAUSE:
            case CONFIG.KEYS.PLAY_PAUSE:
                this.togglePlayPause();
                break;
            case CONFIG.KEYS.STOP:
                this.goBack();
                break;
            case CONFIG.KEYS.REWIND:
                this.rewind();
                break;
            case CONFIG.KEYS.FAST_FORWARD:
                this.forward();
                break;
            case CONFIG.KEYS.INFO:
            case CONFIG.KEYS.GUIDE:
                this.showControls();
                break;
            case CONFIG.KEYS.BLUE:
                this.toggleChannelList();
                break;
        }
    },
    
    /**
     * Maneja la entrada de números para cambio de canal
     */
    handleChannelNumberInput(digit) {
        this.channelNumberInput += digit.toString();
        this.showChannelNumberOverlay(this.channelNumberInput);
        
        clearTimeout(this.channelNumberTimer);
        
        this.channelNumberTimer = setTimeout(() => {
            const number = parseInt(this.channelNumberInput);
            if (!isNaN(number)) {
                this.changeToChannel(number);
            }
            this.channelNumberInput = '';
            this.hideChannelNumberOverlay();
        }, CONFIG.TIMEOUTS.CHANNEL_INPUT);
    },
    
    /**
     * Muestra el overlay con el número de canal
     */
    showChannelNumberOverlay(number) {
        const overlay = document.getElementById('player-channel-overlay');
        const text = document.getElementById('player-channel-text');
        text.textContent = number;
        overlay.style.display = 'block';
    },
    
    /**
     * Oculta el overlay del número de canal
     */
    hideChannelNumberOverlay() {
        document.getElementById('player-channel-overlay').style.display = 'none';
    }
};

// Hacer Player global
window.Player = Player;
