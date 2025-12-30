<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Producto - Bingus Petstore</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }

        input[type="text"],
        input[type="number"],
        textarea,
        select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            font-family: inherit;
            transition: border-color 0.3s;
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        textarea {
            resize: vertical;
            min-height: 100px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .form-row .form-group {
            margin-bottom: 0;
        }

        .required {
            color: #e74c3c;
        }

        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 30px;
        }

        button,
        a.button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: #ecf0f1;
            color: #333;
        }

        .btn-secondary:hover {
            background: #bdc3c7;
        }

        .info-box {
            background: #e8f4f8;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            font-size: 13px;
            color: #2c3e50;
        }

        .info-box strong {
            color: #2980b9;
        }

        .product-id {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }

        @media (max-width: 600px) {
            .container {
                padding: 25px;
            }

            h1 {
                font-size: 24px;
            }

            .form-row {
                grid-template-columns: 1fr;
            }

            .button-group {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✏️ Editar Producto</h1>
        <p class="subtitle">Actualiza la información del producto</p>

        <div class="info-box">
            <strong>📌 Nota:</strong> Los campos marcados con <span class="required">*</span> son obligatorios.
        </div>

        <?php if (isset($producto) && !empty($producto)): ?>
            <form method="POST" action="?action=actualizar">
                <!-- ID del Producto (Oculto) -->
                <input type="hidden" name="id_producto" value="<?php echo $producto['id_producto']; ?>">

                <div class="product-id">
                    ID del Producto: #<?php echo $producto['id_producto']; ?>
                </div>

                <!-- Nombre del Producto -->
                <div class="form-group">
                    <label for="nombre">Nombre del Producto <span class="required">*</span></label>
                    <input type="text" id="nombre" name="nombre" required value="<?php echo htmlspecialchars($producto['nombre']); ?>">
                </div>

                <!-- Descripción -->
                <div class="form-group">
                    <label for="descripcion">Descripción</label>
                    <textarea id="descripcion" name="descripcion"><?php echo htmlspecialchars($producto['descripcion'] ?? ''); ?></textarea>
                </div>

                <!-- Categoría y Proveedor -->
                <div class="form-row">
                    <div class="form-group">
                        <label for="id_categoria">Categoría <span class="required">*</span></label>
                        <select id="id_categoria" name="id_categoria" required>
                            <option value="">-- Selecciona una categoría --</option>
                            <?php if (isset($categorias) && !empty($categorias)): ?>
                                <?php foreach ($categorias as $categoria): ?>
                                    <option value="<?php echo $categoria['id_categoria']; ?>" 
                                        <?php if ($categoria['id_categoria'] == $producto['id_categoria']) echo 'selected'; ?>>
                                        <?php echo htmlspecialchars($categoria['nombre']); ?>
                                    </option>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="id_proveedor">Proveedor <span class="required">*</span></label>
                        <select id="id_proveedor" name="id_proveedor" required>
                            <option value="">-- Selecciona un proveedor --</option>
                            <?php if (isset($proveedores) && !empty($proveedores)): ?>
                                <?php foreach ($proveedores as $proveedor): ?>
                                    <option value="<?php echo $proveedor['id_proveedor']; ?>"
                                        <?php if ($proveedor['id_proveedor'] == $producto['id_proveedor']) echo 'selected'; ?>>
                                        <?php echo htmlspecialchars($proveedor['nombre']); ?>
                                    </option>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </select>
                    </div>
                </div>

                <!-- Precio y Stock -->
                <div class="form-row">
                    <div class="form-group">
                        <label for="precio">Precio (CLP) <span class="required">*</span></label>
                        <input type="number" id="precio" name="precio" step="0.01" min="0" required value="<?php echo $producto['precio']; ?>">
                    </div>

                    <div class="form-group">
                        <label for="stock">Stock <span class="required">*</span></label>
                        <input type="number" id="stock" name="stock" min="0" required value="<?php echo $producto['stock']; ?>">
                    </div>
                </div>

                <!-- Botones -->
                <div class="button-group">
                    <button type="submit" class="btn-primary">💾 Guardar Cambios</button>
                    <a href="?action=listar" class="button btn-secondary">← Cancelar</a>
                </div>
            </form>
        <?php else: ?>
            <div class="info-box" style="background: #f8d7da; border-left-color: #721c24;">
                <strong style="color: #721c24;">⚠️ Error:</strong> Producto no encontrado.
                <br><br>
                <a href="?action=listar" class="button btn-secondary" style="display: inline-block;">← Volver al Listado</a>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
