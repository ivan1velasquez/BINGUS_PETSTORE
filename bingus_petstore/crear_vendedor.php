<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Nuevo Vendedor - Bingus Petstore</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px;
        }
        .container {
            background: white; border-radius: 10px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            padding: 40px; max-width: 600px; width: 100%;
        }
        h1 { color: #333; margin-bottom: 10px; font-size: 28px; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 14px; }
        
        label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; font-size: 14px; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 20px; font-size: 14px; }
        input:focus { border-color: #667eea; outline: none; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }

        /* Estilos de botones */
        .button-group { display: flex; gap: 10px; margin-top: 10px; }
        button {
            flex: 1; padding: 12px; border: none; border-radius: 5px;
            font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s;
        }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
        
        .btn-secondary { background: #ecf0f1; color: #333; }
        .btn-secondary:hover { background: #bdc3c7; }
    </style>
</head>
<body>
    <div class="container">
        <h1>➕ Nuevo Vendedor</h1>
        <p class="subtitle">Ingresa los datos del nuevo integrante del equipo</p>

        <?php if (isset($_GET['error']) && $_GET['error'] == 'rut_duplicado'): ?>
            <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 5px solid #c0392b;">
                ⚠️ <strong>Error de Identidad:</strong>
                <br>El RUT <strong><?php echo htmlspecialchars($_GET['rut'] ?? ''); ?></strong> ya está registrado en el sistema.
                <br>Por favor verifica que el vendedor no esté registrado previamente.
            </div>
        <?php endif; ?>

        <form action="?action=insertar" method="POST">
            <label>Nombre Completo</label>
            <input type="text" name="nombre" required placeholder="Ej: Laura Gómez">

            <label>RUT (Identidad)</label>
            <input type="text" name="rut" required placeholder="Ej: 11.111.111-1">
            
            <label>Email Corporativo</label>
            <input type="email" name="email" required placeholder="laura@tienda.cl">
            
            <label>Teléfono</label>
            <input type="text" name="telefono" placeholder="+56 9 1234 5678">
            
            <label>Fecha Contratación</label>
            <input type="date" name="fecha_contratacion" value="<?php echo date('Y-m-d'); ?>" required>
            
            <div class="button-group">
                <button type="submit" class="btn-primary">💾 Guardar Vendedor</button>
                <button type="button" class="btn-secondary" onclick="history.back()">← Cancelar</button>
            </div>
        </form>
    </div>
</body>
</html>