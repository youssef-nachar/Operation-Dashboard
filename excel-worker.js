// excel-worker.js

self.importScripts(
    "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js"
);

self.onmessage = function (e) {

    try {

        const {
            reportName,
            rows
        } = e.data;

        const ws = XLSX.utils.json_to_sheet(rows);

        ws["!cols"] = [
            { wch: 20 },
            { wch: 18 },
            { wch: 12 },
            { wch: 18 }
        ];

        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            wb,
            ws,
            "Orders"
        );

        const excelBuffer = XLSX.write(wb, {
            bookType: "xlsx",
            type: "array"
        });

        self.postMessage({
            success: true,
            buffer: excelBuffer,
            fileName: `${reportName}.xlsx`
        });

    } catch (err) {

        self.postMessage({
            success: false,
            error: err.message
        });
    }
};
