<?php
session_start();
if (!isset($_SESSION['admin_id'])) {
    header("Location: auth_controlador.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bingus Petstore - Sistema de Gestión</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px;
        }
        .container { max-width: 1000px; width: 100%; }
        .header { text-align: center; color: white; margin-bottom: 50px; }
        .header h1 { font-size: 48px; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); }
        .header p { font-size: 18px; opacity: 0.9; }
        
        /* Logout en la esquina */
        .user-info { position: absolute; top: 20px; right: 20px; color: white; }
        .user-info a { color: white; text-decoration: underline; margin-left: 10px; }

        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-bottom: 40px; }
        
        .card {
            background: white; border-radius: 12px; padding: 40px 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); transition: all 0.3s;
            text-decoration: none; color: inherit; text-align: center; display: block;
        }
        .card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); }
        .card-icon { font-size: 60px; margin-bottom: 20px; }
        .card h3 { color: #333; margin-bottom: 15px; font-size: 24px; }
        .card p { color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 25px; }
        
        .card-action {
            display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 12px 30px; border-radius: 5px; font-weight: 600; font-size: 16px;
        }
        
        .footer { text-align: center; color: white; font-size: 14px; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="user-info">
        Hola, <?php echo $_SESSION['admin_nombre']; ?> 
        <a href="auth_controlador.php?action=logout">Cerrar Sesión</a>
    </div>

    <div class="container">
        <div class="header">
            <h1>🐾 Bingus Petstore</h1>
            <p>Sistema de Gestión de Productos</p>
        </div>

        <div class="grid">
            <a href="producto_controlador.php?action=listar" class="card">
                <div class="card-icon">📦</div>
                <h3>Productos</h3>
                <p>Gestiona el inventario, precios y stock disponible.</p>
                <span class="card-action">Ir a Productos →</span>
            </a>

            <a href="vendedor_controlador.php?action=listar" class="card">
                <div class="card-icon">👥</div>
                <h3>Vendedores</h3>
                <p>Gestiona tu equipo de ventas asignado.</p>
                <span class="card-action">Ir a Vendedores →</span>
            </a>

            <a href="pedido_controlador.php?action=listar" class="card">
                <div class="card-icon">📋</div>
                <h3>Pedidos</h3>
                <p>Revisa el historial y actualiza estados.</p>
                <span class="card-action">Ver Pedidos →</span>
            </a>
        </div>

        <div class="footer">
            <p>🐾 Bingus Petstore - Sistema de Gestión © 2025</p>
        </div>
    </div>
</body>
</html>