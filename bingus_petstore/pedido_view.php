<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Gestión de Pedidos - Bingus Petstore</title>
    <style>
        /* Estilos base consistentes */
        body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        
        /* Header y Botones */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: white; padding: 25px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08); }
        .header h1 { color: #333; font-size: 28px; margin: 0; }
        .header-buttons { display: flex; gap: 10px; align-items: center; }
        
        .btn-volver { background: #95a5a6; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: 600; transition: all 0.3s; }
        .btn-volver:hover { background: #7f8c8d; transform: translateY(-2px); }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        
        /* Tarjetas de Pedido */
        .card { background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.08); overflow: hidden; transition: transform 0.3s; }
        .card:hover { transform: translateY(-5px); }
        
        .card-header { background: #34495e; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .order-id { font-weight: bold; font-size: 18px; }
        .order-date { font-size: 12px; opacity: 0.8; }

        .card-body { padding: 20px; }
        .info-row { margin-bottom: 10px; font-size: 14px; color: #555; display: flex; justify-content: space-between; }
        .total-price { font-size: 20px; font-weight: bold; color: #2c3e50; text-align: right; margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; }

        /* Etiquetas de Estado */
        .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .badge-pagado { background: #d4edda; color: #155724; }
        .badge-pendiente { background: #fff3cd; color: #856404; }
        .badge-cancelado { background: #f8d7da; color: #721c24; }

        .btn-edit { display: block; width: 100%; text-align: center; background: #3498db; color: white; padding: 10px; text-decoration: none; font-weight: bold; margin-top: 15px; border-radius: 5px; }
        .btn-edit:hover { background: #2980b9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Historial de Pedidos</h1>
            <div class="header-buttons">
                <a href="index.php" class="btn-volver">🏠 Volver al Menú</a>
            </div>
        </div>

        <?php if (empty($pedidos)): ?>
            <p style="text-align:center; color:#999;">No hay pedidos registrados.</p>
        <?php else: ?>
            <div class="grid">
                <?php foreach ($pedidos as $p): ?>
                    <?php 
                        // Lógica de colores para el estado
                        $estadoClass = 'badge-pendiente';
                        if($p['estado'] == 'PAGADO') $estadoClass = 'badge-pagado';
                        if($p['estado'] == 'CANCELADO') $estadoClass = 'badge-cancelado';
                    ?>
                <div class="card">
                    <div class="card-header">
                        <span class="order-id">#<?php echo $p['id_pedido']; ?></span>
                        <span class="order-date"><?php echo date('d/m/Y', strtotime($p['fecha'])); ?></span>
                    </div>
                    <div class="card-body">
                        <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                            <span class="badge <?php echo $estadoClass; ?>"><?php echo $p['estado']; ?></span>
                            <span style="font-size:12px; color:#999;">Vendedor: <?php echo htmlspecialchars($p['vendedor_nombre']); ?></span>
                        </div>
                        
                        <div class="info-row">
                            <strong>👤 <?php echo htmlspecialchars($p['cliente_nombre']); ?></strong>
                        </div>
                        
                        <div style="background:#f9f9f9; padding:10px; border-radius:5px; margin:15px 0; font-size:13px;">
                            <p style="margin-bottom:5px; font-weight:bold; color:#666; border-bottom:1px solid #eee; padding-bottom:5px;">Detalle de productos:</p>
                            
                            <?php if (!empty($p['detalles'])): ?>
                                <table style="width:100%; border-collapse:collapse;">
                                    <?php foreach ($p['detalles'] as $item): ?>
                                    <tr>
                                        <td style="padding:3px 0;"><?php echo htmlspecialchars($item['producto_nombre']); ?></td>
                                        <td style="padding:3px 0; text-align:right; color:#666;">x<?php echo $item['cantidad']; ?></td>
                                        <td style="padding:3px 0; text-align:right; font-weight:500;">$<?php echo number_format($item['subtotal'], 0, ',', '.'); ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </table>
                            <?php else: ?>
                                <p style="font-style:italic; color:#999;">Sin detalles.</p>
                            <?php endif; ?>
                        </div>
                        
                        <div class="total-price">
                            Total: $ <?php echo number_format($p['total'], 0, ',', '.'); ?>
                        </div>

                        <a href="?action=editar&id=<?php echo $p['id_pedido']; ?>" class="btn-edit">✏️ Editar Estado</a>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>