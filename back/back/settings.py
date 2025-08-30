import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ====== Security ======
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-393(t6slr73(5fzwgvp!^_rigkc0a74=$($0(gq=&)n8%^u(o)"
)

DEBUG = os.getenv("DEBUG", "True").lower() == "true"

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")

# ====== Firebase Configuration ======
FIREBASE_CREDENTIAL_PATH = os.getenv("FIREBASE_CREDENTIAL_PATH", "firebase_key.json")

# Firebase Admin SDK settings
FIREBASE_CONFIG = {
    "type": "service_account",
    "project_id": os.getenv("FIREBASE_PROJECT_ID", ""),
    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
    "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL", ""),
    "client_id": os.getenv("FIREBASE_CLIENT_ID", ""),
    "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
    "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
}

# ====== Allowed Hosts ======
ALLOWED_HOSTS = [
    "85.131.248.214", 
    "localhost", 
    "127.0.0.1", 
    "0.0.0.0",
    ".railway.app",  # Railway domains
    ".up.railway.app",  # Railway subdomains
    "*",  # 一時的に全て許可（デプロイ成功後に制限する）
]

# ====== CORS Settings ======
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://trumee-h7ygmkzis-taiga1226s-projects.vercel.app",  # 旧URL1
    "https://trumee-3msjm6bnn-taiga1226s-projects.vercel.app",  # 旧URL2
    "https://trumee-3jps5yj06-taiga1226s-projects.vercel.app",  # 旧URL3
    "https://trumeee-8ygeu8cmc-taiga1226s-projects.vercel.app",  # 旧パブリックURL
    "https://trumeee-mtm37527p-taiga1226s-projects.vercel.app",  # 最新パブリックURL
    "https://trumeee-7u59x8kzt-taiga1226s-projects.vercel.app", # 新しいURL
    "https://trumeee.vercel.app",  # カスタムドメイン
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_ALL_ORIGINS = True  # 一時的に全てのオリジンを許可（テスト用）

# ====== Application definition ======
DJANGO_APPS = [
    'daphne',  # WebSocket用 (ASGIサーバー) - staticfilesより前に配置必須
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'channels',  # WebSocket通信
    'rest_framework',
    'rest_framework.authtoken',  # DRF Token認証
    'rest_framework_simplejwt',  # JWT認証
    'corsheaders',
]

LOCAL_APPS = [
    'core',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Railway用静的ファイル配信
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'back.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'back.wsgi.application'

# Channels用ASGI設定
ASGI_APPLICATION = 'back.asgi.application'

# Channelsレイヤー設定（開発環境用）
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'  # 開発環境用
        # 本番環境では以下を使用
        # 'BACKEND': 'channels_redis.core.RedisChannelLayer',
        # 'CONFIG': {
        #     "hosts": [('127.0.0.1', 6379)],
        # },
    },
}

# ====== Database ======
# 環境変数による動的データベース設定
DATABASE_URL = os.environ.get('DATABASE_URL')
DB_ENGINE = os.environ.get('DB_ENGINE', 'sqlite')

if DATABASE_URL:
    # Railway環境やHerokuなどでDATABASE_URLが設定されている場合
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
elif DB_ENGINE == 'postgresql':
    # ローカルPostgreSQL環境
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'resume_truemee'),
            'USER': os.environ.get('DB_USER', 'resume_user'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'resume_password_2024'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {
                'charset': 'utf8',
            },
        }
    }
else:
    # デフォルト：SQLite（開発・テスト用）
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ====== Authentication ======
AUTH_USER_MODEL = 'core.User'

# ====== Password validation ======
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ====== Internationalization ======
LANGUAGE_CODE = 'ja'
TIME_ZONE = 'Asia/Tokyo'
USE_I18N = True
USE_TZ = True

# ====== Static files (CSS, JavaScript, Images) ======
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise設定（Railway用）
if 'RAILWAY_ENVIRONMENT' in os.environ:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ====== Media files ======
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ====== Default primary key field type ======
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ====== REST Framework ======
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ====== Logging ======
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'django.log',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'core': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# ====== Email Configuration ======
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@trumeee.com')
SERVER_EMAIL = os.getenv('SERVER_EMAIL', 'noreply@trumeee.com')

# フロントエンドURL（メール内のリンク用）
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@trumeee.com')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# ====== Cache Configuration ======
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# ====== Session Configuration ======
SESSION_COOKIE_AGE = 86400  # 24時間
SESSION_SAVE_EVERY_REQUEST = True
