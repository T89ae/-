<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
isLoggedIn() ? redirect(APP_URL . '/dashboard.php') : redirect(APP_URL . '/login.php');
