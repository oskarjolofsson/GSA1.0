import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import drillService from './drillService';
import { auth } from '../../../lib/firebase';
import * as authHelper from '../../analysis/services/authHelper';

vi.mock('../../../lib/firebase');
vi.mock('../../analysis/services/authHelper');

describe('DrillService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('listDrills', () => {
        it('should return a list of drills', async () => {
            const mockDrills = [
                { id: 'drill_1', title: 'Drill 1' },
                { id: 'drill_2', title: 'Drill 2' }
            ];

            authHelper.ensureUserReady.mockResolvedValue(undefined);
            auth.currentUser = { getIdToken: vi.fn().mockResolvedValue('mock-token') };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ drills: mockDrills })
            });

            const result = await drillService.listDrills();

            expect(result.success).toEqual(true);
            expect(global.fetch).toHaveBeenCalled();
        });

        // it('should return empty array on error', async () => {
        //     authHelper.ensureUserReady.mockResolvedValue(undefined);
        //     auth.currentUser = { getIdToken: vi.fn().mockResolvedValue('mock-token') };

        //     global.fetch = vi.fn().mockResolvedValue({
        //         ok: false,
        //         status: 500,
        //         text: vi.fn().mockResolvedValue('Server error')
        //     });

        //     await expect(drillService.listDrills()).rejects.toThrow();
        // });
    });


    // describe('getDrillByID', () => {
    //     it('should return a drill by ID', async () => {
    //         const mockDrill = { id: 'drill_1', title: 'Test Drill' };

    //         authHelper.ensureUserReady.mockResolvedValue(undefined);
    //         auth.currentUser = { getIdToken: vi.fn().mockResolvedValue('mock-token') };

    //         global.fetch = vi.fn().mockResolvedValue({
    //             ok: true,
    //             json: vi.fn().mockResolvedValue({ drill: mockDrill })
    //         });

    //         const result = await drillService.getDrillByID('drill_1');

    //         expect(result).toEqual(mockDrill);
    //         expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/drills/drill_1'), expect.any(Object));
    //     });

    //     it('should throw error when not signed in', async () => {
    //         authHelper.ensureUserReady.mockResolvedValue(undefined);
    //         auth.currentUser = null;

    //         await expect(drillService.getDrillByID('drill_1')).rejects.toThrow('Not signed in');
    //     });
    // });
});


