import { DatabaseHealthStatus, HealthResponseDto } from './dto';
import { HealthService } from './health.service';

const mockQueryRaw = jest.fn<Promise<unknown>, [unknown]>();

jest.mock('@turnos/database', () => ({
  prisma: {
    get $queryRaw() {
      return mockQueryRaw;
    },
  },
}));

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
    mockQueryRaw.mockReset();
  });

  it('devuelve ok cuando la base de datos responde', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.check();

    expect(result).toBeInstanceOf(HealthResponseDto);
    expect(result.status).toBe('ok');
    expect(result.database).toBe(DatabaseHealthStatus.CONNECTED);
  });

  it('devuelve degraded cuando la base de datos falla', async () => {
    mockQueryRaw.mockRejectedValue(new Error('DB down'));

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.database).toBe(DatabaseHealthStatus.ERROR);
  });
});
