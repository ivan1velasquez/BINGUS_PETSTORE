<?php
require_once 'config.php';

class Auth_model {
    private $conexion;

    public function __construct() {
        $this->conexion = conectarBD();
    }

    public function validarLogin($usuario, $password) {
        $query = "SELECT * FROM administradores WHERE usuario = :usuario LIMIT 1";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':usuario', $usuario);
        $stmt->execute();
        
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($admin) {
            if ($password === $admin['contrasena']) {
                return $admin;
            }
        }
        return false;
    }
}
?>