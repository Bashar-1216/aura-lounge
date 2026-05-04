<?php
/** GET /api/orders/{id} — Get single order (Public for tracking) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/Order.php';
require_once __DIR__ . '/../../utils/response.php';

$id = $_GET['id'] ?? null;
if (!$id) sendError('Order ID is required', 400);

$db = (new Database())->getConnection();
$order = new Order($db);
$result = $order->getById($id);

if (!$result) sendNotFound('Order not found');

sendSuccess($result);
