<?php
require_once 'config.php';

class Pedido_model {
    private $conexion;

    public function __construct() {
        $this->conexion = conectarBD();
    }

    // Obtener todos los pedidos con nombres de cliente y vendedor
    public function getPedidos() {
        // Agregamos GROUP BY p.id_pedido para asegurar que cada pedido salga solo una vez
        $query = "SELECT p.*, c.nombre as cliente_nombre, v.nombre as vendedor_nombre 
                  FROM pedidos p 
                  JOIN clientes c ON p.id_cliente = c.id_cliente 
                  JOIN vendedores v ON p.id_vendedor = v.id_vendedor 
                  GROUP BY p.id_pedido 
                  ORDER BY p.fecha ASC";
                  
        $stmt = $this->conexion->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obtener un pedido específico para editar
    public function getPedidoById($id) {
        $query = "SELECT * FROM pedidos WHERE id_pedido = :id";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Actualizar datos principales del pedido
    public function updatePedido($id_pedido, $estado, $id_vendedor, $total) {
        $query = "UPDATE pedidos SET estado = :estado, id_vendedor = :id_vendedor, total = :total 
                  WHERE id_pedido = :id_pedido";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':estado', $estado);
        $stmt->bindParam(':id_vendedor', $id_vendedor);
        $stmt->bindParam(':total', $total);
        $stmt->bindParam(':id_pedido', $id_pedido);
        return $stmt->execute();
    }

    // Helpers para llenar los selectores en el formulario de edición
    public function getVendedores() {
        $stmt = $this->conexion->query("SELECT id_vendedor, nombre FROM vendedores");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getDetallesPedido($id_pedido) {
        $query = "SELECT dp.*, p.nombre as producto_nombre 
                  FROM detalle_pedido dp 
                  JOIN productos p ON dp.id_producto = p.id_producto 
                  WHERE dp.id_pedido = :id_pedido";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_pedido', $id_pedido);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>