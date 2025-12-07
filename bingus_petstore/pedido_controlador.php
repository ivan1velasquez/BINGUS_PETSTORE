<?php
session_start();
if (!isset($_SESSION['admin_id'])) {
    header("Location: auth_controlador.php");
    exit();
}

require_once 'pedido_modelo.php';

class Pedido_controller {
    private $model;

    public function __construct() {
        $this->model = new Pedido_model();
    }

    public function listar() {
        $pedidos = $this->model->getPedidos();
        foreach ($pedidos as &$p) {
            $p['detalles'] = $this->model->getDetallesPedido($p['id_pedido']);
        }
        unset($p);
        include 'pedido_view.php';
    }

    public function editar($id) {
        $pedido = $this->model->getPedidoById($id);
        $vendedores = $this->model->getVendedores();
        
        if ($pedido) {
            include 'editar_pedido.php';
        } else {
            header("Location: ?action=listar");
        }
    }

    public function actualizar() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id_pedido = $_POST['id_pedido'];
            $estado = $_POST['estado'];
            $id_vendedor = $_POST['id_vendedor'];
            $total = $_POST['total'];

            $this->model->updatePedido($id_pedido, $estado, $id_vendedor, $total);
            header("Location: ?action=listar");
        }
    }
}

// Ruteo
$controller = new Pedido_controller();
$action = $_GET['action'] ?? 'listar';
$id = $_GET['id'] ?? null;

switch($action) {
    case 'listar': $controller->listar(); break;
    case 'editar': $controller->editar($id); break;
    case 'actualizar': $controller->actualizar(); break;
}
?>