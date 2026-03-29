import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
	...nextCoreWebVitals,
	...nextTypeScript,
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/purity": "off",
			"react-hooks/immutability": "off",
			"react/no-unescaped-entities": "off",
		},
	},
];

export default config;
