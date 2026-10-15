// Keep Node-only tests out of Apps-Engine's TypeScript compilation.
/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */
const { strict: assert } = require('assert');
const { generateKeyPairSync } = require('crypto');

const { SettingType } = require('@rocket.chat/apps-engine/definition/settings');
const { jws } = require('jsrsasign');

const { AppSetting, settings } = require('../src/settings');
const { JitsiProvider } = require('../src/videoConfProvider');

const prejoinSetting = settings.find((setting) => setting.id === AppSetting.JitsiPrejoinEnabled);
assert.ok(prejoinSetting, 'The prejoin setting must be registered');
assert.equal(prejoinSetting.type, SettingType.BOOLEAN);
assert.equal(prejoinSetting.packageValue, true);
assert.equal(prejoinSetting.required, false);
assert.equal(prejoinSetting.public, true);
assert.equal(prejoinSetting.i18nLabel, 'jitsi_prejoin_enabled');
assert.equal(prejoinSetting.i18nDescription, 'jitsi_prejoin_enabled_description');

const user = { _id: 'user-id', username: 'alice', name: 'Alice & Bob' };
const call = {
	_id: 'call-id',
	type: 'videoconference',
	rid: 'channel-id',
	createdBy: user,
	title: 'Team & Planning',
	url: 'https://meet.example.com/RocketChatcall-id',
};
const prejoinOverrides = '&config.prejoinPageEnabled=false&config.prejoinConfig.enabled=false';
const disabledSetting = { ...prejoinSetting, value: false };
const settingCases = [
	{ label: 'enabled', setting: { ...prejoinSetting, value: true } },
	{ label: 'disabled', setting: disabledSetting, disabled: true },
	{ label: 'default package value', setting: prejoinSetting },
	{ label: 'undefined value', setting: { ...prejoinSetting, value: undefined, packageValue: undefined } },
	{ label: 'null value', setting: { ...prejoinSetting, value: null } },
	{ label: 'missing setting' },
];

function createProvider(setting) {
	const storedSettings = { [AppSetting.JitsiPrejoinEnabled]: setting };
	const settingsReader = {
		getById: async (id) => {
			assert.equal(id, AppSetting.JitsiPrejoinEnabled);
			return storedSettings[id];
		},
	};
	const serverSettingsReader = {
		getValueById: async (id) => {
			assert.equal(id, 'Site_Url');
			return 'https://chat.example.com/';
		},
	};
	const app = {
		getAccessors: () => ({
			environmentReader: {
				getSettings: () => settingsReader,
				getServerSettings: () => serverSettingsReader,
			},
		}),
	};
	return { provider: new JitsiProvider(app), storedSettings };
}

async function testPrejoinAndMediaPreferences() {
	await Promise.all(
		settingCases.map(async ({ label, setting, disabled }) => {
			const { provider } = createProvider(setting);
			provider.chromeExtensionId = 'extension-id';
			const expectedUrl =
				`${call.url}#config.desktopSharingChromeExtId=%22extension-id%22` +
				'&config.callDisplayName=%22Team%20%26%20Planning%22' +
				'&config.startWithAudioMuted=false&config.startWithVideoMuted=true' +
				'&userInfo.displayName=%22Alice%20%26%20Bob%22';
			assert.equal(
				await provider.customizeUrl(call, user, { mic: true, cam: false }),
				expectedUrl + (disabled ? prejoinOverrides : ''),
				label,
			);

			await Promise.all(
				[true, false, undefined].map(async (mic) => {
					await Promise.all(
						[true, false, undefined].map(async (cam) => {
							const url = new URL(await provider.customizeUrl(call, user, { mic, cam }));
							const config = new URLSearchParams(url.hash.substring(1));
							assert.equal(config.get('config.startWithAudioMuted'), mic === undefined ? null : String(!mic), label);
							assert.equal(config.get('config.startWithVideoMuted'), cam === undefined ? null : String(!cam), label);
						}),
					);
				}),
			);
		}),
	);
	process.stdout.write('PASS: prejoin defaults and overrides, full unsigned URLs, and all microphone/camera preferences\n');
}

async function testSettingChanges() {
	const { provider, storedSettings } = createProvider(undefined);
	const original = await provider.customizeUrl(call, user, {});
	for (const { setting, disabled } of settingCases) {
		storedSettings[AppSetting.JitsiPrejoinEnabled] = setting;
		// Changes to the same provider must be checked sequentially.
		// eslint-disable-next-line no-await-in-loop
		assert.equal(await provider.customizeUrl(call, user, {}), original + (disabled ? prejoinOverrides : ''));
	}
	process.stdout.write('PASS: administrator changes take effect on the next join\n');
}

async function testRoomAndUrlGeneration() {
	const { provider } = createProvider(disabledSetting);
	assert.equal(await provider.generateUrl(call), 'https://meet.jit.si/RocketChatcall-id');
	provider.domain = 'meet.example.com';
	provider.ssl = false;
	provider.titlePrefix = 'prefix-';
	provider.titleSuffix = '-suffix';
	assert.equal(await provider.generateUrl(call), 'http://meet.example.com/prefix-call-id-suffix');
	const customCall = { ...call, providerData: { roomName: 'custom-room', customCallTitle: 'Custom & Title' } };
	assert.equal(await provider.generateUrl(customCall), 'http://meet.example.com/prefix-custom-room-suffix');
	provider.useJaaS = true;
	provider.jitsiAppId = 'jaas-app-id';
	assert.equal(await provider.generateUrl(customCall), 'http://meet.example.com/jaas-app-id/prefix-custom-room-suffix');
	assert.equal(
		await provider.customizeUrl(customCall, user, {}),
		`${call.url}#config.callDisplayName=%22Custom%20%26%20Title%22&userInfo.displayName=%22Alice%20%26%20Bob%22${prejoinOverrides}`,
	);
	assert.equal(await provider.customizeUrl({ ...call, title: undefined }, undefined, {}), `${call.url}#`);
	process.stdout.write('PASS: room names, protocol, JaaS paths, custom titles, and URLs without a user\n');
}

async function testTokens() {
	const { publicKey, privateKey } = generateKeyPairSync('rsa', {
		modulusLength: 2048,
		publicKeyEncoding: { type: 'spki', format: 'pem' },
		privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
	});
	await Promise.all(
		settingCases.map(async ({ label, setting, disabled }) => {
			await Promise.all(
				[false, true].map(async (useJaaS) => {
					await Promise.all(
						[false, true].map(async (limitTokenToRoom) => {
							const { provider } = createProvider(setting);
							provider.useToken = true;
							provider.useJaaS = useJaaS;
							provider.domain = 'meet.example.com';
							provider.jitsiAppId = 'test-app-id';
							provider.jitsiAppSecret = 'test-secret';
							provider.jaasApiKey = 'test-api-key';
							provider.jaasPrivateKey = Buffer.from(privateKey).toString('base64');
							provider.limitTokenToRoom = limitTokenToRoom;
							provider.tokenAuditor = limitTokenToRoom ? 'custom-audience' : '';
							provider.tokenExpiration = limitTokenToRoom ? 'now + 1day' : '';
							const participant = limitTokenToRoom ? user : { ...user, _id: 'guest-id' };
							const tokenCall = { ...call, providerData: { roomName: 'custom-room' } };
							tokenCall.url = await provider.generateUrl(tokenCall);
							const before = Math.floor(Date.now() / 1000);
							const url = new URL(await provider.customizeUrl(tokenCall, participant, { mic: true, cam: false }));
							const after = Math.floor(Date.now() / 1000);
							const token = url.searchParams.get('jwt');
							assert.ok(token, label);
							const algorithm = useJaaS ? 'RS256' : 'HS256';
							assert.ok(jws.JWS.verify(token, useJaaS ? publicKey : { rstr: 'test-secret' }, [algorithm]), label);
							const { headerObj: header, payloadObj: payload } = jws.JWS.parse(token);
							assert.deepEqual(header, { typ: 'JWT', alg: algorithm, ...(useJaaS && { kid: 'test-api-key' }) });
							assert.ok(payload.iat >= before && payload.iat <= after);
							assert.ok(payload.nbf >= before && payload.nbf <= after);
							const lifetime = limitTokenToRoom ? 86400 : 3600;
							assert.ok(payload.exp >= before + lifetime && payload.exp <= after + lifetime);
							assert.deepEqual(payload, {
								iss: useJaaS ? 'chat' : 'test-app-id',
								sub: useJaaS ? 'test-app-id' : 'meet.example.com',
								iat: payload.iat,
								nbf: payload.nbf,
								exp: payload.exp,
								aud: useJaaS ? 'jitsi' : provider.tokenAuditor || 'RocketChat',
								room: limitTokenToRoom ? 'RocketChatcustom-room' : '*',
								context: {
									user: {
										name: user.name,
										avatar: 'https://chat.example.com/avatar/alice',
										email: `user_${participant._id}@rocket.chat`,
										...(useJaaS && { moderator: participant._id === call.createdBy._id }),
									},
									...(useJaaS && { features: {} }),
								},
								...(!useJaaS && participant._id === call.createdBy._id && { moderator: true }),
							});
							assert.equal(
								url.href,
								`${tokenCall.url}?jwt=${token}#config.callDisplayName=%22Team%20%26%20Planning%22` +
									`&config.startWithAudioMuted=false&config.startWithVideoMuted=true${disabled ? prejoinOverrides : ''}`,
								label,
							);
						}),
					);
				}),
			);
		}),
	);
	process.stdout.write('PASS: HS256 and JaaS RS256 signatures, claims, expiration, room scope, moderators, and signed URLs\n');
}

async function run() {
	await testPrejoinAndMediaPreferences();
	await testSettingChanges();
	await testRoomAndUrlGeneration();
	await testTokens();
}

run().catch((error) => {
	process.stderr.write(`${error.stack || error}\n`);
	process.exitCode = 1;
});
