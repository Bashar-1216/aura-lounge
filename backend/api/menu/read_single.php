<?php
/** GET /api/menu/{id} — Get single menu item */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/MenuItem.php';
require_once __DIR__ . '/../../utils/response.php';

$db = (new Database())->getConnection();
$menuItem = new MenuItem($db);

$id = $_GET['id'] ?? null;
if (!$id) sendError('Item ID is required', 400);

$item = $menuItem->getById($id);
if (!$item) sendNotFound('Menu item not found');

sendSuccess($item);
