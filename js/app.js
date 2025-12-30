/**
 * Aplicación principal IPTV para LG WebOS
 */
const App = {
    currentScreen: 'splash-screen',
    channels: [],
    filteredChannels: [],
    channelNumberInput: '',
    channelNumberTimer: null,

    async init() {
        console.log('Iniciando aplicación IPTV para LG WebOS');
        
        // Inicializar webOS si está disponible
        this.initWebOS();
        
        Navigation.init();
        Player.init();
        this.setupEventListeners();
        
        // Mostrar splash y luego verificar sesión activa
        setTimeout(() => {
            const hasActiveSession = Storage.hasActiveSession();
            const credentials = Storage.getCredentials();
            
            if (hasActiveSession && credentials) {
                // Sesión activa - ir directo a canales
                this.autoLogin(credentials);
            } else if (credentials) {
                // Hay credenciales pero no sesión activa - mostrar login prellenado
                this.prefillLogin(credentials);
                this.showScreen('login-screen');
            } else {
                this.showScreen('login-screen');
            }
        }, CONFIG.TIMEOUTS.SPLASH);
    },
    
    /**
     * Prellena el formulario de login con credenciales guardadas
     */
    prefillLogin(credentials) {
        document.getElementById('username').value = credentials.username;
        document.getElementById('password').value = credentials.password;
    },

    /**
     * Inicializa las APIs de webOS TV
     */
    initWebOS() {
        if (typeof webOS !== 'undefined') {
            // Registrar la app para recibir eventos de visibilidad
            document.addEventListener('webOSRelaunch', (e) => {
                console.log('App relanzada con parámetros:', e.detail);
            });
            
            // Prevenir que la app se cierre con el botón back en la pantalla principal
            if (webOS.platform && webOS.platform.tv) {
                console.log('Ejecutando en LG WebOS TV');
            }
        } else {
            console.log('webOS API no disponible - ejecutando en modo desarrollo');
        }
    },

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        document.getElementById('btn-exit').addEventListener('click', () => this.exitApp());
        
        // Main screen
        document.getElementById('btn-search').addEventListener('click', () => this.toggleSearch());
        document.getElementById('btn-refresh').addEventListener('click', () => this.refreshChannels());
        document.getElementById('btn-logout').addEventListener('click', () => this.logout());
        document.getElementById('search-clear').addEventListener('click', () => this.clearSearch());
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Back button
        document.addEventListener('tvBack', () => this.handleBack());
        
        // Number keys for channel change
        document.addEventListener('tvKeyPress', (e) => this.handleGlobalKeys(e.detail));
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
        
        if (screenId === 'login-screen') {
            Navigation.updateFocusableElements(screenId);
            document.getElementById('username').focus();
        } else if (screenId === 'main-screen') {
            console.log('Mostrando pantalla principal, canales disponibles:', this.filteredChannels.length);
            // Asegurar que se actualice la grilla
            setTimeout(() => {
                this.updateChannelsGrid();
            }, 100);
        }
    },

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!username || !password) {
            this.showLoginError('Por favor ingresa usuario y contraseña');
            return;
        }
        
        const btn = document.getElementById('btn-login');
        btn.classList.add('loading');
        btn.disabled = true;
        
        try {
            console.log('Iniciando login para usuario:', username);
            const playlist = await this.fetchPlaylist(username, password);
            
            if (!playlist) {
                throw new Error('No se recibió respuesta del servidor');
            }
            
            console.log('Playlist recibida, parseando...');
            const parsed = M3UParser.parse(playlist);
            
            console.log('Canales parseados:', parsed.channels.length);
            console.log('Categorías:', parsed.categories.length);
            
            if (parsed.channels.length === 0) {
                console.error('No se encontraron canales. Contenido de playlist:', playlist.substring(0, 1000));
                throw new Error('No se encontraron canales en la playlist. Verifica el formato.');
            }
            
            // Validar que los canales tengan URL
            const validChannels = parsed.channels.filter(ch => ch.url && ch.url.trim() !== '');
            console.log('Canales válidos (con URL):', validChannels.length);
            
            if (validChannels.length === 0) {
                throw new Error('Los canales no tienen URLs válidas');
            }
            
            // Descargar logos automáticamente si está habilitado
            if (LogoDownloader && LogoDownloader.config.AUTO_DOWNLOAD) {
                console.log('Iniciando descarga automática de logos...');
                try {
                    // Procesar logos: descargar existentes y buscar automáticamente los faltantes
                    this.channels = await LogoDownloader.processChannels(
                        validChannels, 
                        LogoDownloader.config.AUTO_FIND_MISSING_LOGOS
                    );
                    console.log('Logos procesados, canales actualizados');
                } catch (logoError) {
                    console.warn('Error procesando logos, usando canales sin logos descargados:', logoError);
                    this.channels = validChannels;
                }
            } else {
                this.channels = validChannels;
            }
            
            this.filteredChannels = [...this.channels];
            
            console.log('Canales cargados exitosamente:', this.channels.length);
            
            // Guardar credenciales y activar sesión
            Storage.saveCredentials(username, password);
            Storage.setActiveSession(true);
            Storage.savePlaylist(this.channels);
            
            this.showScreen('main-screen');
            
            // Continuar descargando logos en segundo plano y buscar automáticamente los faltantes
            if (LogoDownloader && LogoDownloader.config.AUTO_DOWNLOAD) {
                // Primero descargar logos existentes
                LogoDownloader.downloadLogosForChannels(this.channels, (index, total, downloaded) => {
                    // Actualizar el logo específico en la grilla cuando se descargue
                    this.updateChannelLogo(index);
                }).then(updatedChannels => {
                    this.channels = updatedChannels;
                    this.filteredChannels = [...this.channels];
                    Storage.savePlaylist(this.channels);
                    this.updateChannelsGrid();
                    
                    // Luego buscar logos automáticamente para canales sin logo
                    if (LogoDownloader.config.AUTO_FIND_MISSING_LOGOS) {
                        console.log('Buscando logos automáticamente para canales sin logo...');
                        LogoDownloader.processChannels(this.channels, true, (processed, total, found) => {
                            // Actualizar logos encontrados en tiempo real
                            this.channels = [...this.channels]; // Trigger update
                            this.filteredChannels = [...this.channels];
                            this.updateChannelsGrid();
                        }).then(finalChannels => {
                            this.channels = finalChannels;
                            this.filteredChannels = [...this.channels];
                            Storage.savePlaylist(this.channels);
                            this.updateChannelsGrid();
                            console.log('Búsqueda automática de logos completada');
                        }).catch(error => {
                            console.warn('Error en búsqueda automática de logos:', error);
                        });
                    }
                }).catch(error => {
                    console.warn('Error en descarga de logos en segundo plano:', error);
                });
            }
        } catch (error) {
            console.error('Error en login:', error);
            console.error('Stack:', error.stack);
            const errorMessage = error.message || 'Error al cargar los canales. Verifica tus credenciales.';
            this.showLoginError(errorMessage);
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    },

    async autoLogin(credentials) {
        try {
            const playlist = await this.fetchPlaylist(credentials.username, credentials.password);
            const parsed = M3UParser.parse(playlist);
            
            if (parsed.channels.length === 0) {
                throw new Error('No se encontraron canales');
            }
            
            // Validar que los canales tengan URL
            const validChannels = parsed.channels.filter(ch => ch.url && ch.url.trim() !== '');
            
            // Descargar logos automáticamente si está habilitado
            if (LogoDownloader && LogoDownloader.config.AUTO_DOWNLOAD) {
                console.log('Iniciando descarga automática de logos (auto-login)...');
                try {
                    // Procesar logos: descargar existentes y buscar automáticamente los faltantes
                    this.channels = await LogoDownloader.processChannels(
                        validChannels, 
                        LogoDownloader.config.AUTO_FIND_MISSING_LOGOS
                    );
                    console.log('Logos procesados, canales actualizados');
                } catch (logoError) {
                    console.warn('Error procesando logos, usando canales sin logos descargados:', logoError);
                    this.channels = validChannels;
                }
            } else {
                this.channels = validChannels;
            }
            
            this.filteredChannels = [...this.channels];
            Storage.savePlaylist(this.channels);
            this.showScreen('main-screen');
            
            // Continuar descargando logos en segundo plano y buscar automáticamente los faltantes
            if (LogoDownloader && LogoDownloader.config.AUTO_DOWNLOAD) {
                // Primero descargar logos existentes
                LogoDownloader.downloadLogosForChannels(this.channels, (index, total, downloaded) => {
                    // Actualizar el logo específico en la grilla cuando se descargue
                    this.updateChannelLogo(index);
                }).then(updatedChannels => {
                    this.channels = updatedChannels;
                    this.filteredChannels = [...this.channels];
                    Storage.savePlaylist(this.channels);
                    this.updateChannelsGrid();
                    
                    // Luego buscar logos automáticamente para canales sin logo
                    if (LogoDownloader.config.AUTO_FIND_MISSING_LOGOS) {
                        console.log('Buscando logos automáticamente para canales sin logo (auto-login)...');
                        LogoDownloader.processChannels(this.channels, true, (processed, total, found) => {
                            // Actualizar logos encontrados en tiempo real
                            this.channels = [...this.channels]; // Trigger update
                            this.filteredChannels = [...this.channels];
                            this.updateChannelsGrid();
                        }).then(finalChannels => {
                            this.channels = finalChannels;
                            this.filteredChannels = [...this.channels];
                            Storage.savePlaylist(this.channels);
                            this.updateChannelsGrid();
                            console.log('Búsqueda automática de logos completada (auto-login)');
                        }).catch(error => {
                            console.warn('Error en búsqueda automática de logos (auto-login):', error);
                        });
                    }
                }).catch(error => {
                    console.warn('Error en descarga de logos en segundo plano (auto-login):', error);
                });
            }
        } catch (error) {
            console.error('Auto-login fallido:', error);
            // Si falla el auto-login, mostrar pantalla de login
            this.showScreen('login-screen');
        }
    },

    async fetchPlaylist(username, password) {
        // Usar el helper buildPlaylistUrl() para construir la URL correctamente
        // Esto asegura que se use el perfil activo y los formatos configurados
        const url = CONFIG.buildPlaylistUrl(username, password);
        
        console.log('Descargando playlist desde:', url);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.REQUEST);
            
            const response = await fetch(url, { 
                method: 'GET',
                headers: {
                    'Accept': '*/*',
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'Mozilla/5.0'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('Respuesta recibida, status:', response.status, response.statusText);
            console.log('Content-Type:', response.headers.get('content-type'));
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                console.error('Error HTTP:', response.status, response.statusText);
                console.error('Respuesta del servidor:', errorText.substring(0, 200));
                throw new Error(`Error al obtener playlist: ${response.status} ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('Playlist descargada, tamaño:', text.length, 'caracteres');
            
            if (!text || text.trim().length === 0) {
                throw new Error('La playlist está vacía');
            }
            
            // Mostrar muestra del contenido
            const preview = text.substring(0, Math.min(1000, text.length));
            console.log('Muestra del contenido:', preview);
            console.log('¿Contiene #EXTINF?:', text.includes('#EXTINF'));
            console.log('¿Contiene Channel name?:', text.includes('Channel name:'));
            console.log('¿Contiene #Name:?:', text.includes('#Name:'));
            
            return text;
        } catch (error) {
            console.error('Error al descargar playlist:', error);
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
            }
            throw error;
        }
    },

    showLoginError(message) {
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => errorEl.style.display = 'none', 5000);
    },

    updateChannelsGrid() {
        const grid = document.getElementById('channels-grid');
        const loading = document.getElementById('loading-channels');
        const noChannels = document.getElementById('no-channels');
        
        if (!grid) {
            console.error('Elemento channels-grid no encontrado');
            return;
        }
        
        loading.style.display = 'none';
        
        console.log('Actualizando grilla de canales, total:', this.filteredChannels.length);
        
        if (this.filteredChannels.length === 0) {
            console.warn('No hay canales para mostrar');
            noChannels.style.display = 'flex';
            grid.innerHTML = '';
            return;
        }
        
        noChannels.style.display = 'none';
        
        grid.innerHTML = this.filteredChannels.map((channel, index) => {
            const initials = channel.name.substring(0, 2).toUpperCase();
            return `
            <div class="channel-card focusable" data-index="${index}" tabindex="0">
                <div class="channel-logo-container">
                    ${channel.logo 
                        ? `<img src="${channel.logo}" alt="" class="channel-logo" 
                            onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
                            referrerpolicy="no-referrer"
                            loading="lazy">
                           <span class="channel-logo-placeholder" style="display:none;">${initials}</span>`
                        : `<span class="channel-logo-placeholder">${initials}</span>`
                    }
                </div>
                <div class="channel-info-card">
                    <span class="channel-number-card">${channel.number}</span>
                    <div class="channel-name-card">${channel.name}</div>
                    <div class="channel-category">${channel.category}</div>
                </div>
            </div>
        `}).join('');
        
        // Add click listeners
        grid.querySelectorAll('.channel-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.playChannel(index);
            });
        });
        
        Navigation.updateFocusableElements('main-screen');
    },
    
    /**
     * Actualiza el logo de un canal específico en la grilla sin re-renderizar todo
     * @param {number} channelIndex - Índice del canal en filteredChannels
     */
    updateChannelLogo(channelIndex) {
        if (channelIndex < 0 || channelIndex >= this.filteredChannels.length) {
            return;
        }
        
        const channel = this.filteredChannels[channelIndex];
        if (!channel || !channel.logo) {
            return;
        }
        
        const grid = document.getElementById('channels-grid');
        if (!grid) {
            return;
        }
        
        const card = grid.querySelector(`.channel-card[data-index="${channelIndex}"]`);
        if (!card) {
            return;
        }
        
        const logoContainer = card.querySelector('.channel-logo-container');
        if (!logoContainer) {
            return;
        }
        
        // Verificar si ya tiene un logo cargado
        const existingImg = logoContainer.querySelector('.channel-logo');
        if (existingImg && existingImg.src === channel.logo) {
            return; // Ya está actualizado
        }
        
        // Actualizar o agregar el logo
        const initials = channel.name.substring(0, 2).toUpperCase();
        const placeholder = logoContainer.querySelector('.channel-logo-placeholder');
        
        if (placeholder && !existingImg) {
            // Crear nueva imagen
            const img = document.createElement('img');
            img.src = channel.logo;
            img.alt = '';
            img.className = 'channel-logo';
            img.referrerPolicy = 'no-referrer';
            img.loading = 'lazy';
            img.onerror = function() {
                this.onerror = null;
                this.style.display = 'none';
                if (placeholder) {
                    placeholder.style.display = 'flex';
                }
            };
            
            // Ocultar placeholder y mostrar imagen
            placeholder.style.display = 'none';
            logoContainer.insertBefore(img, placeholder);
        } else if (existingImg) {
            // Actualizar imagen existente
            existingImg.src = channel.logo;
            existingImg.style.display = 'block';
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        }
    },

    playChannel(index) {
        this.showScreen('player-screen');
        Player.loadChannel(this.filteredChannels, index);
    },

    toggleSearch() {
        const container = document.getElementById('search-container');
        container.classList.toggle('active');
        if (container.classList.contains('active')) {
            document.getElementById('search-input').focus();
        }
    },

    handleSearch(query) {
        this.filteredChannels = M3UParser.searchChannels(this.channels, query);
        this.updateChannelsGrid();
    },

    clearSearch() {
        document.getElementById('search-input').value = '';
        this.filteredChannels = [...this.channels];
        this.updateChannelsGrid();
    },

    async refreshChannels() {
        const credentials = Storage.getCredentials();
        if (credentials) {
            document.getElementById('loading-channels').style.display = 'flex';
            try {
                await this.autoLogin(credentials);
            } finally {
                document.getElementById('loading-channels').style.display = 'none';
            }
        }
    },

    logout() {
        // Mantener credenciales guardadas pero desactivar sesión
        Storage.setActiveSession(false);
        this.channels = [];
        this.filteredChannels = [];
        
        // Limpiar logos descargados (opcional - comentar si quieres mantenerlos en cache)
        // LogoDownloader.clearCache();
        
        // Prellenar login con credenciales guardadas
        const credentials = Storage.getCredentials();
        if (credentials) {
            this.prefillLogin(credentials);
        }
        
        this.showScreen('login-screen');
    },

    handleBack() {
        switch (this.currentScreen) {
            case 'player-screen':
                Player.goBack();
                break;
            case 'main-screen':
                // Show exit confirmation or do nothing
                break;
            case 'login-screen':
                this.exitApp();
                break;
        }
    },

    handleGlobalKeys(detail) {
        const { keyCode } = detail;
        
        if (this.currentScreen === 'main-screen' && Navigation.isNumberKey(keyCode)) {
            this.handleChannelNumberInput(Navigation.getNumberFromKey(keyCode));
        }
    },

    handleChannelNumberInput(digit) {
        this.channelNumberInput += digit.toString();
        this.showChannelNumberOverlay(this.channelNumberInput);
        
        clearTimeout(this.channelNumberTimer);
        this.channelNumberTimer = setTimeout(() => {
            const number = parseInt(this.channelNumberInput);
            if (!isNaN(number)) {
                const index = M3UParser.getChannelIndexByNumber(this.filteredChannels, number);
                if (index >= 0) {
                    this.playChannel(index);
                }
            }
            this.channelNumberInput = '';
            this.hideChannelNumberOverlay();
        }, CONFIG.TIMEOUTS.CHANNEL_INPUT);
    },

    showChannelNumberOverlay(number) {
        const overlay = document.getElementById('channel-number-overlay');
        document.getElementById('channel-number-text').textContent = number;
        overlay.style.display = 'block';
    },

    hideChannelNumberOverlay() {
        document.getElementById('channel-number-overlay').style.display = 'none';
    },

    exitApp() {
        // Limpiar recursos antes de cerrar (opcional)
        // LogoDownloader.clearCache();
        
        if (typeof webOS !== 'undefined') {
            if (webOS.platformBack) {
                webOS.platformBack();
            } else if (webOS.service && webOS.service.request) {
                // Método alternativo para cerrar la app en webOS
                webOS.service.request('luna://com.webos.applicationManager', {
                    method: 'closeByAppId',
                    parameters: { id: webOS.fetchAppId() },
                    onSuccess: function() { console.log('App cerrada'); },
                    onFailure: function(err) { console.error('Error cerrando app:', err); }
                });
            }
        } else {
            window.close();
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;

