
    //  new version
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

    // دالة لإنشاء تقرير المنتجات
    function generateProductReport() {
        productsRef.once('value').then((snapshot) => {
            let reportContent = '<h2>تقرير المنتجات</h2><table><tr><th>ID</th><th>الاسم</th><th>السعر</th><th>الكمية الحالية</th></tr>';
            snapshot.forEach(childSnapshot => {
                const product = childSnapshot.val();
                const productId = childSnapshot.key;
                reportContent += `<tr>
                    <td>${productId}</td>
                    <td>${product.name}</td>
                    <td>${product.price}</td>
                    <td>${product.quantity}</td>
                </tr>`;
            });
            reportContent += '</table>';
            document.getElementById('reportContent').innerHTML = reportContent;
            document.getElementById('reportContainer').style.display = 'block';
        }).catch((error) => {
            console.error("Error fetching product data: ", error);
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
    salesRef.once('value').then((snapshot) => {
        let reportContent = '<h2>تقرير المبيعات</h2>';
        let totalSalesAmount = 0; // لتخزين إجمالي المبيعات
        snapshot.forEach(childSnapshot => {
            const sale = childSnapshot.val();
            const saleId = childSnapshot.key;
            reportContent += `<h3>عملية رقم: ${saleId}</h3>`;
            reportContent += '<table><tr><th>اسم المنتج</th><th>السعر</th><th>الكمية</th></tr>';
            
            // إضافة تفاصيل كل عملية
            sale.items.forEach(item => {
                reportContent += `<tr>
                    <td>${item.name}</td>
                    <td>${item.price}</td>
                    <td>${item.quantity}</td>
                </tr>`;
                totalSalesAmount += item.price * item.quantity; // جمع المبلغ الإجمالي
            });
            
            reportContent += '</table>';
            reportContent += `<p>التاريخ: ${new Date(sale.timestamp).toLocaleString()}</p>`;
            reportContent += `<p><strong>إجمالي المبيعات لهذه العملية: ${totalSalesAmount}</strong></p>`;
            
            // إضافة زر الطباعة لكل عملية
            reportContent += `<button onclick="printSingleSale('${saleId}')">طباعة هذه العملية</button>`;
        });
        document.getElementById('reportContent').innerHTML = reportContent;
        document.getElementById('reportContainer').style.display = 'block';
    }).catch((error) => {
        console.error("Error fetching sales data: ", error);
    });
}

// دالة لطباعة عملية معينة كـ PDF أو طباعة عادية
function printSingleSale(saleId) {
    salesRef.child(saleId).once('value').then((snapshot) => {
        const sale = snapshot.val();
        let saleContent = `<h3>عملية رقم: ${saleId}</h3>`;
        saleContent += '<table><tr><th>اسم المنتج</th><th>السعر</th><th>الكمية</th></tr>';
        
        // إضافة تفاصيل كل عملية
        sale.items.forEach(item => {
            saleContent += `<tr>
                <td>${item.name}</td>
                <td>${item.price}</td>
                <td>${item.quantity}</td>
            </tr>`;
        });
        
        saleContent += '</table>';
        saleContent += `<p>التاريخ: ${new Date(sale.timestamp).toLocaleString()}</p>`;
        
        // طباعة التقرير
        const newWin = window.open('');
        newWin.document.write(`<html><head><title>طباعة عملية رقم: ${saleId}</title></head><body>${saleContent}</body></html>`);
        newWin.document.close();
        newWin.print();
    }).catch((error) => {
        console.error("Error fetching sale data: ", error);
    });
}



