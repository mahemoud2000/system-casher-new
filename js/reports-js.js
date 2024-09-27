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
const salesRef = database.ref('sales');

// دالة لعرض اللودر
function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

// دالة لإخفاء اللودر
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// دالة لإنشاء تقرير المنتجات
function generateProductReport() {
    showLoader(); // عرض اللودر
    productsRef.once('value').then((snapshot) => {
        let reportContent = '<h2>تقرير المنتجات</h2><table class="report-table">';
        reportContent += '<tr><th>ID</th><th>الاسم</th><th>السعر</th><th>الكمية الحالية</th></tr>';
        
        let totalItems = 0; // إجمالي عدد الأصناف
        let totalQuantity = 0; // إجمالي الكمية

        // تمرير على كل منتج وإضافة البيانات إلى التقرير
        snapshot.forEach(childSnapshot => {
            const product = childSnapshot.val();
            const productId = childSnapshot.key;

            // التأكد من أن الكمية رقمية وإذا لم تكن، تحويلها إلى صفر
            const quantity = parseInt(product.quantity, 10) || 0;

            // زيادة عدد الأصناف وزيادة إجمالي الكمية
            totalItems++;
            totalQuantity += quantity; // جمع الكميات

            reportContent += `<tr>
                <td>${productId}</td>
                <td>${product.name}</td>
                <td>${product.price}</td>
                <td>${quantity}</td>
            </tr>`;
        });

        // إضافة إجمالي الأصناف وإجمالي الكمية في نهاية التقرير
        reportContent += `
            <tr>
                <td colspan="3" style="text-align: right;"><strong>إجمالي الأصناف:</strong></td>
                <td>${totalItems}</td>
            </tr>
            <tr>
                <td colspan="3" style="text-align: right;"><strong>إجمالي الكمية:</strong></td>
                <td>${totalQuantity}</td>
            </tr>
        `;

        reportContent += '</table>';
        document.getElementById('reportContent').innerHTML = reportContent;
        document.getElementById('reportContainer').style.display = 'block';
        hideLoader(); // إخفاء اللودر بعد الانتهاء
    }).catch((error) => {
        console.error("Error fetching product data: ", error);
        hideLoader(); // إخفاء اللودر في حال حدوث خطأ
    });
}

// دالة لطباعة التقرير
function printReport() {
    const reportContent = document.getElementById('reportContent').innerHTML;
    const newWin = window.open('');
    newWin.document.write(`<html><head><title>طباعة التقرير</title></head><body>${reportContent}</body></html>`);
    newWin.document.close();
    newWin.print();
}

// دالة لتحميل التقرير كملف PDF
function downloadPDF() {
    const reportContent = document.getElementById('reportContent');
    html2canvas(reportContent).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        pdf.addImage(imgData, 'PNG', 0, 0);
        pdf.save("report.pdf");
    }).catch(error => {
        console.error("Error generating PDF: ", error);
    });
}

// دالة لإنشاء تقرير المبيعات
function generateSalesReport() {
    showLoader(); // عرض اللودر
    salesRef.once('value').then((snapshot) => {
        let reportContent = '<h2>تقرير المبيعات</h2>';
        let grandTotalSalesAmount = 0; // لتخزين إجمالي المبيعات لكل العمليات
        let grandTotalItems = 0; // لتخزين إجمالي عدد الأصناف لكل العمليات
        let totalSalesCount = 0; // لتخزين إجمالي عدد عمليات البيع

        snapshot.forEach(childSnapshot => {
            const sale = childSnapshot.val();
            const saleId = childSnapshot.key;
            let totalSalesAmount = 0; // لتخزين إجمالي المبيعات لهذه العملية فقط
            let totalItems = 0; // لتخزين إجمالي عدد الأصناف لهذه العملية
            
            reportContent += `<h3>عملية رقم: ${saleId}</h3>`;
            reportContent += '<table class="report-table"><tr><th>اسم المنتج</th><th>السعر</th><th>الكمية</th></tr>';

            // إضافة تفاصيل كل عملية
            sale.items.forEach(item => {
                reportContent += `<tr>
                    <td>${item.name}</td>
                    <td>${item.price}</td>
                    <td>${item.quantity}</td>
                </tr>`;
                totalSalesAmount += item.price * item.quantity; // حساب المبلغ الإجمالي لهذه العملية
                totalItems += item.quantity; // حساب إجمالي عدد الأصناف لهذه العملية
            });

            reportContent += '</table>';
            reportContent += `<p class="total-sales">إجمالي المبيعات لهذه العملية: ${totalSalesAmount} ج.م</p>`;
            reportContent += `<p class="total-items">إجمالي عدد الأصناف: ${totalItems}</p>`;
            
            // زر لطباعة العملية
            reportContent += `<button onclick="printSaleReport('${saleId}')">طباعة عملية رقم ${saleId}</button>`;
            
            // زيادة المجموع الإجمالي
            grandTotalSalesAmount += totalSalesAmount;
            grandTotalItems += totalItems;
            totalSalesCount++;
        });

        // إضافة الإجمالي الكلي
        reportContent += `<h2>الإجمالي الكلي</h2>`;
        reportContent += `<p>إجمالي عدد عمليات البيع: ${totalSalesCount}</p>`;
        reportContent += `<p>إجمالي المبيعات: ${grandTotalSalesAmount} ج.م</p>`;
        reportContent += `<p>إجمالي عدد الأصناف المباعة: ${grandTotalItems}</p>`;

        document.getElementById('reportContent').innerHTML = reportContent;
        document.getElementById('reportContainer').style.display = 'block';
        hideLoader(); // إخفاء اللودر بعد الانتهاء
    }).catch((error) => {
        console.error("Error fetching sales data: ", error);
        hideLoader(); // إخفاء اللودر في حال حدوث خطأ
    });
}

// دالة لطباعة تقرير عملية واحدة
function printSaleReport(saleId) {
    // الحصول على تفاصيل العملية المعنية
    salesRef.child(saleId).once('value').then((snapshot) => {
        const sale = snapshot.val();
        let reportContent = `<h2>عملية رقم: ${saleId}</h2>`;
        reportContent += '<table class="report-table"><tr><th>اسم المنتج</th><th>السعر</th><th>الكمية</th></tr>';

        let totalSalesAmount = 0; // لتخزين إجمالي المبيعات لهذه العملية فقط
        let totalItems = 0; // لتخزين إجمالي عدد الأصناف لهذه العملية
        
        // إضافة تفاصيل كل عملية
        sale.items.forEach(item => {
            reportContent += `<tr>
                <td>${item.name}</td>
                <td>${item.price}</td>
                <td>${item.quantity}</td>
            </tr>`;
            totalSalesAmount += item.price * item.quantity; // حساب المبلغ الإجمالي لهذه العملية
            totalItems += item.quantity; // حساب إجمالي عدد الأصناف لهذه العملية
        });

        reportContent += '</table>';
        reportContent += `<p class="total-sales">إجمالي المبيعات لهذه العملية: ${totalSalesAmount} ج.م</p>`;
        reportContent += `<p class="total-items">إجمالي عدد الأصناف: ${totalItems}</p>`;

        // فتح نافذة جديدة للطباعة
        const newWin = window.open('');
        newWin.document.write(`<html><head><title>طباعة تقرير عملية رقم ${saleId}</title></head><body>${reportContent}</body></html>`);
        newWin.document.close();
        newWin.print();
    }).catch(error => {
        console.error("Error fetching sale data: ", error);
    });
}
