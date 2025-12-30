-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 05-12-2025 a las 21:11:09
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `bingus_petstore2`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_info_cliente` (IN `p_id_cliente` INT, IN `p_nombre` VARCHAR(100), IN `p_email` VARCHAR(100), IN `p_telefono` VARCHAR(20), IN `p_direccion` VARCHAR(200))   BEGIN
    DECLARE v_resultado VARCHAR(255);
    
    -- Validaciones
    IF p_id_cliente IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El ID del cliente no puede ser nulo';
    END IF;
    
    IF p_nombre IS NULL OR p_nombre = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre del cliente no puede estar vacío';
    END IF;
    
    IF p_email IS NOT NULL AND p_email != '' THEN
        IF NOT p_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El formato del email no es válido';
        END IF;
        
        IF EXISTS (SELECT 1 FROM clientes WHERE email = p_email AND id_cliente != p_id_cliente) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El email ya está registrado para otro cliente';
        END IF;
    END IF;
    
    -- Actualizar cliente
    UPDATE clientes
    SET 
        nombre = p_nombre,
        email = p_email,
        telefono = p_telefono,
        direccion = p_direccion
    WHERE id_cliente = p_id_cliente;
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cliente no encontrado';
    END IF;
    
    SELECT 'Cliente actualizado exitosamente' AS mensaje;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_producto` (IN `p_id_producto` INT, IN `p_nombre` VARCHAR(150), IN `p_descripcion` VARCHAR(255), IN `p_precio` DECIMAL(10,2), IN `p_stock` INT, IN `p_id_categoria` INT, IN `p_id_proveedor` INT)   BEGIN
    DECLARE v_resultado VARCHAR(255);
    
    -- Validaciones
    IF p_id_producto IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El ID del producto no puede ser nulo';
    END IF;
    
    IF p_precio < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El precio no puede ser negativo';
    END IF;
    
    IF p_stock < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El stock no puede ser negativo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM categorias_productos WHERE id_categoria = p_id_categoria) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La categoría especificada no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM proveedores WHERE id_proveedor = p_id_proveedor) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El proveedor especificado no existe';
    END IF;
    
    -- Actualizar producto
    UPDATE productos
    SET 
        nombre = p_nombre,
        descripcion = p_descripcion,
        id_categoria = p_id_categoria,
        id_proveedor = p_id_proveedor,
        precio = p_precio,
        stock = p_stock
    WHERE id_producto = p_id_producto;
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Producto no encontrado';
    END IF;
    
    SELECT 'Producto actualizado exitosamente' AS mensaje;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `eliminar_cliente` (IN `p_id_cliente` INT)   BEGIN
    DECLARE v_count INT;
    
    -- Validación
    IF p_id_cliente IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El ID del cliente no puede ser nulo';
    END IF;
    
    -- Verificar si el cliente existe
    SELECT COUNT(*) INTO v_count FROM clientes WHERE id_cliente = p_id_cliente;
    
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cliente no encontrado';
    END IF;
    
    -- Verificar si el cliente tiene pedidos
    IF EXISTS (SELECT 1 FROM pedidos WHERE id_cliente = p_id_cliente) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede eliminar el cliente, tiene pedidos asociados';
    END IF;
    
    -- Eliminar cliente
    DELETE FROM clientes WHERE id_cliente = p_id_cliente;
    
    SELECT 'Cliente eliminado exitosamente' AS mensaje;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `eliminar_producto` (IN `p_id_producto` INT)   BEGIN
    DECLARE v_count INT;
    
    -- Validación
    IF p_id_producto IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El ID del producto no puede ser nulo';
    END IF;
    
    -- Verificar si el producto existe
    SELECT COUNT(*) INTO v_count FROM productos WHERE id_producto = p_id_producto;
    
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Producto no encontrado';
    END IF;
    
    -- Verificar si el producto está en algún pedido
    IF EXISTS (SELECT 1 FROM detalle_pedido WHERE id_producto = p_id_producto) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede eliminar el producto, está siendo utilizado en pedidos';
    END IF;
    
    -- Eliminar producto
    DELETE FROM productos WHERE id_producto = p_id_producto;
    
    SELECT 'Producto eliminado exitosamente' AS mensaje;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `administradores`
--

CREATE TABLE `administradores` (
  `id_administrador` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `rut` varchar(12) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `usuario` varchar(50) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `administradores`
--

INSERT INTO `administradores` (`id_administrador`, `nombre`, `rut`, `email`, `telefono`, `usuario`, `contrasena`, `fecha_creacion`) VALUES
(1, 'Carlos Morales', '8706234-2', 'carlos.morales@tiendamascotas.cl', '+56 9 1111 1111', 'cmorales', '123456', '2025-11-19 13:51:36'),
(2, 'Lucía Herrera', '19560347-1', 'lucia.herrera@tiendamascotas.cl', '+56 9 2222 2222', 'lherrera', '123456', '2025-11-19 13:51:36'),
(3, 'Javier Soto', '14902634-1', 'javier.soto@tiendamascotas.cl', '+56 9 3333 3333', 'jsoto', '123456', '2025-11-19 13:51:36'),
(4, 'Fernanda Rivas', '18457823-0', 'fernanda.rivas@tiendamascotas.cl', '+56 9 4444 4444', 'frivas', '123456', '2025-11-19 13:51:36'),
(5, 'Andrés Pino', '20003637-k', 'andres.pino@tiendamascotas.cl', '+56 9 5555 5555', 'apino', '123456', '2025-11-19 13:51:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auditoria_cambios`
--

CREATE TABLE `auditoria_cambios` (
  `id_auditoria` int(11) NOT NULL,
  `tabla_afectada` varchar(50) NOT NULL,
  `tipo_operacion` varchar(10) NOT NULL,
  `id_registro` int(11) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `usuario_sistema` varchar(100) DEFAULT NULL,
  `fecha_cambio` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `auditoria_cambios`
--

INSERT INTO `auditoria_cambios` (`id_auditoria`, `tabla_afectada`, `tipo_operacion`, `id_registro`, `descripcion`, `usuario_sistema`, `fecha_cambio`) VALUES
(4, 'productos', 'DELETE', 11, 'Producto eliminado: ID=11, Nombre=\"Churu pescado\", Precio=3500.00, Stock=25, Categoría ID=3, Proveedor ID=5', 'root@localhost', '2025-12-05 16:54:29'),
(8, 'productos', 'DELETE', 12, 'Producto eliminado: ID=12, Nombre=\"Juguete Rana para Perro\", Precio=8000.00, Stock=20, Categoría ID=5, Proveedor ID=2', 'root@localhost', '2025-12-05 16:56:14'),
(17, 'productos', 'UPDATE', 10, 'Producto actualizado. ', 'root@localhost', '2025-12-05 18:34:47'),
(18, 'productos', 'UPDATE', 8, 'Producto actualizado. ', 'root@localhost', '2025-12-05 19:39:28'),
(19, 'productos', 'UPDATE', 4, 'Producto actualizado. ', 'root@localhost', '2025-12-05 19:39:55'),
(20, 'productos', 'UPDATE', 4, 'Producto actualizado. ', 'root@localhost', '2025-12-05 20:06:05'),
(21, 'productos', 'UPDATE', 8, 'Producto actualizado. ', 'root@localhost', '2025-12-05 20:06:14'),
(22, 'productos', 'UPDATE', 10, 'Producto actualizado. ', 'root@localhost', '2025-12-05 20:06:24'),
(23, 'productos', 'UPDATE', 10, 'Producto actualizado. ', 'root@localhost', '2025-12-05 20:06:53'),
(24, 'productos', 'UPDATE', 10, 'Producto actualizado. ', 'root@localhost', '2025-12-05 20:07:07'),
(25, 'productos', 'UPDATE', 10, 'Producto actualizado. ', 'root@localhost', '2025-12-05 20:07:17'),
(26, 'productos', 'UPDATE', 10, 'Producto actualizado. ', 'root@localhost', '2025-12-05 20:07:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias_productos`
--

CREATE TABLE `categorias_productos` (
  `id_categoria` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias_productos`
--

INSERT INTO `categorias_productos` (`id_categoria`, `nombre`, `descripcion`) VALUES
(1, 'Alimento Perro', 'Alimento seco o húmedo para perros'),
(2, 'Alimento Gato', 'Alimento seco o húmedo para gatos'),
(3, 'Snacks', 'Premios y golosinas para mascotas'),
(4, 'Arena/Absorbentes', 'Arena sanitaria y productos absorbentes'),
(5, 'Accesorios', 'Correas, juguetes, platos, etc.'),
(6, 'Roedores y Otros', 'Alimento y accesorios para roedores y otras mascotas pequeñas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `rut` varchar(12) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id_cliente`, `nombre`, `rut`, `email`, `telefono`, `direccion`) VALUES
(1, 'Juan Pérez', '11111111-1', 'juan.perez@example.com', '+56 9 7000 0001', 'Av. Los Perros 123, Coquimbo'),
(2, 'María López', '22222222-2', 'maria.lopez@example.com', '+56 9 7000 0002', 'Calle Los Gatos 456, La Serena'),
(3, 'Carlos Sánchez', '33333333-3', 'carlos.sanchez@example.com', '+56 9 7000 0003', 'Pasaje Mascotas 789, Coquimbo'),
(4, 'Ana Torres', '44444444-4', 'ana.torres@example.com', '+56 9 7000 0004', 'Av. Central 100, La Serena'),
(5, 'Pedro Ramírez', '55555555-5', 'pedro.ramirez@example.com', '+56 9 7000 0005', 'Ruta 5 Norte km 10, Coquimbo');

--
-- Disparadores `clientes`
--
DELIMITER $$
CREATE TRIGGER `trigger_after_actualizar_clientes` AFTER UPDATE ON `clientes` FOR EACH ROW BEGIN
    DECLARE v_cambios VARCHAR(500);
    DECLARE v_tipo_alerta VARCHAR(20);
    
    -- Construir descripción de cambios
    SET v_cambios = CONCAT(
        'Cliente actualizado. ',
        IF(OLD.nombre != NEW.nombre, CONCAT('Nombre: "', OLD.nombre, '" → "', NEW.nombre, '". '), ''),
        IF(OLD.email != NEW.email, CONCAT('Email: "', COALESCE(OLD.email, 'NULL'), '" → "', COALESCE(NEW.email, 'NULL'), '". '), ''),
        IF(OLD.telefono != NEW.telefono, CONCAT('Teléfono: "', COALESCE(OLD.telefono, 'NULL'), '" → "', COALESCE(NEW.telefono, 'NULL'), '". '), ''),
        IF(OLD.direccion != NEW.direccion, CONCAT('Dirección: "', COALESCE(OLD.direccion, 'NULL'), '" → "', COALESCE(NEW.direccion, 'NULL'), '". '), '')
    );
    
    -- Registrar en auditoría
    INSERT INTO auditoria_cambios (tabla_afectada, tipo_operacion, id_registro, descripcion, usuario_sistema)
    VALUES ('clientes', 'UPDATE', NEW.id_cliente, v_cambios, USER());
    
    -- Si cambió el email, generar alerta
    IF OLD.email != NEW.email THEN
        SET v_tipo_alerta = CONCAT('Cambio de email: ', COALESCE(OLD.email, 'SIN EMAIL'), ' → ', COALESCE(NEW.email, 'SIN EMAIL'));
        INSERT INTO auditoria_cambios (tabla_afectada, tipo_operacion, id_registro, descripcion, usuario_sistema)
        VALUES ('clientes', 'ALERTA', NEW.id_cliente, v_tipo_alerta, USER());
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trigger_before_eliminar_clientes` BEFORE DELETE ON `clientes` FOR EACH ROW BEGIN
    DECLARE v_descripcion TEXT;
    DECLARE v_total_pedidos INT;
    
    -- Contar pedidos del cliente
    SELECT COUNT(*) INTO v_total_pedidos FROM pedidos WHERE id_cliente = OLD.id_cliente;
    
    -- Construir descripción detallada
    SET v_descripcion = CONCAT(
        'Cliente eliminado: ID=', OLD.id_cliente, 
        ', RUT="', OLD.rut, 
        '", Nombre="', OLD.nombre, 
        '", Email="', COALESCE(OLD.email, 'SIN EMAIL'),
        '", Teléfono="', COALESCE(OLD.telefono, 'SIN TELÉFONO'),
        '", Total pedidos realizados=', v_total_pedidos
    );
    
    -- Registrar eliminación en auditoría
    INSERT INTO auditoria_cambios (tabla_afectada, tipo_operacion, id_registro, descripcion, usuario_sistema)
    VALUES ('clientes', 'DELETE', OLD.id_cliente, v_descripcion, USER());
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_pedido`
--

CREATE TABLE `detalle_pedido` (
  `id_detalle` int(11) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_vendedor` int(11) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` varchar(20) NOT NULL,
  `total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `id_categoria` int(11) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_producto`, `nombre`, `descripcion`, `id_categoria`, `id_proveedor`, `precio`, `stock`, `activo`) VALUES
(1, 'Croquetas Perro Cachorro 2kg', 'Alimento seco para perro cachorro', 1, 1, 12000.00, 50, 1),
(2, 'Croquetas Perro Adulto 10kg', 'Alimento seco perro adulto', 1, 2, 28000.00, 30, 1),
(3, 'Alimento Gato Indoor 3kg', 'Control bolas de pelo', 2, 3, 15000.00, 40, 1),
(4, 'Arena Sanitaria Aglomerante 10kg', 'Arena para gatos', 4, 4, 9000.00, 60, 1),
(5, 'Snack Perro Huesitos 500g', 'Snacks sabor pollo', 3, 2, 5500.00, 80, 1),
(6, 'Snack Gato Pescado 100g', 'Snacks sabor pescado', 3, 3, 3500.00, 70, 1),
(7, 'Correa Nylon Perro Mediano', 'Correa 1.5m', 5, 5, 8000.00, 25, 1),
(8, 'Juguete Pelota con Sonido', 'Pelota con sonido', 5, 1, 4500.00, 100, 1),
(9, 'Heno Premium Roedores 1kg', 'Heno natural', 6, 4, 7000.00, 35, 1),
(10, 'Jaula Roedor Mediana', 'Jaula metálica', 6, 5, 26000.00, 10, 1);

--
-- Disparadores `productos`
--
DELIMITER $$
CREATE TRIGGER `trigger_after_actualizar_productos` AFTER UPDATE ON `productos` FOR EACH ROW BEGIN
    DECLARE v_cambios VARCHAR(500);
    
    -- Validar que el nuevo stock no sea menor a 0
    IF NEW.stock < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede establecer stock negativo';
    END IF;
    
    -- Construir descripción de cambios
    SET v_cambios = CONCAT(
        'Producto actualizado. ',
        IF(OLD.nombre != NEW.nombre, CONCAT('Nombre: "', OLD.nombre, '" → "', NEW.nombre, '". '), ''),
        IF(OLD.precio != NEW.precio, CONCAT('Precio: ', OLD.precio, ' → ', NEW.precio, '. '), ''),
        IF(OLD.stock != NEW.stock, CONCAT('Stock: ', OLD.stock, ' → ', NEW.stock, '. '), ''),
        IF(OLD.id_proveedor != NEW.id_proveedor, CONCAT('Proveedor: ', OLD.id_proveedor, ' → ', NEW.id_proveedor, '. '), '')
    );
    
    -- Registrar en auditoría
    INSERT INTO auditoria_cambios (tabla_afectada, tipo_operacion, id_registro, descripcion, usuario_sistema)
    VALUES ('productos', 'UPDATE', NEW.id_producto, v_cambios, USER());
    
    -- Si stock es bajo (menor a 10), registrar alerta
    IF NEW.stock < 10 AND NEW.stock > 0 THEN
        INSERT INTO auditoria_cambios (tabla_afectada, tipo_operacion, id_registro, descripcion, usuario_sistema)
        VALUES ('productos', 'ALERTA', NEW.id_producto, 
                CONCAT('STOCK BAJO: Producto "', NEW.nombre, '" tiene solo ', NEW.stock, ' unidades, por favor añadir mas Stock.'), 
                USER());
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trigger_before_eliminar_productos` BEFORE DELETE ON `productos` FOR EACH ROW BEGIN
    DECLARE v_descripcion TEXT;
    
    -- Construir descripción detallada
    SET v_descripcion = CONCAT(
        'Producto eliminado: ID=', OLD.id_producto, 
        ', Nombre="', OLD.nombre, 
        '", Precio=', OLD.precio,
        ', Stock=', OLD.stock,
        ', Categoría ID=', OLD.id_categoria,
        ', Proveedor ID=', OLD.id_proveedor
    );
    
    -- Registrar eliminación en auditoría
    INSERT INTO auditoria_cambios (tabla_afectada, tipo_operacion, id_registro, descripcion, usuario_sistema)
    VALUES ('productos', 'DELETE', OLD.id_producto, v_descripcion, USER());
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id_proveedor` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id_proveedor`, `nombre`, `contacto`, `telefono`, `email`, `direccion`) VALUES
(1, 'PetFoods Chile', 'María Rivera', '+56 2 2345 0001', 'ventas@petfoodschile.cl', 'Av. Industrial 123, Santiago'),
(2, 'Mundo Animal Distribuciones', 'José Gutiérrez', '+56 2 2345 0002', 'contacto@mundoanimal.cl', 'Camino Logístico 321, Santiago'),
(3, 'NutriPet Import', 'Carolina Díaz', '+56 2 2345 0003', 'info@nutripetimport.cl', 'Ruta 68 km 20, Valparaíso'),
(4, 'MascotaFeliz Ltda.', 'Rodrigo Soto', '+56 2 2345 0004', 'ventas@mascotafeliz.cl', 'Av. Principal 456, La Serena'),
(5, 'SuperPets Mayorista', 'Patricia Lagos', '+56 2 2345 0005', 'contacto@superpets.cl', 'Parque Industrial 789, Coquimbo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vendedores`
--

CREATE TABLE `vendedores` (
  `id_vendedor` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `rut` varchar(12) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_contratacion` date DEFAULT NULL,
  `id_administrador` int(11) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `contrasena` varchar(255) DEFAULT '123456',
  `usuario` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `administradores`
--
ALTER TABLE `administradores`
  ADD PRIMARY KEY (`id_administrador`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `usuario` (`usuario`),
  ADD UNIQUE KEY `idx_rut_admin` (`rut`);

--
-- Indices de la tabla `auditoria_cambios`
--
ALTER TABLE `auditoria_cambios`
  ADD PRIMARY KEY (`id_auditoria`),
  ADD KEY `idx_tabla` (`tabla_afectada`),
  ADD KEY `idx_fecha` (`fecha_cambio`);

--
-- Indices de la tabla `categorias_productos`
--
ALTER TABLE `categorias_productos`
  ADD PRIMARY KEY (`id_categoria`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`),
  ADD UNIQUE KEY `rut` (`rut`),
  ADD UNIQUE KEY `idx_rut_cliente` (`rut`);

--
-- Indices de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_pedido` (`id_pedido`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_vendedor` (`id_vendedor`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`),
  ADD KEY `id_categoria` (`id_categoria`),
  ADD KEY `id_proveedor` (`id_proveedor`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id_proveedor`);

--
-- Indices de la tabla `vendedores`
--
ALTER TABLE `vendedores`
  ADD PRIMARY KEY (`id_vendedor`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `idx_rut_vendedor` (`rut`),
  ADD KEY `id_administrador` (`id_administrador`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `administradores`
--
ALTER TABLE `administradores`
  MODIFY `id_administrador` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `auditoria_cambios`
--
ALTER TABLE `auditoria_cambios`
  MODIFY `id_auditoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `categorias_productos`
--
ALTER TABLE `categorias_productos`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `vendedores`
--
ALTER TABLE `vendedores`
  MODIFY `id_vendedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD CONSTRAINT `detalle_pedido_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  ADD CONSTRAINT `detalle_pedido_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`);

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  ADD CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`id_vendedor`) REFERENCES `vendedores` (`id_vendedor`);

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_productos` (`id_categoria`),
  ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`);

--
-- Filtros para la tabla `vendedores`
--
ALTER TABLE `vendedores`
  ADD CONSTRAINT `vendedores_ibfk_1` FOREIGN KEY (`id_administrador`) REFERENCES `administradores` (`id_administrador`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
