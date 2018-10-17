import {
    IConfigurationExtend,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';

import { JitsiSlashCommand } from './slashcommand';

export class JitsiApp extends App {
    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new JitsiSlashCommand(this));

        await configuration.settings.provideSetting({
            id: 'server',
            type: SettingType.STRING,
            packageValue: 'https://meet.jit.si/',
            required: true,
            public: false,
            i18nLabel: 'server',
            i18nDescription: 'server_description',
        });
    }
}
