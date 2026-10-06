/** @type {import('tailwindcss').Config} */
// Charte « jeu-concours » : noir / gris clair / blanc, vert pour les pastilles positives,
// orange en accent ponctuel. Titres Mona Sans gras italique majuscules, texte Inter.
// Echelle typographique volontairement moderee (base 15px, h2 24px, hero 40px max).
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        /** Encre et gris neutres (texte, bordures, fonds). */
        ink: {
          DEFAULT: '#141416',
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#696970',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#141416',
        },
        /** Fond des pages claires. */
        page: '#F5F5F5',
        line: '#E4E4E7',
        /** Vert des pastilles positives et du CTA mobile. */
        go: {
          50: '#ECFDF3',
          100: '#D1FADF',
          200: '#A6F4C5',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
        },
        /** Orange d'accent (badges, compteurs ponctuels). */
        flame: {
          50: '#FFF3EB',
          100: '#FFE2CC',
          500: '#FD5501',
          600: '#E04B00',
          700: '#B23C00',
        },
        danger: {
          50: '#FEF3F2',
          200: '#FECDCA',
          600: '#B42318',
          700: '#912018',
        },
      },
      fontFamily: {
        display: ['"Mona Sans"', 'Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        sans: ['Inter', '"Inter Fallback"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13.5px', { lineHeight: '20px' }],
        base: ['15px', { lineHeight: '24px' }],
        lg: ['17px', { lineHeight: '26px' }],
        xl: ['19px', { lineHeight: '26px' }],
        '2xl': ['22px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '30px' }],
        '4xl': ['32px', { lineHeight: '36px' }],
        '5xl': ['40px', { lineHeight: '44px' }],
      },
      borderRadius: {
        card: '8px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20, 20, 22, 0.04), 0 2px 8px rgba(20, 20, 22, 0.04)',
        lift: '0 2px 6px rgba(20, 20, 22, 0.08), 0 12px 32px rgba(20, 20, 22, 0.14)',
      },
      maxWidth: {
        page: '1120px',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
      },
    },
  },
  plugins: [],
};
