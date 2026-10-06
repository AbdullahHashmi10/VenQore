; VenQore Station — installer wording (MUI2 text overrides). Art: build/installerSidebar.bmp
!macro customHeader
  !define MUI_WELCOMEPAGE_TITLE "Welcome to VenQore Station"
  !define MUI_WELCOMEPAGE_TEXT "VenQore Station connects your VenQore POS to the hardware on this counter: receipt and kitchen printers, cash drawer, barcode scanner, scale and customer display.$\r$\n$\r$\nClick Next to install it."
  !define MUI_FINISHPAGE_TITLE "VenQore Station is ready"
  !define MUI_FINISHPAGE_TEXT "Station is installed on this computer.$\r$\n$\r$\nOpen it, enter your store name and the pairing code from Settings > Terminals in VenQore, and your hardware will be ready to use."
!macroend
