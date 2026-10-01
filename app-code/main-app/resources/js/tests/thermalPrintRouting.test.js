// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import PrintService from '../Utils/PrintService';
import { AMDStation } from '../Utils/AMDStation';
import { printBrowserHtml } from '../Utils/BrowserPrint';
import { thermalPageText } from '../Utils/thermalPageText';
import { rememberPrintType } from '../Utils/printPreference';

vi.mock('../Utils/BrowserPrint', async importOriginal => ({
    ...await importOriginal(), printBrowserHtml: vi.fn().mockResolvedValue({ success: true }),
}));

describe('thermal print routing', () => {
    it('reads the current settings after navigation instead of the initial page payload', () => {
        document.body.innerHTML = '<div id="app"></div>';
        document.getElementById('app').dataset.page = JSON.stringify({ props: { settings: {
            default_print_type: 'regular', print_theme: 'modern', thermal_font_size: 12,
        } } });
        window.amdSettings = { default_print_type: 'thermal', print_theme: 'bold', thermal_font_size: 14 };
        expect(PrintService.getSettings()).toMatchObject({ default_print_type: 'thermal', print_theme: 'bold', thermal_font_size: 14 });
    });

    it('does not carry one store receipt preference into another store', () => {
        window.history.replaceState({}, '', '/s/first-store/settings');
        rememberPrintType('thermal');
        window.history.replaceState({}, '', '/s/second-store/settings');
        window.amdSettings = {};
        expect(PrintService.getSettings().default_print_type).toBe('regular');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete window.amdAPI;
        delete window.amdSettings;
        window.localStorage.clear();
        document.body.innerHTML = '';
        vi.clearAllMocks();
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
        const render = vi.spyOn(PrintService, '_renderToHtml').mockReturnValue('receipt');
        vi.spyOn(PrintService, '_measureThermalHeight').mockResolvedValue(120);

        await PrintService.quickPrint({ id: 'temp-sale' }, null, { default_print_type: 'thermal' });

        expect(render).toHaveBeenCalledWith(
            { id: 'temp-sale' },
            expect.objectContaining({ default_print_type: 'thermal' }),
            'thermal',
        );
        expect(printBrowserHtml.mock.calls.at(-1)[0]).toContain('size: 80mm 120mm;');
    });

    it.each([['2inch', '58mm'], ['3inch', '80mm']])('routes default transactions to the saved Station printer with %s paper', async (size, width) => {
        window.amdAPI = {};
        vi.spyOn(AMDStation, 'getPrefs').mockResolvedValue({ defaultPrinter: 'Counter receipt printer' });
        const print = vi.spyOn(AMDStation, 'printAndOpenDrawer').mockResolvedValue({ success: true });
        await PrintService.quickPrint({ id: 'temp-sale' }, null, { default_print_type: 'regular', thermal_page_size: size });
        expect(print).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ printerName: 'Counter receipt printer', paperWidth: width }));
        expect(printBrowserHtml).not.toHaveBeenCalled();
    });

    it('uses the Windows default thermal printer when Station has no saved device', async () => {
        window.amdAPI = {};
        vi.spyOn(AMDStation, 'getPrefs').mockResolvedValue({});
        vi.spyOn(AMDStation, 'getPrinters').mockResolvedValue([{ name: 'EPSON TM-T88V', isDefault: true }]);
        expect(await PrintService.resolvePrintTarget({ default_print_type: 'regular' })).toEqual({ type: 'thermal', printerName: 'EPSON TM-T88V' });
    });

    it('retains an explicit A4 choice while the default device is thermal', async () => {
        window.amdAPI = {};
        vi.spyOn(AMDStation, 'getPrefs').mockResolvedValue({ defaultPrinter: 'Receipt Printer' });
        expect((await PrintService.resolvePrintTarget({ default_print_type: 'thermal' }, 'regular')).type).toBe('regular');
    });

    it('honors the receipt format selected on this register even when a stale page still says A4', async () => {
        window.history.replaceState({}, '', '/s/amd-outlets/sales/list');
        rememberPrintType('thermal');
        const target = await PrintService.resolvePrintTarget({ default_print_type: 'regular' });
        expect(target.type).toBe('thermal');
        expect(window.amdSettings.default_print_type).toBe('thermal');
    });

    it('reflows payment/report tables into labeled records without desktop controls', async () => {
        document.body.innerHTML = '<main><button>Delete</button><p>Payment received</p><table><thead><tr><th>Invoice</th><th>Amount</th></tr></thead><tbody><tr><td>INV-1</td><td>100</td></tr></tbody></table><div class="no-print">Private controls</div></main>';
        expect(thermalPageText(document.querySelector('main'))).toBe('Payment received\n\nInvoice: INV-1\nAmount: 100');
        await PrintService.printPage(null, { default_print_type: 'thermal', thermal_page_size: '2inch' });
        expect(printBrowserHtml).toHaveBeenCalledWith(expect.stringContaining('Invoice: INV-1'), '58mm');
        expect(printBrowserHtml.mock.calls.at(-1)[0]).not.toContain('Delete');
    });

    it('keeps page printing on the selected Station thermal device', async () => {
        document.body.innerHTML = '<main>Payment 100</main>';
        window.amdAPI = {};
        vi.spyOn(AMDStation, 'getPrefs').mockResolvedValue({ defaultPrinter: 'Receipt Printer' });
        const print = vi.spyOn(AMDStation, 'print').mockResolvedValue({ success: true });
        await PrintService.printPage(null, { default_print_type: 'regular', thermal_page_size: '2inch' });
        expect(print).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ printerName: 'Receipt Printer', paperWidth: '58mm' }));
        expect(printBrowserHtml).not.toHaveBeenCalled();
    });
});
