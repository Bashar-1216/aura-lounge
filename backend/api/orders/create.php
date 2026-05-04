<?php
/** POST /api/orders — Create a new order (Public) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/Order.php';
require_once __DIR__ . '/../../models/Table.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validator.php';

$data = getRequestBody();

$validator = new Validator($data);
$validator->required('table_id', 'Table')
          ->numeric('table_id', 'Table ID')
          ->required('items', 'Order items')
          ->isArray('items', 'Order items')
          ->notEmptyArray('items', 'Order items')
          ->validate();

// Validate each item
foreach ($data['items'] as $i => $item) {
    $itemValidator = new Validator($item);
    $itemValidator->required('menu_item_id', "Item #{$i} menu_item_id")
                  ->required('quantity', "Item #{$i} quantity")
                  ->numeric('quantity', "Item #{$i} quantity")
                  ->positive('quantity', "Item #{$i} quantity")
                  ->validate();
}

$db = (new Database())->getConnection();

// Verify table exists
$tableModel = new TableModel($db);
if (!$tableModel->exists($data['table_id'])) {
    sendNotFound('Table not found');
}

$order = new Order($db);
$result = $order->create($data, $data['items']);

if (isset($result['error'])) {
    sendError($result['error'], 400);
}

sendSuccess($result, 'Order placed successfully', 201);
