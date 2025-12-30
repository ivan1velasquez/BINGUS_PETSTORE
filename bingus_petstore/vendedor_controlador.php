<?php
session_start();
if (!isset($_SESSION['admin_id'])) {
    header("Location: auth_controlador.php");
    exit();
}

require_once 'vendedor_modelo.php';

class Vendedor_controller {
    private $model;
    private $admin_id;

    public function __construct() {
        $this->model = new Vendedor_model();
        $this->admin_id = $_SESSION['admin_id'];
    }

    public function listar() {
        $vendedores = $this->model->getVendedoresPorAdmin($this->admin_id);
        include 'vendedor_view.php';
    }

    public function formularioCrear() {
        include 'crear_vendedor.php';
    }

    public function guardar() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $nombre = $_POST['nombre'] ?? '';
            $rut = $_POST['rut'] ?? '';
            $email = $_POST['email'] ?? '';
            $telefono = $_POST['telefono'] ?? '';
            $fecha = $_POST['fecha_contratacion'] ?? date('Y-m-d');

            // 1. VALIDACIÓN: ¿Existe el RUT?
            if ($this->model->existeRut($rut)) {
                // Si existe, devolvemos error y detenemos
                header("Location: ?action=agregar&error=rut_duplicado&rut=" . urlencode($rut));
                return;
            }

            // 2. Insertar (incluyendo el RUT)
            $res = $this->model->insertVendedor($nombre, $rut, $email, $telefono, $fecha, $this->admin_id);
            
            if ($res) {
                header("Location: ?action=listar&msg=creado");
            } else {
                echo "Error al guardar en base de datos.";
            }
        }
    }

    public function formularioEditar($id) {
        $vendedor = $this->model->getVendedorById($id, $this->admin_id);
        if ($vendedor) {
            include 'editar_vendedor.php';
        } else {
            header("Location: ?action=listar");
        }
    }

    public function actualizar() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id = $_POST['id_vendedor'];
            $nombre = $_POST['nombre'];
            $rut = $_POST['rut'];
            $email = $_POST['email'];
            $telefono = $_POST['telefono'];
            $fecha = $_POST['fecha_contratacion'];

            // Actualizamos (incluyendo el RUT)
            $this->model->updateVendedor($id, $nombre, $rut, $email, $telefono, $fecha, $this->admin_id);
            header("Location: ?action=listar");
        }
    }

    public function eliminar($id) {
        // Usamos Soft Delete (el modelo hace UPDATE activo = 0)
        // Ya no necesitamos try-catch complejo porque no hay error de integridad
        $this->model->deleteVendedor($id, $this->admin_id);
        header("Location: ?action=listar&msg=eliminado");
    }
}

// Ruteo
$controller = new Vendedor_controller();
$action = $_GET['action'] ?? 'listar';
$id = $_GET['id'] ?? null;

switch($action) {
    case 'listar': $controller->listar(); break;
    case 'agregar': $controller->formularioCrear(); break;
    case 'insertar': $controller->guardar(); break;
    case 'editar': $controller->formularioEditar($id); break;
    case 'actualizar': $controller->actualizar(); break;
    case 'eliminar': $controller->eliminar($id); break;
}
?>