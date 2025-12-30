<?php
session_start();
require_once 'auth_modelo.php';

class Auth_controller {
    private $model;

    public function __construct() {
        $this->model = new Auth_model();
    }

    public function login() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $usuario = $_POST['usuario'] ?? '';
            $password = $_POST['password'] ?? '';

            $admin = $this->model->validarLogin($usuario, $password);

            if ($admin) {
                $_SESSION['admin_id'] = $admin['id_administrador'];
                $_SESSION['admin_nombre'] = $admin['nombre'];
                $_SESSION['admin_usuario'] = $admin['usuario'];
                
                header("Location: index.php");
                exit();
            } else {
                $error = "Usuario o contraseña incorrectos.";
                include 'login.php';
            }
        } else {
            include 'login.php';
        }
    }

    public function logout() {
        session_destroy();
        header("Location: login.php");
        exit();
    }
}

$auth = new Auth_controller();

if (isset($_GET['action'])) {
    if ($_GET['action'] === 'login') {
        $auth->login();
    } elseif ($_GET['action'] === 'logout') {
        $auth->logout();
    }
} else {
    if (isset($_SESSION['admin_id'])) {
        header("Location: index.php");
    } else {
        $auth->login();
    }
}
?>