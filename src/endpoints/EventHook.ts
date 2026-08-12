import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';

import type { JitsiApp } from '../JitsiApp';

export class EventHookEndpoint extends ApiEndpoint {
	public path = 'endsession/';
	
	constructor(public app: JitsiApp) {
		super(app);
	}
	
	public async post(
		request: IApiRequest,
		_endpoint: IApiEndpointInfo,
		_read: IRead,
		modify: IModify,
		_http: IHttp,
		_persistence: IPersistence,
	): Promise<IApiResponse> {
		const provider = this.app.getProvider();
		
		//Allows to enable and disable the Hook in the settings page
		
		if (!provider.hookEnabled) {
			this.app.getLogger().info('Rejecting Hook because the setting to use it is turned off.');
			return {
				status: HttpStatusCode.FORBIDDEN,
			};
		}
		
		//Using a hook secret allows us to keep foreign senders from spamming closing events to our Rocket.Chat
		
		if (!request.content?.auth && provider.hookSecret != '') {
			this.app.getLogger().error('Invalid authorization');
			return {
				status: HttpStatusCode.FORBIDDEN,
			};
		}
		
		if (!request.content?.id) {
			this.app.getLogger().error('Invalid event');
			return {
				status: HttpStatusCode.BAD_REQUEST,
			};
		}
		
		if (provider.hookSecret != '') {
			if(request.content?.auth != provider.hookSecret) {
				this.app.getLogger().error('Invalid authorisation secret');
				return {
					status: HttpStatusCode.UNAUTHORIZED,
				};
			}
		}

		let meetingID = request.content?.id
		meetingID = meetingID.toLowerCase();
		
		//Rocket.Chat adds a Prefix or Suffix to the rooms, depending on the administrator's preferences
		//However the internal ID in rocketchat misses these, so we have to remove them before handing them over'

		if(meetingID.includes('@')) {
			meetingID = meetingID.split('@')[0];
		}
		if(provider.titlePrefix != '') {
			meetingID = meetingID.replace(provider.titlePrefix.toLowerCase(),'');
		}
		if(provider.titleSuffix != '') {
			meetingID = meetingID.replace(provider.titleSuffix.toLowerCase(),'');
		}
		
		//When you get an ID, close the meeting. That is what this endpoint does.
		//IDEA: 	This could be expanded in the future to try and handle room leaving events as well
		
		const extender = modify.getExtender();		
		const videoConf = await extender.extendVideoConference(meetingID);
		videoConf.setStatus(3);		
		extender.finish(videoConf);
	
		return this.success();
	}
}
