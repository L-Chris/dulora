import { Service } from 'typedi';
import { BadRequestError } from 'routing-controllers';
import { prisma } from '../../../shared/prisma';
import { DEFAULT_TZ } from '../../../../configs/constants';

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

@Service()
export class SettingsService {
  async get(): Promise<{ timezone: string }> {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1, timezone: DEFAULT_TZ },
      update: {},
    });
    return { timezone: settings.timezone };
  }

  async getTimezone(): Promise<string> {
    const { timezone } = await this.get();
    return timezone;
  }

  async update(timezone: string): Promise<{ timezone: string }> {
    if (!isValidTimezone(timezone)) throw new BadRequestError(`无效时区: ${timezone}`);
    await prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1, timezone },
      update: { timezone },
    });
    return { timezone };
  }
}
