const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    mainWindow.loadFile(path.join(__dirname, "index.html"));
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createMainWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

ipcMain.on("saveData", async (event, formData) => {
    console.log("🔹 Data received in main process:", formData);

    const filePath = path.join(app.getPath("documents"), "Receipts", "Receipts_Data.xlsx");
    const prefix = formData.prefix; // e.g., "SO", "VP", "JK"
    let workbook, worksheet, existingData = [];
    const date = new Date().toLocaleDateString();

    try {
        // 🟢 Load or create workbook
        if (fs.existsSync(filePath)) {
            workbook = XLSX.readFile(filePath);
        } else {
            workbook = XLSX.utils.book_new();
        }

        // 🟢 Load or create target sheet based on prefix
        worksheet = workbook.Sheets[prefix];
        if (worksheet) {
            existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else {
            existingData = [["Receipt No", "Name", "Amount", "Purpose", "Date"]];
            worksheet = XLSX.utils.aoa_to_sheet(existingData);
            XLSX.utils.book_append_sheet(workbook, worksheet, prefix);
        }

        // 🔢 Get last receipt number for this sheet
        let lastReceiptNo = 0;
        for (let i = existingData.length - 1; i >= 1; i--) {
            const receiptNoStr = existingData[i][0];
            const receiptNo = parseInt(receiptNoStr?.replace(`${prefix}-`, ""));
            if (!isNaN(receiptNo)) {
                lastReceiptNo = receiptNo;
                break;
            }
        }

        const newReceiptNoNumber = (lastReceiptNo + 1).toString().padStart(3, "0");
        const newReceiptNo = `${prefix}-${newReceiptNoNumber}`;

        // ➕ Append new data
        existingData.push([
            newReceiptNo,
            formData.name,
            parseFloat(formData.amount),
            formData.purpose,
            date
        ]);

        // 🟢 Update sheet and save
        const updatedSheet = XLSX.utils.aoa_to_sheet(existingData);
        workbook.Sheets[prefix] = updatedSheet;
        XLSX.writeFile(workbook, filePath);

        console.log("✅ Data written to sheet:", prefix);

        // 🧾 Load print preview
        const receiptUrl = `file://${path.join(__dirname, 'receipt.html')}?no=${newReceiptNo}&name=${encodeURIComponent(formData.name)}&amount=${formData.amount}&purpose=${formData.purpose}&date=${encodeURIComponent(date)}&amountWords=${formData.amountWords}&prefix=${prefix}`;

        const printWindow = new BrowserWindow({
            width: 800,
            height: 600,
            show: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        printWindow.loadURL(receiptUrl);

        // Wait for receipt page to load fully before printing
        printWindow.webContents.once("did-finish-load", async () => {
          console.log("🟢 Receipt window loaded. Starting PDF generation...");
        
          // Step 1: Save PDF IMMEDIATELY
          try {
            const pdfData = await printWindow.webContents.printToPDF({
              // marginsType: 1,
              printBackground: true,
              pageSize: "A5"
            });
        
            const pdfDir = path.join(app.getPath("documents"), "Receipts", prefix);
            if (!fs.existsSync(pdfDir)) {
              fs.mkdirSync(pdfDir, { recursive: true });
            }
        
            const pdfFilePath = path.join(pdfDir, `${newReceiptNo}.pdf`);
            fs.writeFileSync(pdfFilePath, pdfData);
            console.log(`✅ PDF saved successfully at: ${pdfFilePath}`);
          } catch (pdfErr) {
            console.error("❌ PDF generation error:", pdfErr);
          }
        
          // Step 2: Open native print dialog
          console.log("🖨️ Opening print dialog...");

          /* Uncomment the following block if you want to show the print dialog after saving the PDF */
          // printWindow.webContents.printToPDF();

          /*  */
          setTimeout(() => {
            printWindow.webContents.print({
              silent: false,
              printBackground: true
            }, (printErr, success) => {
              if (printErr) {
                console.error("❌ Print dialog error:", printErr);
              } else if (!success) {
                console.log("🚫 User cancelled print. Closing receipt window.");
              } else {
                console.log("✅ User confirmed print.");
              }
        
              // Step 3: Close the receipt window in both cases (print or cancel)
              printWindow.close();
            });
          }, 200); // slight delay before showing print dialog (optional)
        });
        
        
        event.reply("excelUpdated", `✅ Data saved to sheet '${prefix}' in: ${filePath}`);
    } catch (error) {
        console.error("❌ Error saving Excel file:", error);
        event.reply("excelUpdated", `❌ Error: ${error.message}`);
    }
});