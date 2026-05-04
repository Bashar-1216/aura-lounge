<?php
/** GET /api/orders — Get filtered orders (Kitchen/Admin) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Order.php';
require_once __DIR__ . '/../../utils/response.php';

requireAuth(['admin', 'kitchen']);

$db = (new Database())->getConnection();
$order = new Order($db);

$statuses = isset($_GET['status']) ? explode(',', $_GET['status']) : [];
$limit = $_GET['limit'] ?? 50;
$offset = $_GET['offset'] ?? 0;

$orders = $order->getFiltered($statuses, $limit, $offset);

sendSuccess($orders);
