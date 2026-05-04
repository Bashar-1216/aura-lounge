<?php
/** DELETE /api/menu/{id} — Delete a menu item (Admin only) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/MenuItem.php';
require_once __DIR__ . '/../../utils/response.php';

requireAuth(['admin']);

$id = $_GET['id'] ?? null;
if (!$id) sendError('Item ID is required', 400);

$db = (new Database())->getConnection();
$menuItem = new MenuItem($db);

$existing = $menuItem->getById($id);
if (!$existing) sendNotFound('Menu item not found');

$menuItem->delete($id);
sendSuccess(null, 'Menu item deleted successfully');
