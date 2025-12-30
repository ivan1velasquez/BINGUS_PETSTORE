<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Editar Pedido - Bingus Petstore</title>
    <style>
        /* Estilos unificados con Crear Producto/Vendedor */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px;
        }
        .container {
            background: white; border-radius: 10px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            padding: 40px; max-width: 500px; width: 100%;
        }
        h1 { color: #333; margin-bottom: 10px; font-size: 28px; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 14px; }
        
        label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
        input, select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 20px; font-size: 14px; }
        
        .id-badge { background: #34495e; color: white; padding: 5px 10px; border-radius: 4px; display: inline-block; font-size: 12px; margin-bottom: 20px; }

        /* GRUPO DE BOTONES CONSISTENTE */
        .button-group { display: flex; gap: 10px; margin-top: 10px; }
        button { flex: 1; padding: 12px; border: none; border-radius: 5px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        
        .btn-primary { background: #3498db; color: white; }
        .btn-primary:hover { background: #2980b9; transform: translateY(-2px); }
        
        .btn-secondary { background: #ecf0f1; color: #333; }
        .btn-secondary:hover { background: #bdc3c7; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✏️ Editar Pedido</h1>
        <div class="id-badge">Pedido #<?php echo $pedido['id_pedido']; ?></div>
        
        <form action="?action=actualizar" method="POST">
            <input type="hidden" name="id_pedido" value="<?php echo $pedido['id_pedido']; ?>">

            <label>Estado del Pedido</label>
            <select name="estado">
                <option value="PENDIENTE" <?php if($pedido['estado'] == 'PENDIENTE') echo 'selected'; ?>>🟡 PENDIENTE</option>
                <option value="PAGADO" <?php if($pedido['estado'] == 'PAGADO') echo 'selected'; ?>>🟢 PAGADO</option>
                <option value="CANCELADO" <?php if($pedido['estado'] == 'CANCELADO') echo 'selected'; ?>>🔴 CANCELADO</option>
            </select>

            <label>Vendedor Asignado</label>
            <select name="id_vendedor">
                <?php foreach($vendedores as $v): ?>
                    <option value="<?php echo $v['id_vendedor']; ?>" 
                        <?php if($pedido['id_vendedor'] == $v['id_vendedor']) echo 'selected'; ?>>
                        <?php echo htmlspecialchars($v['nombre']); ?>
                    </option>
                <?php endforeach; ?>
            </select>

            <label>Total ($)</label>
            <input type="number" name="total" value="<?php echo $pedido['total']; ?>" step="0.01">

            <div class="button-group">
                <button type="submit" class="btn-primary">💾 Guardar Cambios</button>
                <button type="button" class="btn-secondary" onclick="history.back()">← Cancelar</button>
            </div>
        </form>
    </div>
</body>
</html>