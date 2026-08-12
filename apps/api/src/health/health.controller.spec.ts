import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseHealthStatus } from './dto';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('devuelve HealthResponseDto al consultar health', async () => {
    const response = {
      status: 'ok',
      service: 'turnos-api',
      database: DatabaseHealthStatus.CONNECTED,
      timestamp: '2026-08-11T22:00:00.000Z',
    };
    mockHealthService.check.mockResolvedValue(response);

    const result = await controller.getHealth();

    expect(result).toEqual(response);
    expect(result).toHaveProperty('service', 'turnos-api');
    expect(result).not.toHaveProperty('passwordHash');
  });
});
