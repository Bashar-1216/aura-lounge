<?php
/**
 * JWT Authentication Middleware
 * Simple JWT implementation without external dependencies
 */

define('JWT_SECRET', 'aura_lounge_secret_key_2024_change_in_production');
define('JWT_EXPIRY', 86400); // 24 hours

/**
 * Generate a JWT token
 */
function generateToken($userId, $email, $role) {
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64UrlEncode(json_encode([
        'user_id' => $userId,
        'email'   => $email,
        'role'    => $role,
        'iat'     => time(),
        'exp'     => time() + JWT_EXPIRY
    ]));
    $signature = base64UrlEncode(
        hash_hmac('sha256', "{$header}.{$payload}", JWT_SECRET, true)
    );
    return "{$header}.{$payload}.{$signature}";
}

/**
 * Verify and decode a JWT token
 */
function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    list($header, $payload, $signature) = $parts;

    // Verify signature
    $expectedSig = base64UrlEncode(
        hash_hmac('sha256', "{$header}.{$payload}", JWT_SECRET, true)
    );

    if (!hash_equals($expectedSig, $signature)) {
        return null;
    }

    // Decode payload
    $decoded = json_decode(base64UrlDecode($payload), true);

    // Check expiry
    if (isset($decoded['exp']) && $decoded['exp'] < time()) {
        return null;
    }

    return $decoded;
}

/**
 * Middleware: Require authentication
 * Call this at the top of protected endpoints
 */
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

function requireAuth($allowedRoles = ['admin', 'kitchen']) {
    require_once __DIR__ . '/../utils/response.php';

    $authHeader = '';

    // Try multiple sources for Authorization header (shared hosting compatibility)
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (empty($authHeader) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if (empty($authHeader) && function_exists('apache_request_headers')) {
        $apacheHeaders = apache_request_headers();
        $authHeader = $apacheHeaders['Authorization'] ?? $apacheHeaders['authorization'] ?? '';
    }

    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        sendUnauthorized('No token provided');
    }

    $token = substr($authHeader, 7);
    $decoded = verifyToken($token);

    if (!$decoded) {
        sendUnauthorized('Invalid or expired token');
    }

    if (!in_array($decoded['role'], $allowedRoles)) {
        sendError('Insufficient permissions', 403);
    }

    return $decoded;
}

/**
 * Base64 URL-safe encoding
 */
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64 URL-safe decoding
 */
function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}
