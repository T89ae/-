<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/layout.php';
requireLogin();
ob_start(); include __DIR__ . '/modules/agents.php'; $body = ob_get_clean();
renderPage('agents', 'المتابعون وطلبات الخدمة', $body);
