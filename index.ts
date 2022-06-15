import { IConfigurationExtend } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';

import { JitsiSlashCommand } from './slashcommand';

export class JitsiApp extends App {
    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        // Setting to add a JWT token
        await configuration.settings.provideSetting({
            id: 'jitsi_jwt',
            type: SettingType.STRING,
            packageValue: '',
            required: false,
            public: false,
            i18nDescription: 'jwt_description',
            i18nLabel: 'jwt_label'
        });

        await configuration.slashCommands.provideSlashCommand(new JitsiSlashCommand());
    }
}
