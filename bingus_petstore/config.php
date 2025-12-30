<?php
/**
 * ======================================
 * CONFIGURACIÓN GLOBAL - Bingus Petstore
 * ======================================
 * 
 * Este archivo centraliza todas las configuraciones
 * de la aplicación para facilitar el mantenimiento
 */

// ========== CONFIGURACIÓN DE BASE DE DATOS ==========
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'bingus_petstore2');

// ========== CONFIGURACIÓN DE APLICACIÓN ==========
define('APP_NAME', 'Bingus Petstore');
define('APP_VERSION', '1.0.0');
define('APP_ENV', 'development'); // development, production

// ========== CONFIGURACIÓN DE DIRECTORIO ==========
define('BASE_URL', 'http://localhost/bingus_petstore/');
define('ROOT_PATH', dirname(__FILE__) . '/');

// ========== CONFIGURACIÓN DE SESIÓN ==========
define('SESSION_TIMEOUT', 3600); // 1 hora en segundos

// ========== FUNCIONES DE UTILIDAD ==========

/**
 * Conectar a la base de datos
 */
function conectarBD() {
    try {
        $conexion = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        return $conexion;
    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            die("Error de conexión BD: " . $e->getMessage());
        } else {
            die("Error de conexión. Por favor intente más tarde.");
        }
    }
}

/**
 * Registrar error en log
 */
function registrarError($mensaje, $archivo = null, $linea = null) {
    $timestamp = date('Y-m-d H:i:s');
    $log_msg = "[$timestamp] $mensaje";
    
    if ($archivo && $linea) {
        $log_msg .= " (Archivo: $archivo, Línea: $linea)";
    }
    
    error_log($log_msg . "\n", 3, ROOT_PATH . "logs/errores.log");
}

/**
 * Redirigir a URL
 */
function redirigir($url) {
    header("Location: " . $url);
    exit();
}

/**
 * Sanitizar entrada
 */
function sanitizar($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Formatear moneda chilena
 */
function formatearMoneda($cantidad) {
    return '$ ' . number_format($cantidad, 0, ',', '.');
}

/**
 * Obtener mensaje de error amigable
 */
function obtenerMensajeError($codigo) {
    $mensajes = [
        'BD_ERROR' => 'Error en la base de datos. Por favor intente más tarde.',
        'CAMPO_VACIO' => 'Por favor complete todos los campos requeridos.',
        'PRECIO_NEGATIVO' => 'El precio no puede ser negativo.',
        'STOCK_NEGATIVO' => 'El stock no puede ser negativo.',
        'PRODUCTO_NO_ENCONTRADO' => 'El producto no fue encontrado.',
        'CATEGORIA_NO_EXISTE' => 'La categoría especificada no existe.',
        'PROVEEDOR_NO_EXISTE' => 'El proveedor especificado no existe.',
    ];
    
    return $mensajes[$codigo] ?? 'Error desconocido.';
}

?>
