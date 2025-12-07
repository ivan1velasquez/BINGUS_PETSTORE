<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Lista de Vendedores - Bingus Petstore</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        
        .header { 
            display: flex; justify-content: space-between; align-items: center; 
            margin-bottom: 30px; background: white; padding: 25px; 
            border-radius: 10px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08); 
        }
        .header h1 { color: #333; font-size: 28px; margin: 0; }
        
        .header-buttons { display: flex; gap: 10px; align-items: center; }

        .btn { padding: 12px 25px; border: none; border-radius: 5px; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; transition: all 0.3s; }
        
        .btn-crear { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .btn-crear:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }

        .btn-volver { background: #95a5a6; color: white; }
        .btn-volver:hover { background: #7f8c8d; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        
        .card { background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.08); overflow: hidden; transition: transform 0.3s; }
        .card:hover { transform: translateY(-5px); }
        
        .card-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; display: flex; align-items: center; gap: 15px; }
        .avatar { font-size: 24px; background: rgba(255,255,255,0.2); width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; }
        
        .card-body { padding: 20px; }
        
        .actions { padding: 15px; border-top: 1px solid #eee; display: flex; gap: 10px; }
        
        .btn-small { flex: 1; padding: 8px; text-align: center; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 13px; color: white; }
        .btn-edit { background: #3498db; }
        .btn-delete { background: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <?php if (isset($_GET['msg']) && $_GET['msg'] == 'creado'): ?>
            <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #c3e6cb;">
                ✅ Vendedor creado exitosamente.
            </div>
        <?php endif; ?>

        <?php if (isset($_GET['msg']) && $_GET['msg'] == 'eliminado'): ?>
            <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #c3e6cb;">
                ✅ Vendedor eliminado correctamente (Soft Delete).
            </div>
        <?php endif; ?>

        <div class="header">
            <h1>👥 Equipo de Ventas</h1>
            <div class="header-buttons">
                <a href="index.php" class="btn btn-volver">🏠 Volver al Menú</a>
                <a href="?action=agregar" class="btn btn-crear">➕ Nuevo Vendedor</a>
            </div>
        </div>

        <?php if (empty($vendedores)): ?>
            <div style="text-align:center; padding:50px; background:white; border-radius:10px;">
                <h2 style="color:#666;">No hay vendedores activos</h2>
                <p style="color:#999;">Comienza agregando miembros a tu equipo.</p>
            </div>
        <?php else: ?>
            <div class="grid">
                <?php foreach ($vendedores as $v): ?>
                <div class="card">
                    <div class="card-header">
                        <div class="avatar">👤</div>
                        <div>
                            <div style="font-weight:bold; font-size:18px;"><?php echo htmlspecialchars($v['nombre']); ?></div>
                            <div style="font-size:12px; opacity:0.9;">ID: #<?php echo $v['id_vendedor']; ?></div>
                        </div>
                    </div>
                    <div class="card-body">
                        <p style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                            <strong>🆔 RUT:</strong> <?php echo htmlspecialchars($v['rut'] ?? 'S/N'); ?>
                        </p>

                        <p><strong>📧 Email:</strong><br> <?php echo htmlspecialchars($v['email']); ?></p>
                        <p><strong>📞 Teléfono:</strong><br> <?php echo htmlspecialchars($v['telefono']); ?></p>
                        <p><strong>📅 Contratado:</strong><br> <?php echo date('d/m/Y', strtotime($v['fecha_contratacion'])); ?></p>
                    </div>
                    <div class="actions">
                        <a href="?action=editar&id=<?php echo $v['id_vendedor']; ?>" class="btn-small btn-edit">✏️ Editar</a>
                        <a href="?action=eliminar&id=<?php echo $v['id_vendedor']; ?>" class="btn-small btn-delete" onclick="return confirm('¿Estás seguro de eliminar a este vendedor?');">🗑️ Eliminar</a>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>