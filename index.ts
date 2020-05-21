import {
    IConfigurationExtend,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';

import { JitsiSlashCommand } from './slashcommand';

export class JitsiApp extends App {
    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new JitsiSlashCommand());
    }
}
