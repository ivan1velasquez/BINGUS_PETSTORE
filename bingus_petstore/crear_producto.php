<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crear Nuevo Producto - Bingus Petstore</title>
    <style>
        /* Estilos idénticos a los originales */
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
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; font-size: 14px; }
        input[type="text"], input[type="number"], textarea, select {
            width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; font-family: inherit; transition: border-color 0.3s;
        }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
        textarea { resize: vertical; min-height: 100px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-row .form-group { margin-bottom: 0; }
        .required { color: #e74c3c; }

        /* ESTILOS DE BOTONES */
        .button-group { display: flex; gap: 10px; margin-top: 30px; }
        button {
            flex: 1; padding: 12px; border: none; border-radius: 5px;
            font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
        
        .btn-secondary { background: #ecf0f1; color: #333; }
        .btn-secondary:hover { background: #bdc3c7; }

        .info-box {
            background: #e8f4f8; border-left: 4px solid #3498db; padding: 15px;
            margin-bottom: 20px; border-radius: 5px; font-size: 13px; color: #2c3e50;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐾 Crear Nuevo Producto</h1>
        <p class="subtitle">Completa el formulario para agregar un nuevo producto a la tienda</p>

        <?php if (isset($_GET['error']) && $_GET['error'] == 'existe'): ?>
            <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 5px solid #c0392b;">
                ⚠️ <strong>Error:</strong> El producto "<strong><?php echo htmlspecialchars($_GET['nombre'] ?? ''); ?></strong>" ya existe en la base de datos.
                <br>Por favor verifica el nombre o actualiza el stock del producto existente.
            </div>
        <?php endif; ?>

        <div class="info-box">
            <strong>📌 Nota:</strong> Los campos marcados con <span class="required">*</span> son obligatorios.
        </div>

        <form method="POST" action="?action=insertar">
            <div class="form-group">
                <label for="nombre">Nombre del Producto <span class="required">*</span></label>
                <input type="text" id="nombre" name="nombre" required placeholder="Ej: Croquetas Perro Cachorro 2kg">
            </div>

            <div class="form-group">
                <label for="descripcion">Descripción</label>
                <textarea id="descripcion" name="descripcion" placeholder="Describe el producto..."></textarea>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="id_categoria">Categoría <span class="required">*</span></label>
                    <select id="id_categoria" name="id_categoria" required>
                        <option value="">-- Selecciona --</option>
                        <?php if (isset($categorias) && !empty($categorias)): ?>
                            <?php foreach ($categorias as $categoria): ?>
                                <option value="<?php echo $categoria['id_categoria']; ?>"><?php echo htmlspecialchars($categoria['nombre']); ?></option>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="id_proveedor">Proveedor <span class="required">*</span></label>
                    <select id="id_proveedor" name="id_proveedor" required>
                        <option value="">-- Selecciona --</option>
                        <?php if (isset($proveedores) && !empty($proveedores)): ?>
                            <?php foreach ($proveedores as $proveedor): ?>
                                <option value="<?php echo $proveedor['id_proveedor']; ?>"><?php echo htmlspecialchars($proveedor['nombre']); ?></option>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="precio">Precio (CLP) <span class="required">*</span></label>
                    <input type="number" id="precio" name="precio" step="0.01" min="0" required placeholder="Ej: 12000">
                </div>

                <div class="form-group">
                    <label for="stock">Stock <span class="required">*</span></label>
                    <input type="number" id="stock" name="stock" min="0" required placeholder="Ej: 50">
                </div>
            </div>

            <div class="button-group">
                <button type="submit" class="btn-primary">💾 Crear Producto</button>
                <button type="button" class="btn-secondary" onclick="history.back()">← Cancelar</button>
            </div>
        </form>
    </div>
</body>
</html>