<?php
/** GET /api/tables — Get all tables */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Table.php';
require_once __DIR__ . '/../../utils/response.php';

requireAuth(['admin']);

$db = (new Database())->getConnection();
$tableModel = new TableModel($db);
$tables = $tableModel->getAll();

sendSuccess($tables);
