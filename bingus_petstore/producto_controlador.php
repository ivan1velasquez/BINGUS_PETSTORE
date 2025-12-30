<?php
session_start();
if (!isset($_SESSION['admin_id'])) {
    header("Location: auth_controlador.php");
    exit();
}

require_once 'producto_modelo.php';

class Producto_controller {

    private $model;

    public function __construct() {
        $this->model = new Producto_model();
    }

    // Cargar lista de productos
    public function cargarProductos() {
        $productos = $this->model->getProductos();
        include 'producto_view.php';
    }

    // Mostrar formulario para crear nuevo producto
    public function mostrarFormulario() {
        $categorias = $this->model->getCategorias();
        $proveedores = $this->model->getProveedores();
        include 'crear_producto.php';
    }

    // Agregar nuevo producto
    public function agregarProducto() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $nombre = $_POST['nombre'] ?? '';
            $descripcion = $_POST['descripcion'] ?? '';
            $id_categoria = $_POST['id_categoria'] ?? '';
            $id_proveedor = $_POST['id_proveedor'] ?? '';
            $precio = $_POST['precio'] ?? '';
            $stock = $_POST['stock'] ?? '';

            if ($this->model->existeProducto($nombre)) {
                // Si existe, volvemos al formulario con un error
                header("Location: ?action=agregar&error=existe&nombre=" . urlencode($nombre));
                return; // Detenemos la ejecución
            }

            // Validaciones básicas
            if (empty($nombre) || empty($id_categoria) || empty($id_proveedor) || empty($precio) || empty($stock)) {
                echo "Error: Todos los campos obligatorios deben estar completos";
                return;
            }

            if ($precio < 0) {
                echo "Error: El precio no puede ser negativo";
                return;
            }

            if ($stock < 0) {
                echo "Error: El stock no puede ser negativo";
                return;
            }

            $resultado = $this->model->insertProducto($nombre, $descripcion, $id_categoria, $id_proveedor, $precio, $stock);

            if ($resultado) {
                echo "Producto agregado correctamente";
                header("Location: ?action=listar");
            } else {
                echo "Error al agregar el producto";
            }
        }
    }

    // Mostrar formulario para editar producto
    public function mostrarEditarFormulario($id_producto) {
        $producto = $this->model->getProductoById($id_producto);
        $categorias = $this->model->getCategorias();
        $proveedores = $this->model->getProveedores();
        include 'editar_producto.php';
    }

    // Editar producto
    public function editarProducto() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id_producto = $_POST['id_producto'] ?? '';
            $nombre = $_POST['nombre'] ?? '';
            $descripcion = $_POST['descripcion'] ?? '';
            $id_categoria = $_POST['id_categoria'] ?? '';
            $id_proveedor = $_POST['id_proveedor'] ?? '';
            $precio = $_POST['precio'] ?? '';
            $stock = $_POST['stock'] ?? '';

            // Validaciones
            if (empty($id_producto) || empty($nombre) || empty($id_categoria) || empty($id_proveedor) || empty($precio)) {
                echo "Error: Todos los campos obligatorios deben estar completos";
                return;
            }

            $resultado = $this->model->updateProducto($id_producto, $nombre, $descripcion, $id_categoria, $id_proveedor, $precio, $stock);

            if ($resultado) {
                echo "Producto actualizado correctamente";
                header("Location: ?action=listar");
            } else {
                echo "Error al actualizar el producto";
            }
        }
    }

    // Eliminar producto
    public function eliminarProducto($id_producto) {
        // Ahora siempre será exitoso, porque es solo un cambio de estado
        $this->model->deleteProducto($id_producto);
        header("Location: ?action=listar&msg=eliminado");
    }

}

// Uso del controlador
$productoController = new Producto_controller();

// Acciones según las rutas
if (isset($_GET['action'])) {
    $action = $_GET['action'];
    switch ($action) {
        case 'listar':
            $productoController->cargarProductos();
            break;
        case 'agregar':
            $productoController->mostrarFormulario();
            break;
        case 'insertar':
            $productoController->agregarProducto();
            break;
        case 'editar':
            $id_producto = $_GET['id_producto'] ?? '';
            $productoController->mostrarEditarFormulario($id_producto);
            break;
        case 'actualizar':
            $productoController->editarProducto();
            break;
        case 'eliminar':
            $id_producto = $_GET['id_producto'] ?? '';
            $productoController->eliminarProducto($id_producto);
            break;
        default:
            $productoController->cargarProductos();
    }
} else {
    $productoController->cargarProductos();
}

?>
