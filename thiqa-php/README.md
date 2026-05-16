# نظام ثقة للخدمات العامة — PHP v2.0

## متطلبات السيرفر
- PHP 8.1+  (مع extensions: pdo_mysql, curl, fileinfo, mbstring)
- MySQL 8.0+ / MariaDB 10.6+
- Apache 2.4+ / Nginx 1.20+
- Composer (اختياري)

## هيكل المشروع
```
thiqa_php_v2/
├── config/
│   ├── config.php          ← الإعدادات الرئيسية
│   └── database.php        ← اتصال PDO وdbc helpers
├── includes/
│   ├── auth.php            ← نظام المصادقة
│   ├── functions.php       ← دوال مساعدة
│   └── layout.php          ← القالب الرئيسي
├── modules/                ← محتوى كل صفحة
│   ├── workers.php
│   ├── transfers.php
│   ├── sales.php
│   ├── expenses.php
│   ├── tasks.php
│   ├── brokers.php
│   ├── contacts.php
│   ├── agents.php
│   ├── import.php
│   └── reports.php
├── api/
│   └── index.php           ← API Router الموحد
├── assets/
│   ├── css/main.css
│   └── js/main.js
├── uploads/                ← الملفات المرفوعة
├── install.sql             ← قاعدة البيانات
├── index.php               ← Redirect
├── login.php
├── logout.php
├── dashboard.php
├── workers.php
├── transfers.php
├── sales.php
├── expenses.php
├── tasks.php
├── brokers.php
├── contacts.php
├── agents.php
├── import.php
├── reports.php
├── hulul.php               ← وكيل AI حلول
├── settings.php
└── .htaccess
```

## خطوات التثبيت

### 1. رفع الملفات على السيرفر
```bash
scp -r thiqa_php_v2/ user@yourserver.com:/var/www/html/thiqa/
```

### 2. إنشاء قاعدة البيانات
```bash
mysql -u root -p < install.sql
```

### 3. ضبط الإعدادات
افتح `config/config.php` وعدّل:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'thiqa_db');
define('DB_USER', 'your_user');
define('DB_PASS', 'your_password');
define('APP_URL', 'https://yourdomain.com/thiqa');
define('GEMINI_API_KEY', 'AIzaSy...');
```

### 4. صلاحيات المجلدات
```bash
chmod 755 uploads/
chown www-data:www-data uploads/
```

### 5. ضبط Apache
أضف في `httpd.conf` أو `.htaccess`:
```apache
AllowOverride All
```

### 6. تسجيل الدخول
- **الرابط:** `http://yourdomain.com/thiqa/`
- **المستخدم:** `admin`
- **كلمة المرور:** `password`

⚠️ **غيّر كلمة المرور فور الدخول** من الإعدادات

## وكيل حلول AI
1. انتقل إلى **حلول — الوكيل الذكي**
2. احصل على مفتاح مجاني من [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
3. أضفه في **الإعدادات → Gemini API Key**

## API Endpoints
```
GET  /api/?module=stats
GET  /api/?module=workers&action=list
POST /api/?module=workers&action=save
POST /api/?module=workers&action=delete
GET  /api/?module=transfers&action=list
POST /api/?module=transfers&action=save
GET  /api/?module=sales&action=list
POST /api/?module=sales&action=save
GET  /api/?module=expenses&action=list
POST /api/?module=expenses&action=save
GET  /api/?module=tasks&action=list
POST /api/?module=tasks&action=save
POST /api/?module=tasks&action=complete
GET  /api/?module=brokers&action=list
GET  /api/?module=entitlements&action=list
POST /api/?module=entitlements&action=pay
GET  /api/?module=customers&action=list
POST /api/?module=customers&action=save
GET  /api/?module=service_requests&action=list
POST /api/?module=service_requests&action=save
GET  /api/?module=agents&action=list
POST /api/?module=agent_requests&action=save
POST /api/?module=gemini&action=proxy
GET  /api/?module=activity_log&action=list
```

## الأمان
- CSRF Protection على جميع طلبات POST
- Rate Limiting (60 req/min/IP)
- Password Hashing (bcrypt cost=12)
- PDO Prepared Statements (لا SQL injection)
- Session Security (httponly, samesite=strict)
- File Upload Validation (type, size, extension)
