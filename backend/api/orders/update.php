<?php
/** PATCH /api/orders/{id} — Update order status (Kitchen/Admin) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Order.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validator.php';

requireAuth(['admin', 'kitchen']);

$id = $_GET['id'] ?? null;
if (!$id) sendError('Order ID is required', 400);

$data = getRequestBody();

$validator = new Validator($data);
$validator->required('status', 'Status')
          ->inList('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'], 'Status')
          ->validate();

$db = (new Database())->getConnection();
$order = new Order($db);

$existing = $order->getById($id);
if (!$existing) sendNotFound('Order not found');

$preparedBy = $data['prepared_by'] ?? null;
$order->updateStatus($id, $data['status'], $preparedBy);
$updated = $order->getById($id);

sendSuccess($updated, 'Order status updated successfully');
