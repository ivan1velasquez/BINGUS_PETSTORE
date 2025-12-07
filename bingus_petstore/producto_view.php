<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lista de Productos - Bingus Petstore</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }

        .header h1 {
            color: #333;
            font-size: 28px;
        }

        .btn-crear {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }

        .btn-crear:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }

        .product-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            transition: all 0.3s;
        }

        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
        }

        .product-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }

        .product-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .product-category {
            font-size: 12px;
            opacity: 0.9;
            background: rgba(255, 255, 255, 0.2);
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            margin-top: 5px;
        }

        .product-body {
            padding: 20px;
        }

        .product-info {
            margin-bottom: 15px;
        }

        .info-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .info-value {
            font-size: 14px;
            color: #333;
            line-height: 1.5;
        }

        .product-price {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 10px;
        }

        .product-stock {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .stock-high {
            background: #d4edda;
            color: #155724;
        }

        .stock-medium {
            background: #fff3cd;
            color: #856404;
        }

        .stock-low {
            background: #f8d7da;
            color: #721c24;
        }

        .product-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }

        .btn-small {
            flex: 1;
            padding: 8px 12px;
            border: none;
            border-radius: 5px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: all 0.3s;
        }

        .btn-edit {
            background: #3498db;
            color: white;
        }

        .btn-edit:hover {
            background: #2980b9;
        }

        .btn-delete {
            background: #e74c3c;
            color: white;
        }

        .btn-delete:hover {
            background: #c0392b;
        }

        .empty-state {
            background: white;
            padding: 60px 20px;
            text-align: center;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }

        .empty-state h2 {
            color: #333;
            margin-bottom: 10px;
        }

        .empty-state p {
            color: #999;
            margin-bottom: 20px;
        }

        .provider-badge {
            display: inline-block;
            background: #ecf0f1;
            color: #2c3e50;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            margin-top: 5px;
        }

        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                gap: 15px;
            }

            .header h1 {
                font-size: 22px;
            }

            .products-grid {
                grid-template-columns: 1fr;
            }
        }
        .header-buttons {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .btn-volver {
            background: #95a5a6; /* Color gris */
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }

        .btn-volver:hover {
            background: #7f8c8d;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <?php if (isset($_GET['error']) && $_GET['error'] == 'dependencia'): ?>
            <div style="background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #f5c6cb;">
                ⚠️ <strong>No se puede eliminar este producto:</strong> <br>
                El producto forma parte de los siguientes pedidos: 
                <strong>#<?php echo htmlspecialchars($_GET['ids'] ?? ''); ?></strong>.
                <br>No se puede borrar para no perder el historial de ventas.
            </div>
        <?php endif; ?>

        <?php if (isset($_GET['msg']) && $_GET['msg'] == 'eliminado'): ?>
            <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #c3e6cb;">
                ✅ Producto eliminado correctamente.
            </div>
        <?php endif; ?>
        <div class="header">
            <h1>🐾 Productos de la Tienda</h1>
            
            <div class="header-buttons">
                <a href="index.php" class="btn-volver">🏠 Volver</a>
                <a href="?action=agregar" class="btn-crear">➕ Agregar Nuevo Producto</a>
            </div>
        </div>

        <?php if (isset($productos) && !empty($productos)): ?>
            <div class="products-grid">
                <?php foreach ($productos as $producto): ?>
                    <div class="product-card">
                        <div class="product-header">
                            <div class="product-name"><?php echo htmlspecialchars($producto['nombre']); ?></div>
                            <span class="product-category"><?php echo htmlspecialchars($producto['categoria_nombre']); ?></span>
                        </div>

                        <div class="product-body">
                            <!-- Descripción -->
                            <?php if (!empty($producto['descripcion'])): ?>
                                <div class="product-info">
                                    <div class="info-label">Descripción</div>
                                    <div class="info-value"><?php echo htmlspecialchars($producto['descripcion']); ?></div>
                                </div>
                            <?php endif; ?>

                            <!-- Precio -->
                            <div class="product-price">$<?php echo number_format($producto['precio'], 0, ',', '.'); ?> CLP</div>

                            <!-- Proveedor -->
                            <div class="product-info">
                                <div class="info-label">Proveedor</div>
                                <span class="provider-badge"><?php echo htmlspecialchars($producto['proveedor_nombre']); ?></span>
                            </div>

                            <!-- Stock -->
                            <div class="product-info">
                                <div class="info-label">Stock Disponible</div>
                                <?php 
                                    $stock = $producto['stock'];
                                    if ($stock >= 50) {
                                        $stock_class = 'stock-high';
                                    } elseif ($stock >= 10) {
                                        $stock_class = 'stock-medium';
                                    } else {
                                        $stock_class = 'stock-low';
                                    }
                                ?>
                                <span class="product-stock <?php echo $stock_class; ?>"><?php echo $stock; ?> unidades</span>
                            </div>

                            <!-- Acciones -->
                            <div class="product-actions">
                                <a href="?action=editar&id_producto=<?php echo $producto['id_producto']; ?>" class="btn-small btn-edit">✏️ Editar</a>
                                <a href="?action=eliminar&id_producto=<?php echo $producto['id_producto']; ?>" class="btn-small btn-delete" onclick="return confirm('¿Estás seguro de eliminar este producto?');">🗑️ Eliminar</a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div class="empty-state">
                <h2>📦 No hay productos registrados</h2>
                <p>Comienza agregando tu primer producto a la tienda</p>
                <a href="?action=agregar" class="btn-crear">➕ Crear Primer Producto</a>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
