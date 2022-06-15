module.exports = {
	extends: ['@rocket.chat/eslint-config', 'plugin:prettier/recommended', 'plugin:import/typescript', 'plugin:@typescript-eslint/recommended', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:prettier/recommended'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2018,
		warnOnUnsupportedTypeScriptVersion: false,
		ecmaFeatures: {
			experimentalObjectRestSpread: true,
			legacyDecorators: true,
		},
	},
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.ts'],
			},
		},
	},
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		node: true,
	},
	rules: {
		'func-call-spacing': 'off',
		'jsx-quotes': ['error', 'prefer-single'],
		'indent': 'off',
		'no-dupe-class-members': 'off',
		'no-spaced-func': 'off',
		'no-unused-vars': 'off',
		'no-useless-constructor': 'off',
		'no-use-before-define': 'off',
		'@typescript-eslint/ban-ts-ignore': 'off',
		'@typescript-eslint/interface-name-prefix': ['error', 'always'],
		'@typescript-eslint/no-dupe-class-members': 'error',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				argsIgnorePattern: '^_',
				ignoreRestSiblings: true,
			},
		],
		'@typescript-eslint/prefer-optional-chain': 'warn'
	},
};
