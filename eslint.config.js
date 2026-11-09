// ESLint settings. Run: python3 tools/lint.py (it lints the joined game script, since the
// src/js files share one global scope and only make sense together).
module.exports = [{
    files: ['**/*.js'],
    languageOptions: {
        ecmaVersion: 2017,
        sourceType: 'script',
        globals: {
            window: 'readonly', document: 'readonly', navigator: 'readonly', localStorage: 'readonly',
            location: 'readonly', performance: 'readonly', console: 'readonly', setTimeout: 'readonly',
            clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
            requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly', Image: 'readonly',
            AudioContext: 'readonly', Audio: 'readonly', CanvasRenderingContext2D: 'readonly',
            Path2D: 'readonly', confirm: 'readonly', alert: 'readonly', screen: 'readonly',
            matchMedia: 'readonly', fetch: 'readonly', caches: 'readonly', self: 'readonly',
            Blob: 'readonly', URL: 'readonly', btoa: 'readonly', atob: 'readonly', Date: 'readonly',
            Element: 'readonly', innerWidth: 'readonly', innerHeight: 'readonly', FileReader: 'readonly'
        }
    },
    rules: {
        'no-undef': 'error',
        'no-unused-vars': ['warn', { vars: 'all', args: 'none', caughtErrors: 'none' }],
        'no-redeclare': 'error',
        'no-dupe-keys': 'error',
        'no-unreachable': 'error',
        'no-self-assign': 'error'
    }
}];
