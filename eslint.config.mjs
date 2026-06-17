import antfu from '@antfu/eslint-config';

export default antfu({
	stylistic: {
		indent: 'tab',
		quotes: 'single',
		semi: true,
	},

	typescript: true,

	ignores: ['build/dist/', 'coverage/', 'dist/', 'node_modules/', '.eslintcache', 'debug.log'],
}, {
	files: ['iframe/js/**/*.js'],
	languageOptions: {
		globals: {
			eda: 'readonly',
			t: 'readonly',
			AppState: 'readonly',
			CanvasModule: 'readonly',
			GeometryUtils: 'readonly',
			ImageModule: 'readonly',
			EventModule: 'readonly',
			Generator: 'readonly',
		},
	},
	rules: {
		'no-undef': 'off',
		'unicorn/prefer-number-properties': 'off',
		'eqeqeq': 'off',
	},
});
