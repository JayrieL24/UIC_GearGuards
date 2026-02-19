# Barcode Scanning Guide

## Overview
The GearGuard system supports physical barcode and RFID scanners for efficient inventory management and borrow transactions.

---

## 1. Adding New Items to Inventory (Admin Only)

### Workflow:
1. Navigate to **Admin → Inventory**
2. Click **"Add Stock"** button on any item
3. Fill in the item details:
   - **Notes** (optional): Add any specific notes about this item
4. Click **"Enable Scanner"** button
5. The input field will show: 🔍 **Scanner Ready**
6. Scan the barcode imprinted on the physical item
7. The system will **auto-save** the item with the scanned barcode as Reference ID

### Features:
- **Auto-save on scan**: No need to click save button after scanning
- **Duplicate detection**: System prevents duplicate Reference IDs
- **Manual entry option**: Can still type Reference ID manually if scanner is unavailable
- **Visual feedback**: Green border indicates scanner is active and ready

### Scanner Compatibility:
- Works with any USB/Bluetooth barcode scanner that sends data as keyboard input
- Scanner should be configured to send "Enter" key after scan (default for most scanners)

---

## 2. Walk-in Borrow Transactions (Admin & Handler)

### Workflow:
1. Navigate to **Borrow Transactions → Walk-in Borrow** tab
2. **Step 1: Scan Item Barcodes**
   - Input is auto-focused and ready
   - Scan multiple items one after another
   - Each scan adds item to the list
   - Remove items if needed using the "Remove" button
3. **Step 2: Scan Borrower RFID**
   - Scan the borrower's ID card RFID
   - System identifies the borrower automatically
4. **Step 3: Confirm Due Date**
   - Default: 3 days from current date/time
   - Adjust if needed
5. **Step 4: Add Notes** (optional)
6. Click **"Process Walk-in Borrow"**
7. System auto-resets and focuses back to barcode input for next transaction

### Features:
- **Continuous scanning**: Auto-focus returns to barcode input after each scan
- **Multiple items**: Scan as many items as needed in one transaction
- **Duplicate prevention**: Can't scan the same item twice
- **Availability check**: Only AVAILABLE items can be borrowed
- **Fast workflow**: Optimized for high-volume transactions

---

## 3. Scanner Setup

### Hardware Requirements:
- **Barcode Scanner**: Any USB or Bluetooth scanner (1D or 2D)
- **RFID Reader**: USB or Bluetooth RFID reader for ID cards

### Configuration:
Most scanners work out-of-the-box with these settings:
- **Mode**: Keyboard emulation (HID)
- **Suffix**: Carriage Return (Enter key)
- **Prefix**: None (optional)

### Recommended Scanners:
- **Barcode**: Zebra DS2208, Honeywell Voyager 1200g, Symbol LS2208
- **RFID**: ACR122U, Proxmark3, HID RFID readers

---

## 4. Barcode Label Printing

### For Inventory Items:
1. Print barcode labels with Reference IDs (e.g., LAP001, MOU042)
2. Use Code 128 or Code 39 format
3. Include human-readable text below barcode
4. Affix labels to physical items in visible location

### Label Format Example:
```
┌─────────────────┐
│  ▐▌▐ ▌▐▌ ▐ ▌▐▌  │  (Barcode)
│     LAP001      │  (Human-readable)
│   UIC Laptop    │  (Item name)
└─────────────────┘
```

### Recommended Label Printers:
- Zebra ZD410
- Brother QL-820NWB
- DYMO LabelWriter 450

---

## 5. Troubleshooting

### Scanner Not Working:
1. **Check connection**: Ensure USB/Bluetooth is connected
2. **Test in notepad**: Open notepad and scan - should type the barcode
3. **Check suffix**: Scanner should send "Enter" after scan
4. **Browser focus**: Ensure input field is focused (click on it)

### Duplicate Reference ID Error:
- Each barcode must be unique in the system
- Check if item already exists in inventory
- Use different barcode label if needed

### Scanner Scanning Too Fast:
- System handles rapid scans automatically
- Wait for success alert before next scan
- If issues persist, add small delay in scanner settings

---

## 6. Best Practices

### For Admins:
- Pre-print barcode labels before adding items
- Use consistent naming convention (e.g., LAP001, LAP002)
- Test scanner before bulk inventory addition
- Keep scanner charged (if wireless)

### For Handlers:
- Keep scanner within reach during busy hours
- Verify item details on screen after each scan
- Double-check borrower information before processing
- Report any scanning issues immediately

### For Maintenance:
- Clean scanner lens regularly
- Update scanner firmware periodically
- Keep backup manual entry option available
- Train staff on both scanner and manual workflows

---

## 7. Security Considerations

### Access Control:
- Only Admin can add new inventory items
- Both Admin and Handler can process borrows
- Barcode scanning doesn't bypass authentication

### Data Validation:
- All scanned data is validated server-side
- Duplicate barcodes are rejected
- Invalid items/users are rejected
- All transactions are logged with timestamps

---

## Support

For technical issues or questions:
1. Check this guide first
2. Test scanner in notepad/text editor
3. Verify browser compatibility (Chrome/Edge recommended)
4. Contact system administrator if issues persist
