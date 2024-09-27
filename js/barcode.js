let productCounter = {};
function generateProductId() {
    const today = new Date();
    const dateKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todayCounter = productCounter[dateKey] || 0;
    productCounter[dateKey] = todayCounter + 1;
    return `${dateKey}${String(productCounter[dateKey]).padStart(3, '0')}`;
}

function generateBarcodes() {
    const startId = parseInt(document.getElementById('startId').value);
    const endId = parseInt(document.getElementById('endId').value);
    const container = document.getElementById('barcodesContainer');
    container.innerHTML = "";

    for (let i = startId; i <= endId; i++) {
        const barcodeId = generateProductId();
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, barcodeId, { format: "CODE128" });
        container.appendChild(canvas);
    }
}

async function downloadAsImage() {
    const container = document.getElementById('barcodesContainer');
    const canvas = await html2canvas(container);
    const link = document.createElement('a');
    link.download = 'barcodes.png';
    link.href = canvas.toDataURL();
    link.click();
}

async function downloadAsPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const container = document.getElementById('barcodesContainer');

    html2canvas(container).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 10, 10);
        pdf.save('barcodes.pdf');
    });
}

async function printBarcodes() {
    const container = document.getElementById('barcodesContainer');
    const canvas = await html2canvas(container, { useCORS: true }); // استخدام CORS لتحسين عملية الطباعة
    const imgData = canvas.toDataURL('image/png');
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>طباعة باركود</title></head><body>');
    printWindow.document.write('<img src="' + imgData + '" style="width: 100%; height: auto;"/>'); 
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}