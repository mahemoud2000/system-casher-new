   // إعدادات Firebase
   const firebaseConfig = {
    apiKey: "AIzaSyCPpTAJDRfFuDkq2TGCVIU_LnmYRBXTnSc",
    authDomain: "new-protfolio.firebaseapp.com",
    databaseURL: "https://new-protfolio-default-rtdb.firebaseio.com",
    projectId: "new-protfolio",
    storageBucket: "new-protfolio.appspot.com",
    messagingSenderId: "90141039664",
    appId: "1:90141039664:web:44d13d2f3b943f510aa1f5"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const productsRef = database.ref('products');

// دالة لإنشاء التقرير
async function generateReport() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);

    const reportData = [];
    let reportHTML = "<table border='1'><tr><th>ID</th><th>اسم المنتج</th><th>السعر</th><th>الكمية</th><th>تاريخ الإضافة</th></tr>";

    // تحميل البيانات من Firebase
    const snapshot = await productsRef.once('value');
    snapshot.forEach(childSnapshot => {
        const product = childSnapshot.val();
        const productId = childSnapshot.key;
        const productDate = new Date(product.timestamp);

        // التحقق من التاريخ
        const isAfterStart = isNaN(startDate) || productDate >= startDate;
        const isBeforeEnd = isNaN(endDate) || productDate <= endDate;

        if (isAfterStart && isBeforeEnd) {
            reportData.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: product.quantity,
                date: productDate.toLocaleString()
            });

            // إضافة البيانات إلى HTML
            reportHTML += `<tr>
                <td>${productId}</td>
                <td>${product.name}</td>
                <td>${product.price}</td>
                <td>${product.quantity}</td>
                <td>${productDate.toLocaleString()}</td>
            </tr>`;
        }
    });

    reportHTML += "</table>";

    if (reportData.length === 0) {
        reportHTML = "<p>لا توجد بيانات لتظهر في هذا النطاق الزمني.</p>";
    }

    document.getElementById('reportContent').innerHTML = reportHTML;
    document.getElementById('reportContainer').style.display = "block";
}

// دالة لتنزيل التقرير كملف PDF
async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const content = document.getElementById('reportContent');

    // تحويل التقرير إلى صورة باستخدام html2canvas
    await html2canvas(content).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 10, 10);
        doc.save("تقرير_المنتجات.pdf");
    });
}

// دالة لطباعة التقرير
function printReport() {
    const printContents = document.getElementById('reportContent').innerHTML;
    const win = window.open('', '', 'width=800,height=600');
    win.document.write('<html><head><title>طباعة التقرير</title></head><body>');
    win.document.write(printContents);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
}



