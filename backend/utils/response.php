<?php
/**
 * Response Helper Functions
 * Standardized JSON responses for the API
 */

function sendSuccess($data = null, $message = 'Success', $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data'    => $data
    ]);
    exit;
}

function sendError($message = 'An error occurred', $code = 400, $errors = null) {
    http_response_code($code);
    $response = [
        'success' => false,
        'message' => $message
    ];
    if ($errors !== null) {
        $response['errors'] = $errors;
    }
    echo json_encode($response);
    exit;
}

function sendNotFound($message = 'Resource not found') {
    sendError($message, 404);
}

function sendUnauthorized($message = 'Unauthorized access') {
    sendError($message, 401);
}

function sendValidationError($errors) {
    sendError('Validation failed', 422, $errors);
}

/**
 * Get JSON request body
 * @return array
 */
function getRequestBody() {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON in request body', 400);
    }
    return $data ?? [];
}
