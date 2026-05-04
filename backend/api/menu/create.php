<?php
/** POST /api/menu — Create a new menu item (Admin only) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/MenuItem.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validator.php';

requireAuth(['admin']);

$data = getRequestBody();

$validator = new Validator($data);
$validator->required('name', 'Item name')
          ->required('price', 'Price')
          ->required('category_id', 'Category')
          ->numeric('price', 'Price')
          ->positive('price', 'Price')
          ->numeric('category_id', 'Category ID')
          ->validate();

$db = (new Database())->getConnection();
$menuItem = new MenuItem($db);
$id = $menuItem->create($data);

sendSuccess(['id' => $id], 'Menu item created successfully', 201);
