# IPTV App para LG WebOS

## 📺 Descripción

Aplicación IPTV para televisores LG Smart TV con sistema operativo WebOS. Permite autenticarse con un servidor IPTV, descargar la lista de canales y reproducir contenido en tiempo real.

## 🚀 Funcionalidades

### 🔐 Autenticación
- Login con credenciales IPTV
- Persistencia de sesión
- Auto-login al iniciar

### 📋 Gestión de Canales
- Descarga automática de playlist M3U
- Grilla de canales con logos
- Búsqueda de canales
- Cambio de canal con números

### 🎬 Reproductor
- Reproducción de streams HLS
- Controles de reproducción
- Navegación entre canales
- Lista de canales en panel lateral
- Selector de calidad

### 🎮 Navegación
- Soporte completo para control remoto LG
- Navegación con teclas direccionales
- Teclas de colores
- Cambio de canal con números

## 🛠️ Desarrollo

### Requisitos
- LG WebOS SDK
- Node.js (para herramientas de desarrollo)

### Estructura del Proyecto
```
IPTV_LG_WebOS/
├── appinfo.json          # Configuración de la app WebOS
├── index.html            # Página principal
├── css/
│   ├── styles.css        # Estilos globales
│   ├── login.css         # Estilos de login
│   ├── main.css          # Estilos de pantalla principal
│   └── player.css        # Estilos del reproductor
├── js/
│   ├── config.js         # Configuración
│   ├── storage.js        # Almacenamiento local
│   ├── m3uParser.js      # Parser de M3U
│   ├── navigation.js     # Sistema de navegación
│   ├── player.js         # Reproductor de video
│   └── app.js            # Lógica principal
└── assets/
    └── icons/            # Iconos de la app
```

### Instalación en TV

1. Instalar el WebOS SDK
2. Habilitar modo desarrollador en la TV
3. Empaquetar la aplicación:
   ```bash
   ares-package .
   ```
4. Instalar en la TV:
   ```bash
   ares-install com.ctvc.iptv_1.0.0_all.ipk -d <nombre_tv>
   ```

### Pruebas en Emulador

```bash
ares-launch com.ctvc.iptv -s 0
```

## 📱 Controles

| Tecla | Función |
|-------|---------|
| ↑↓←→ | Navegación |
| OK/Enter | Seleccionar |
| Back | Volver/Salir |
| 0-9 | Cambio directo de canal |
| CH+/CH- | Canal anterior/siguiente |
| ▶/⏸ | Play/Pause |
| 🔴 Rojo | Favoritos |
| 🔵 Azul | Lista de canales |

## 📄 Licencia

Proyecto privado - Uso interno.

