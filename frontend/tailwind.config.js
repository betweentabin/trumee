module.exports = {
    theme: {
      extend: {
        screens: {
          'lgx': '1385px', // custom breakpoint
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px'
        },
        colors: {
          // Xrosspoint統一カラーパレット
          primary: {
            50: '#FFF5F2',
            100: '#FFF1EE', 
            200: '#FFE4DE',
            300: '#FFD0C4',
            400: '#FFAD9B',
            500: '#FF9871', // xrosspointセカンダリオレンジ
            600: '#FF733E', // xrosspointメインオレンジ
            700: '#F4511E',
            800: '#E64A19',
            900: '#D84315',
            950: '#BF360C'
          },
          secondary: {
            50: '#F9F9F9',
            100: '#F5F5F5',
            200: '#E5E5E5',
            300: '#D4D4D4',
            400: '#A3A3A3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
            950: '#0A0A0A'
          },
          accent: {
            50: '#F0F9FF',
            100: '#E0F2FE',
            200: '#BAE6FD',
            300: '#7DD3FC',
            400: '#38BDF8',
            500: '#0EA5E9',
            600: '#0284C7',
            700: '#0369A1',
            800: '#075985',
            900: '#0C4A6E',
            950: '#082F49'
          },
          success: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            300: '#86EFAC',
            400: '#4ADE80',
            500: '#22C55E',
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#14532D',
            950: '#052E16'
          },
          warning: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
            950: '#451A03'
          },
          error: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
            950: '#450A0A'
          },
          // レガシー色（後方互換性）
          'gray-deep': '#333333',
          'gray-light': '#f5f5f5',
          'gray-dark': '#404040',
          'orange-90': '#FFF1EE',
          'orange-main': '#FF9871',
          'secondary-20': '#F5F5F5',
          'secondary-30': '#737373',
          'primary-active': '#FF733E',
          'primary-default': '#262626'
        },
        aspectRatio: {
          '3/4': '3 / 4',
          '4/3': '4 / 3',
          '4/1': '4 / 1',
          '5/4': '5 / 4',
          '16/7': '16 / 7',
          '3/5': '3 / 5'
        },
        fontFamily: {
          sans: ['Inter', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'sans-serif'],
          serif: ['Georgia', 'Times New Roman', 'serif'],
          mono: ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
        },
        animation: {
          'fade-in': 'fadeIn 0.5s ease-in-out',
          'slide-up': 'slideUp 0.3s ease-out',
          'bounce-gentle': 'bounceGentle 2s infinite'
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' }
          },
          slideUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' }
          },
          bounceGentle: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-5px)' }
          }
        }
      },
    },
    content: [
      './app/**/*.{ts,tsx}',     // ← if you're using the app directory
      './components/**/*.{ts,tsx}',
      './pages/**/*.{ts,tsx}',
    ],
  };

