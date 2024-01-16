import type { IVideoConferenceUser } from '@rocket.chat/apps-engine/definition/videoConferences';
import type {
	IVideoConfProvider,
	IVideoConferenceOptions,
	VideoConfData,
	VideoConfDataExtended,
} from '@rocket.chat/apps-engine/definition/videoConfProviders';
import { jws } from 'jsrsasign';

import type { JitsiApp } from './JitsiApp';

export class JitsiProvider implements IVideoConfProvider {
	public domain = 'meet.jit.si';

	public titlePrefix = 'RocketChat';

	public titleSuffix = '';

	public ssl = true;

	public chromeExtensionId = '';

	public name = 'Jitsi';

	public useToken = false;

	public jitsiAppId = '';

	public jitsiAppSecret = '';

	public limitTokenToRoom = false;

	public tokenAuditor = '';

	public tokenExpiration = '';

	public useJaaS = false;

	public jaasApiKey = '';

	public jaasPrivateKey = '';

	public capabilities = {
		mic: true,
		cam: true,
		title: true,
	};

	constructor(private readonly app: JitsiApp) {}

	public async isFullyConfigured(): Promise<boolean> {
		if (!this.domain) {
			return false;
		}

		if (this.useToken) {
			if (this.useJaaS) {
				return Boolean(this.jitsiAppId && this.jaasPrivateKey && this.jaasApiKey);
			}
			return Boolean(this.jitsiAppId && this.jitsiAppSecret);
		}

		return true;
	}

	private getRoomIdentification(call: VideoConfData): string {
		const name = call.providerData?.roomName || call._id;

		return `${this.titlePrefix}${name}${this.titleSuffix}`;
	}

	public async generateUrl(call: VideoConfData): Promise<string> {
		const protocol = this.ssl ? 'https' : 'http';

		const name = this.getRoomIdentification(call);

		const appSuffix = this.useJaaS ? `/${this.jitsiAppId}` : '';
		return `${protocol}://${this.domain}${appSuffix}/${name}`;
	}

	public async customizeUrl(call: VideoConfDataExtended, user: IVideoConferenceUser, options: IVideoConferenceOptions): Promise<string> {
		const configs: string[] = [];

		if (this.chromeExtensionId) {
			configs.push(`config.desktopSharingChromeExtId=${encodeURIComponent(`"${this.chromeExtensionId}"`)}`);
		}

		const title = call.providerData?.customCallTitle || call.title;

		if (title) {
			configs.push(`config.callDisplayName=${encodeURIComponent(`"${title}"`)}`);
		}

		if (options.mic !== undefined) {
			configs.push(`config.startWithAudioMuted=${options.mic ? 'false' : 'true'}`);
		}
		if (options.cam !== undefined) {
			configs.push(`config.startWithVideoMuted=${options.cam ? 'false' : 'true'}`);
		}

		const token = await this.generateToken(call, user);

		// If it's not using a generated token, include extra settings openly
		if (!token) {
			if (user) {
				configs.push(`userInfo.displayName=${encodeURIComponent(`"${user.name}"`)}`);
			}
		}

		if (user) {
			configs.push(`config.prejoinPageEnabled=false`);
			configs.push(`config.prejoinConfig.enabled=false`);
		}

		const configHash = configs.join('&');
		const tokenParam = token ? `?jwt=${token}` : '';
		const url = `${call.url}${tokenParam}#${configHash}`;

		return url;
	}

	private async generateToken(call: VideoConfDataExtended, user: IVideoConferenceUser): Promise<string> {
		if (!this.useToken) {
			return '';
		}

		const header = {
			typ: 'JWT',
			alg: 'HS256',
		};

		const payload: Record<string, any> = {
			iss: this.jitsiAppId,
			sub: this.domain,
			iat: jws.IntDate.get('now'),
			nbf: jws.IntDate.get('now'),
			exp: jws.IntDate.get(this.tokenExpiration || 'now + 1hour'),
			aud: this.tokenAuditor || 'RocketChat',
			room: this.limitTokenToRoom ? this.getRoomIdentification(call) : '*',
			context: user
				? {
						user: {
							name: user.name,
							avatar: await this.getAbsoluteUrl(`avatar/${user.username}`),
							email: `user_${user._id}@rocket.chat`,
							...(this.useJaaS && { moderator: user?._id === call.createdBy._id }),
						},
				  }
				: '',
		};

		if (user && user._id === call.createdBy._id && !this.useJaaS) {
			payload.moderator = true;
		}

		if (this.useJaaS) {
			const jaasHeader = {
				...header,
				kid: this.jaasApiKey,
				alg: 'RS256',
			};

			const jaasPayload = {
				...payload,
				iss: 'chat',
				sub: this.jitsiAppId,
				aud: 'jitsi',
				context: {
					...(payload.context || {}),
					features: {},
				},
			};

			return jws.JWS.sign(
				'RS256',
				JSON.stringify(jaasHeader),
				JSON.stringify(jaasPayload),
				new Buffer(this.jaasPrivateKey, 'base64').toString('utf8'),
			);
		}

		const headerStr = JSON.stringify(header);
		const payloadStr = JSON.stringify(payload);

		return jws.JWS.sign(header.alg, headerStr, payloadStr, { rstr: this.jitsiAppSecret });
	}

	private async getAbsoluteUrl(relativeUrl: string): Promise<string> {
		const siteUrl = await this.app.getAccessors().environmentReader.getServerSettings().getValueById('Site_Url');
		const separator = siteUrl.endsWith('/') ? '' : '/';
		const suffix = relativeUrl.startsWith('/') ? relativeUrl.substring(1) : relativeUrl;
		return `${siteUrl}${separator}${suffix}`;
	}
}
