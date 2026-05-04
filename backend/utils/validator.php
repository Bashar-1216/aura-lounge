<?php
/**
 * Validator Helper Functions
 * Server-side input validation
 */

class Validator {
    private $errors = [];
    private $data;

    public function __construct($data) {
        $this->data = $data;
    }

    /**
     * Check if a field is required and not empty
     */
    public function required($field, $label = null) {
        $label = $label ?? $field;
        if (!isset($this->data[$field]) || (is_string($this->data[$field]) && trim($this->data[$field]) === '')) {
            $this->errors[$field] = "{$label} is required";
        }
        return $this;
    }

    /**
     * Check if a field is a valid number
     */
    public function numeric($field, $label = null) {
        $label = $label ?? $field;
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = "{$label} must be a number";
        }
        return $this;
    }

    /**
     * Check if a field is a positive number
     */
    public function positive($field, $label = null) {
        $label = $label ?? $field;
        if (isset($this->data[$field]) && is_numeric($this->data[$field]) && $this->data[$field] <= 0) {
            $this->errors[$field] = "{$label} must be a positive number";
        }
        return $this;
    }

    /**
     * Check minimum string length
     */
    public function minLength($field, $min, $label = null) {
        $label = $label ?? $field;
        if (isset($this->data[$field]) && strlen(trim($this->data[$field])) < $min) {
            $this->errors[$field] = "{$label} must be at least {$min} characters";
        }
        return $this;
    }

    /**
     * Check maximum string length
     */
    public function maxLength($field, $max, $label = null) {
        $label = $label ?? $field;
        if (isset($this->data[$field]) && strlen(trim($this->data[$field])) > $max) {
            $this->errors[$field] = "{$label} must not exceed {$max} characters";
        }
        return $this;
    }

    /**
     * Check if a field is a valid email
     */
    public function email($field, $label = null) {
        $label = $label ?? $field;
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "{$label} must be a valid email address";
        }
        return $this;
    }

    /**
     * Check if a field value is in an allowed list
     */
    public function inList($field, $allowed, $label = null) {
        $label = $label ?? $field;
        if (isset($this->data[$field]) && !in_array($this->data[$field], $allowed)) {
            $this->errors[$field] = "{$label} must be one of: " . implode(', ', $allowed);
        }
        return $this;
    }

    /**
     * Check if a field is a valid array
     */
    public function isArray($field, $label = null) {
        $label = $label ?? $field;
        if (isset($this->data[$field]) && !is_array($this->data[$field])) {
            $this->errors[$field] = "{$label} must be an array";
        }
        return $this;
    }

    /**
     * Check if an array is not empty
     */
    public function notEmptyArray($field, $label = null) {
        $label = $label ?? $field;
        if (isset($this->data[$field]) && is_array($this->data[$field]) && count($this->data[$field]) === 0) {
            $this->errors[$field] = "{$label} must not be empty";
        }
        return $this;
    }

    /**
     * Check if validation passed
     */
    public function isValid() {
        return empty($this->errors);
    }

    /**
     * Get validation errors
     */
    public function getErrors() {
        return $this->errors;
    }

    /**
     * Validate and send error response if failed
     */
    public function validate() {
        if (!$this->isValid()) {
            require_once __DIR__ . '/response.php';
            sendValidationError($this->getErrors());
        }
    }
}
