<?php
/**
 * API for Staff Profiles
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Staff.php';
require_once __DIR__ . '/../../utils/response.php';

$decoded = requireAuth(['admin', 'kitchen']);
$db = (new Database())->getConnection();
$staff = new Staff($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $onlyActive = isset($_GET['active']);
    sendSuccess($staff->getAll($onlyActive));
}

if ($method === 'POST') {
    $data = getRequestBody();
    if (empty($data['name'])) sendError('Name is required');
    try {
        if ($staff->create($data['name'])) {
            sendSuccess(null, 'Staff created', 201);
        }
    } catch (Throwable $e) {
        sendError('DB Error: ' . $e->getMessage());
    }
    sendError('Failed to create staff');
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id && $staff->delete($id)) {
        sendSuccess(null, 'Staff deleted');
    }
    sendError('Failed to delete staff');
}

if ($method === 'PATCH') {
    $data = getRequestBody();
    if (isset($data['id']) && isset($data['is_active'])) {
        $staff->toggleActive($data['id'], $data['is_active']);
        sendSuccess(null, 'Status updated');
    }
    sendError('Invalid data');
}
