import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	JitsiDomain = 'jitsi_domain',
	JitsiTitlePrefix = 'jitsi_title_prefix',
	JitsiTitleSuffix = 'jitsi_title_suffix',
	JitsiSSL = 'jitsi_ssl',
	JitsiChromeExtension = 'jitsi_chrome_extension',
	JitsiAuthToken = 'jitsi_auth_token',
	JitsiApplicationId = 'jitsi_application_id',
	JitsiApplicationSecret = 'jitsi_application_secret',
	JitsiLimitTokenToRoom = 'jitsi_limit_token_to_room',
	JitsiTokenAuditor = 'jitsi_token_auditor',
	JitsiTokenExpiration = 'jitsi_token_expiration',
	UseJaaS = 'jitsi_use_jaas',
	JaaSApiKeyId = 'jitsi_jaas_api_key_id',
	JaaSPrivateKey = 'jitsi_jaas_private_key',
}

export const settings: Array<ISetting> = [
	{
		id: AppSetting.JitsiDomain,
		type: SettingType.STRING,
		packageValue: 'meet.jit.si',
		required: true,
		public: true,
		i18nLabel: AppSetting.JitsiDomain,
		i18nDescription: `${AppSetting.JitsiDomain}_description`,
	},
	{
		id: AppSetting.JitsiTitlePrefix,
		type: SettingType.STRING,
		packageValue: 'RocketChat',
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiTitlePrefix,
		i18nDescription: `${AppSetting.JitsiTitlePrefix}_description`,
	},
	{
		id: AppSetting.JitsiTitleSuffix,
		type: SettingType.STRING,
		packageValue: '',
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiTitleSuffix,
		i18nDescription: `${AppSetting.JitsiTitleSuffix}_description`,
	},
	{
		id: AppSetting.JitsiSSL,
		type: SettingType.BOOLEAN,
		packageValue: true,
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiSSL,
		i18nDescription: `${AppSetting.JitsiSSL}_description`,
	},
	{
		id: AppSetting.JitsiChromeExtension,
		type: SettingType.STRING,
		packageValue: 'nocfbnnmjnndkbipkabodnheejiegccf',
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiChromeExtension,
		i18nDescription: `${AppSetting.JitsiChromeExtension}_description`,
	},
	{
		id: AppSetting.JitsiAuthToken,
		type: SettingType.BOOLEAN,
		packageValue: false,
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiAuthToken,
		i18nDescription: `${AppSetting.JitsiAuthToken}_description`,
	},
	{
		id: AppSetting.JitsiApplicationId,
		type: SettingType.STRING,
		packageValue: '',
		required: false,
		public: false,
		i18nLabel: AppSetting.JitsiApplicationId,
		i18nDescription: `${AppSetting.JitsiApplicationId}_description`,
	},
	{
		id: AppSetting.JitsiApplicationSecret,
		type: SettingType.STRING,
		packageValue: '',
		required: false,
		public: false,
		i18nLabel: AppSetting.JitsiApplicationSecret,
		i18nDescription: `${AppSetting.JitsiApplicationSecret}_description`,
	},
	{
		id: AppSetting.UseJaaS,
		type: SettingType.BOOLEAN,
		packageValue: false,
		required: false,
		public: false,
		i18nLabel: AppSetting.UseJaaS,
		i18nDescription: `${AppSetting.UseJaaS}_description`,
	},
	{
		id: AppSetting.JaaSPrivateKey,
		type: SettingType.STRING,
		packageValue: '',
		required: false,
		public: false,
		i18nLabel: AppSetting.JaaSPrivateKey,
		i18nDescription: `${AppSetting.JaaSPrivateKey}_description`,
	},
	{
		id: AppSetting.JaaSApiKeyId,
		type: SettingType.STRING,
		packageValue: '',
		required: false,
		public: false,
		i18nLabel: AppSetting.JaaSApiKeyId,
		i18nDescription: `${AppSetting.JaaSApiKeyId}_description`,
	},
	{
		id: AppSetting.JitsiLimitTokenToRoom,
		type: SettingType.BOOLEAN,
		packageValue: true,
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiLimitTokenToRoom,
		i18nDescription: `${AppSetting.JitsiLimitTokenToRoom}_description`,
	},
	{
		id: AppSetting.JitsiTokenAuditor,
		type: SettingType.STRING,
		packageValue: 'RocketChat',
		required: false,
		public: false,
		i18nLabel: AppSetting.JitsiTokenAuditor,
		i18nDescription: `${AppSetting.JitsiTokenAuditor}_description`,
	},
	{
		id: AppSetting.JitsiTokenExpiration,
		type: SettingType.STRING,
		packageValue: 'now + 1hour',
		required: false,
		public: false,
		i18nLabel: AppSetting.JitsiTokenExpiration,
		i18nDescription: `${AppSetting.JitsiTokenExpiration}_description`,
	},
];
