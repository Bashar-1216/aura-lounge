<?php
/**
 * Simple PHP Router
 * Routes incoming requests to the appropriate API endpoint
 */
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/utils/response.php';

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string from URI for routing
$path = parse_url($requestUri, PHP_URL_PATH);
// Remove /api prefix if present
$path = preg_replace('#^/api#', '', $path);

// Parse route parameters
$segments = explode('/', trim($path, '/'));

// Route mapping
switch ($segments[0] ?? '') {
    case 'menu':
        if ($method === 'GET' && isset($segments[1]) && is_numeric($segments[1])) {
            $_GET['id'] = $segments[1];
            require __DIR__ . '/api/menu/read_single.php';
        } elseif ($method === 'GET') {
            require __DIR__ . '/api/menu/read.php';
        } elseif ($method === 'POST') {
            require __DIR__ . '/api/menu/create.php';
        } elseif ($method === 'PUT' && isset($segments[1])) {
            $_GET['id'] = $segments[1];
            require __DIR__ . '/api/menu/update.php';
        } elseif ($method === 'DELETE' && isset($segments[1])) {
            $_GET['id'] = $segments[1];
            require __DIR__ . '/api/menu/delete.php';
        } else {
            sendError('Method not allowed', 405);
        }
        break;

    case 'categories':
        if ($method === 'GET') {
            require __DIR__ . '/api/categories/read.php';
        } elseif ($method === 'POST') {
            require __DIR__ . '/api/categories/create.php';
        } elseif ($method === 'PUT' && isset($segments[1])) {
            $_GET['id'] = $segments[1];
            require __DIR__ . '/api/categories/update.php';
        } elseif ($method === 'DELETE' && isset($segments[1])) {
            $_GET['id'] = $segments[1];
            require __DIR__ . '/api/categories/delete.php';
        } else {
            sendError('Method not allowed', 405);
        }
        break;

    case 'orders':
        // Handle /orders/stats before /orders/{id}
        if ($method === 'GET' && isset($segments[1]) && $segments[1] === 'stats') {
            require __DIR__ . '/api/orders/stats.php';
        } elseif ($method === 'GET' && isset($segments[1]) && is_numeric($segments[1])) {
            $_GET['id'] = $segments[1];
            require __DIR__ . '/api/orders/read_single.php';
        } elseif ($method === 'GET') {
            require __DIR__ . '/api/orders/read.php';
        } elseif ($method === 'POST') {
            require __DIR__ . '/api/orders/create.php';
        } elseif (($method === 'PATCH' || $method === 'PUT') && isset($segments[1])) {
            $_GET['id'] = $segments[1];
            require __DIR__ . '/api/orders/update.php';
        } else {
            sendError('Method not allowed', 405);
        }
        break;

    case 'auth':
        if ($method === 'POST' && isset($segments[1]) && $segments[1] === 'login') {
            require __DIR__ . '/api/auth/login.php';
        } elseif ($method === 'GET' && isset($segments[1]) && $segments[1] === 'verify') {
            require __DIR__ . '/api/auth/verify.php';
        } else {
            sendError('Method not allowed', 405);
        }
        break;

    case 'tables':
        if ($method === 'GET') {
            require __DIR__ . '/api/tables/read.php';
        } else {
            sendError('Method not allowed', 405);
        }
        break;

    default:
        sendError('Endpoint not found', 404);
        break;
}
