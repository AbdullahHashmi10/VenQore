// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import PrintService from '../Utils/PrintService';
import { AMDStation } from '../Utils/AMDStation';

describe('thermal print routing', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        delete window.amdAPI;
    });

    it('does not send raw thermal jobs to the browser print dialog when Station is absent', async () => {
        const browserPrint = vi.spyOn(window, 'print').mockImplementation(() => {});

        const result = await AMDStation.print([{ type: 'text', value: 'test receipt' }]);

        expect(result).toMatchObject({ success: false });
        expect(result.error).toMatch(/VenQore Station is not running/);
        expect(browserPrint).not.toHaveBeenCalled();
    });

    it('does not silently switch a failed Station receipt to browser/PDF printing', async () => {
        window.amdAPI = {};
        const browserPrint = vi.spyOn(window, 'print').mockImplementation(() => {});
        vi.spyOn(AMDStation, 'printAndOpenDrawer').mockResolvedValue({
            success: false,
            error: 'Printer is offline',
        });

        const result = await PrintService.printInvoice({}, {}, 'thermal');

        expect(result).toMatchObject({ success: false, transport: 'station' });
        expect(result.error).toBe('Printer is offline');
        expect(browserPrint).not.toHaveBeenCalled();
    });

    it('uses the configured thermal receipt format for quick POS printing', async () => {
        const printInvoice = vi.spyOn(PrintService, 'printInvoice').mockResolvedValue({ success: true });

        await PrintService.quickPrint({ id: 'temp-sale' }, null, { default_print_type: 'thermal' });

        expect(printInvoice).toHaveBeenCalledWith(
            { id: 'temp-sale' },
            expect.objectContaining({ default_print_type: 'thermal' }),
            'thermal',
        );
    });
});
