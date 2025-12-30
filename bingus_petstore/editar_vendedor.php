<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Editar Vendedor - Bingus Petstore</title>
    <style>
        /* Estilos unificados */
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
        
        .id-badge {
            background: #f8f9fa; padding: 8px 12px; border-radius: 5px;
            font-size: 12px; color: #666; display: inline-block; margin-bottom: 20px;
        }

        /* BOTONES */
        .button-group { display: flex; gap: 10px; margin-top: 20px; }
        button {
            flex: 1; padding: 12px; border: none; border-radius: 5px;
            font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s;
        }
        .btn-primary { background: #3498db; color: white; } /* Azul para editar */
        .btn-primary:hover { background: #2980b9; transform: translateY(-2px); }
        
        .btn-secondary { background: #ecf0f1; color: #333; }
        .btn-secondary:hover { background: #bdc3c7; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✏️ Editar Vendedor</h1>
        <p class="subtitle">Actualiza la información del personal</p>

        <?php if ($vendedor): ?>
        <form action="?action=actualizar" method="POST">
            <input type="hidden" name="id_vendedor" value="<?php echo $vendedor['id_vendedor']; ?>">
            
            <div class="id-badge">ID Vendedor: #<?php echo $vendedor['id_vendedor']; ?></div>

            <label>Nombre Completo</label>
            <input type="text" name="nombre" required value="<?php echo htmlspecialchars($vendedor['nombre']); ?>">
            
            <label>Email Corporativo</label>
            <input type="email" name="email" required value="<?php echo htmlspecialchars($vendedor['email']); ?>">
            
            <label>Teléfono</label>
            <input type="text" name="telefono" value="<?php echo htmlspecialchars($vendedor['telefono']); ?>">
            
            <label>Fecha Contratación</label>
            <input type="date" name="fecha_contratacion" value="<?php echo $vendedor['fecha_contratacion']; ?>" required>
            
            <div class="button-group">
                <button type="submit" class="btn-primary">💾 Guardar Cambios</button>
                <button type="button" class="btn-secondary" onclick="history.back()">← Cancelar</button>
            </div>
        </form>
        <?php else: ?>
            <p>Vendedor no encontrado.</p>
            <button type="button" class="btn-secondary" onclick="history.back()">← Volver</button>
        <?php endif; ?>
    </div>
</body>
</html>