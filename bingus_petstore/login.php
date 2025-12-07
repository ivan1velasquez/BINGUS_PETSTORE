<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - Bingus Petstore</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0;
        }
        .login-container {
            background: white; padding: 40px; border-radius: 10px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2); width: 100%; max-width: 400px; text-align: center;
        }
        h1 { color: #333; margin-bottom: 20px; font-size: 26px; }
        .input-group { margin-bottom: 20px; text-align: left; }
        label { display: block; margin-bottom: 8px; color: #666; font-size: 14px; }
        input {
            width: 100%; padding: 12px; border: 1px solid #ddd;
            border-radius: 5px; box-sizing: border-box; font-size: 16px;
        }
        input:focus { border-color: #667eea; outline: none; }
        button {
            width: 100%; padding: 12px; border: none; border-radius: 5px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; font-size: 16px; font-weight: bold; cursor: pointer; transition: transform 0.2s;
        }
        button:hover { transform: translateY(-2px); }
        .error {
            background: #fee; color: #c00; padding: 10px;
            border-radius: 5px; margin-bottom: 20px; font-size: 14px;
            display: <?php echo isset($error) ? 'block' : 'none'; ?>;
        }
        .footer-link { margin-top: 20px; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>🔐 Acceso Admin</h1>
        
        <?php if(isset($error)): ?>
            <div class="error"><?php echo $error; ?></div>
        <?php endif; ?>

        <form method="POST" action="auth_controlador.php?action=login">
            <div class="input-group">
                <label for="usuario">Usuario</label>
                <input type="text" id="usuario" name="usuario" required placeholder="Ej: cmorales">
            </div>
            <div class="input-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" required placeholder="••••••">
            </div>
            <button type="submit">Ingresar al Sistema</button>
        </form>
        
        <div class="footer-link">Bingus Petstore © 2025</div>
    </div>
</body>
</html>