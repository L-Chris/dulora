// esbuild 打包后目录扫描不可用，显式注册所有 controller（对齐 flashnext 做法）
import { AuthController } from './auth.controller';
import { HealthController } from './health.controller';
import { CalendarController, EntryController } from './entry.controller';
import { TagController } from './tag.controller';
import { SearchController, SettingsController } from './settings.controller';

export const controllers = [
  AuthController,
  HealthController,
  EntryController,
  CalendarController,
  TagController,
  SearchController,
  SettingsController,
];
