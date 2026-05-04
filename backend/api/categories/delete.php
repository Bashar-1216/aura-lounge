<?php
/** DELETE /api/categories/{id} — Delete category (Admin only) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Category.php';
require_once __DIR__ . '/../../utils/response.php';

requireAuth(['admin']);

$id = $_GET['id'] ?? null;
if (!$id) sendError('Category ID is required', 400);

$db = (new Database())->getConnection();
$category = new Category($db);

$existing = $category->getById($id);
if (!$existing) sendNotFound('Category not found');

$category->delete($id);
sendSuccess(null, 'Category deleted successfully');
