import type { IModify, IRead, IHttp, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';

import type { JitsiApp } from './JitsiApp';

export class JitsiSlashCommand implements ISlashCommand {
	public command: string;

	public i18nParamsExample: string;

	public i18nDescription: string;

	public providesPreview: boolean;

	private app: JitsiApp;

	constructor(app: JitsiApp) {
		this.app = app;
		this.command = 'jitsi';
		this.i18nParamsExample = 'params_example';
		this.i18nDescription = 'command_description';
		this.providesPreview = false;
	}

	public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void> {
		const creator = modify.getCreator();
		const builder = creator.startVideoConference({
			providerName: this.app.getProvider().name,
			rid: context.getRoom().id,
			createdBy: context.getSender().id,
		});

		let [roomName] = context.getArguments();

		const sender = context.getSender();
		const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, sender.id);
		if (roomName && roomName.charAt(0) === '@') {
			roomName = roomName.substr(1);

			// If the same roomName is already saved, then delete it instead
			const [assocData]: any = await read.getPersistenceReader().readByAssociation(assoc);
			if (assocData?.roomName === roomName) {
				await persistence.updateByAssociation(assoc, { roomName: undefined }, true);
				return this.sendMessage(context, modify, `Your default video conference name has been removed.`);
			}

			await persistence.updateByAssociation(assoc, { roomName }, true);
			this.sendMessage(context, modify, `Your default video conference name was set to "${roomName}".`);
		}

		if (!roomName) {
			const [assocData]: any = await read.getPersistenceReader().readByAssociation(assoc);
			if (assocData?.roomName) {
				roomName = assocData.roomName;
			}
		}

		if (roomName) {
			builder.setTitle(roomName);
			// Store the roomName as providerData so the app can use it when generating the URL without affecting the behavior of standard video conferences.
			builder.setProviderData({ roomName });
		}

		creator.finish(builder);

		// this.app.getAccessors().environmentWriter.getServerSettings().incrementValue('Jitsi_Start_SlashCommands_Count');
	}

	private async sendMessage(context: SlashCommandContext, modify: IModify, text: string): Promise<void> {
		const msg = modify.getCreator().startMessage().setText(text).setRoom(context.getRoom()).setSender(context.getSender());

		const threadId = context.getThreadId();
		if (threadId) {
			msg.setThreadId(threadId);
		}

		await modify.getNotifier().notifyUser(context.getSender(), msg.getMessage());
	}
}
