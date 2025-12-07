<?php
require_once 'config.php';

class Vendedor_model {
    private $conexion;

    public function __construct() {
        $this->conexion = conectarBD();
    }

    // 1. NUEVA FUNCIÓN: Verificar si existe RUT
    public function existeRut($rut) {
        $query = "SELECT id_vendedor FROM vendedores WHERE rut = :rut LIMIT 1";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':rut', $rut);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 2. ACTUALIZADO: Insertar con RUT
    public function insertVendedor($nombre, $rut, $email, $telefono, $fecha, $id_admin) {
        // Agregamos rut a la consulta
        $query = "INSERT INTO vendedores (nombre, rut, email, telefono, fecha_contratacion, id_administrador, activo) 
                  VALUES (:nombre, :rut, :email, :telefono, :fecha, :id_admin, 1)";
        $stmt = $this->conexion->prepare($query);
        
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':rut', $rut); // Nuevo bind
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':telefono', $telefono);
        $stmt->bindParam(':fecha', $fecha);
        $stmt->bindParam(':id_admin', $id_admin);
        
        return $stmt->execute();
    }

    // 3. ACTUALIZADO: Editar con RUT
    public function updateVendedor($id_vendedor, $nombre, $rut, $email, $telefono, $fecha, $id_admin) {
        $query = "UPDATE vendedores SET nombre = :nombre, rut = :rut, email = :email, telefono = :telefono, fecha_contratacion = :fecha 
                  WHERE id_vendedor = :id_vendedor AND id_administrador = :id_admin";
        $stmt = $this->conexion->prepare($query);
        
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':rut', $rut); // Nuevo bind
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':telefono', $telefono);
        $stmt->bindParam(':fecha', $fecha);
        $stmt->bindParam(':id_vendedor', $id_vendedor);
        $stmt->bindParam(':id_admin', $id_admin);
        
        return $stmt->execute();
    }

    // ... (Mantén tus otras funciones getVendedoresPorAdmin, deleteVendedor, etc. igual que antes) ...
    public function getVendedoresPorAdmin($id_administrador) {
        $query = "SELECT * FROM vendedores WHERE id_administrador = :id_admin AND activo = 1 ORDER BY fecha_contratacion DESC";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_admin', $id_administrador);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getVendedorById($id_vendedor, $id_administrador) {
        $query = "SELECT * FROM vendedores WHERE id_vendedor = :id_vendedor AND id_administrador = :id_admin";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_vendedor', $id_vendedor);
        $stmt->bindParam(':id_admin', $id_administrador);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function deleteVendedor($id_vendedor, $id_admin) {
        $query = "UPDATE vendedores SET activo = 0 WHERE id_vendedor = :id_vendedor AND id_administrador = :id_admin";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_vendedor', $id_vendedor);
        $stmt->bindParam(':id_admin', $id_admin);
        return $stmt->execute();
    }
}
?>