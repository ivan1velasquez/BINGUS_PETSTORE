<?php

class Producto_model {

    private $conexion;

    public function __construct() {
        // Cambiar por el nombre de tu base de datos, usuario y contraseña
        $this->conexion = new PDO("mysql:host=localhost;dbname=bingus_petstore2", "root", "");
    }

    // Obtener todos los productos
    public function getProductos() {
        // Solo traemos los que tengan activo = 1
        $query = "SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre 
                  FROM productos p 
                  JOIN categorias_productos c ON p.id_categoria = c.id_categoria 
                  JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
                  WHERE p.activo = 1"; // <--- CAMBIO AQUÍ
        $statement = $this->conexion->query($query);
        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obtener producto por ID
    public function getProductoById($id_producto) {
        $query = "SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre 
                  FROM productos p 
                  JOIN categorias_productos c ON p.id_categoria = c.id_categoria 
                  JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor 
                  WHERE p.id_producto = :id_producto";
        $statement = $this->conexion->prepare($query);
        $statement->bindParam(':id_producto', $id_producto);
        $statement->execute();
        $result = $statement->fetch(PDO::FETCH_ASSOC);
        return $result;
    }

    // Insertar nuevo producto
    public function insertProducto($nombre, $descripcion, $id_categoria, $id_proveedor, $precio, $stock) {
        $query = "INSERT INTO productos (nombre, descripcion, id_categoria, id_proveedor, precio, stock) 
                  VALUES (:nombre, :descripcion, :id_categoria, :id_proveedor, :precio, :stock)";
        $statement = $this->conexion->prepare($query);
        
        $statement->bindParam(':nombre', $nombre);
        $statement->bindParam(':descripcion', $descripcion);
        $statement->bindParam(':id_categoria', $id_categoria);
        $statement->bindParam(':id_proveedor', $id_proveedor);
        $statement->bindParam(':precio', $precio);
        $statement->bindParam(':stock', $stock);
        
        $result = $statement->execute();
        return $result;
    }

    // Actualizar producto
    public function updateProducto($id_producto, $nombre, $descripcion, $id_categoria, $id_proveedor, $precio, $stock) {
        $query = "UPDATE productos SET nombre = :nombre, descripcion = :descripcion, 
                  id_categoria = :id_categoria, id_proveedor = :id_proveedor, 
                  precio = :precio, stock = :stock WHERE id_producto = :id_producto";
        $statement = $this->conexion->prepare($query);
        
        $statement->bindParam(':id_producto', $id_producto);
        $statement->bindParam(':nombre', $nombre);
        $statement->bindParam(':descripcion', $descripcion);
        $statement->bindParam(':id_categoria', $id_categoria);
        $statement->bindParam(':id_proveedor', $id_proveedor);
        $statement->bindParam(':precio', $precio);
        $statement->bindParam(':stock', $stock);
        
        $result = $statement->execute();
        return $result;
    }

    // Obtener todas las categorías
    public function getCategorias() {
        $query = "SELECT * FROM categorias_productos";
        $statement = $this->conexion->query($query);
        $result = $statement->fetchAll(PDO::FETCH_ASSOC);
        return $result;
    }

    // Obtener todos los proveedores
    public function getProveedores() {
        $query = "SELECT * FROM proveedores";
        $statement = $this->conexion->query($query);
        $result = $statement->fetchAll(PDO::FETCH_ASSOC);
        return $result;
    }

    // Eliminar producto
    public function deleteProducto($id_producto) {
        // En lugar de borrar, actualizamos activo a 0
        $query = "UPDATE productos SET activo = 0 WHERE id_producto = :id_producto";
        $statement = $this->conexion->prepare($query);
        $statement->bindParam(':id_producto', $id_producto);
        return $statement->execute();
    }

    // Verificar si existe un producto por nombre (sin importar si está activo o borrado)
    public function existeProducto($nombre) {
        $query = "SELECT id_producto FROM productos WHERE nombre = :nombre LIMIT 1";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':nombre', $nombre);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC); // Retorna datos si existe, false si no
    }

}

?>
