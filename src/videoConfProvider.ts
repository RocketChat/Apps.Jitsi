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

	public idType: 'id' | 'call' | 'title' = 'call';

	public ssl = true;

	public chromeExtensionId = '';

	public name = 'Jitsi';

	public useToken = false;

	public jitsiAppId = '';

	public jitsiAppSecret = '';

	public limitTokenToRoom = false;

	public tokenAuditor = '';

	public tokenExpiration = '';

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
			return Boolean(this.jitsiAppId && this.jitsiAppSecret);
		}

		return true;
	}

	private getRoomName(call: VideoConfData): string {
		const name = call.title || call.rid;

		return `${this.titlePrefix}${name}${this.titleSuffix}`;
	}

	private getRoomIdentification(call: VideoConfData): string {
		if (call.providerData?.roomName) {
			return `${this.titlePrefix}${call.providerData.roomName}${this.titleSuffix}`;
		}

		switch (this.idType) {
			case 'id':
				return call.rid;
			case 'title':
				return this.getRoomName(call);
			default:
				return call._id;
		}
	}

	public async generateUrl(call: VideoConfData): Promise<string> {
		const protocol = this.ssl ? 'https' : 'http';

		const name = this.getRoomIdentification(call);

		return `${protocol}://${this.domain}/${name}`;
	}

	public async customizeUrl(call: VideoConfDataExtended, user: IVideoConferenceUser, options: IVideoConferenceOptions): Promise<string> {
		const configs: string[] = [];

		if (this.chromeExtensionId) {
			configs.push(`config.desktopSharingChromeExtId="${this.chromeExtensionId}"`);
		}

		if (call.type === 'videoconference' && call.title) {
			configs.push(`config.callDisplayName="${call.title}"`);
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
				configs.push(`userInfo.displayName="${user.name}"`);
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
							// id: user._id,
							avatar: await this.getAbsoluteUrl(`avatar/${user.username}`),
							email: `${user._id}@rocket.chat`,
						},
				  }
				: '',
		};

		if (user._id === call.createdBy._id) {
			payload.moderator = true;
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
