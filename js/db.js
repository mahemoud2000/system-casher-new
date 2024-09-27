const firebaseConfig = {
    apiKey: "AIzaSyCPpTAJDRfFuDkq2TGCVIU_LnmYRBXTnSc",
    authDomain: "new-protfolio.firebaseapp.com",
    databaseURL: "https://new-protfolio-default-rtdb.firebaseio.com",
    projectId: "new-protfolio",
    storageBucket: "new-protfolio.appspot.com",
    messagingSenderId: "90141039664",
    appId: "1:90141039664:web:44d13d2f3b943f510aa1f5"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const productsRef = database.ref('products');
const salesRef = database.ref('sales');
const reportsRef = database.ref('reports');

function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// عرض المنتجات
function showProducts() {
    showLoader();
    productsRef.on('value', (snapshot) => {
        hideLoader();
        displayProducts(snapshot);
    });
}

// عرض المنتجات
function displayProducts(snapshot) {
    const dataDisplay = document.getElementById('dataDisplay');
    dataDisplay.innerHTML = ''; // مسح المحتوى السابق
    snapshot.forEach(childSnapshot => {
        const product = childSnapshot.val();
        const productId = childSnapshot.key.padStart(3, '0');

        dataDisplay.innerHTML += `
            <div>
                <h3>المنتج ${productId}</h3>
                <p>الاسم: ${product.name}</p>
                <p>السعر: ${product.price}</p>
                <p>الكمية: ${product.quantity}</p>
                <button onclick="deleteProduct('${childSnapshot.key}')">حذف</button>
            </div>
        `;
    });
}

// عرض المبيعات
function showSales() {
    showLoader();
    salesRef.on('value', (snapshot) => {
        hideLoader();
        const dataDisplay = document.getElementById('dataDisplay');
        dataDisplay.innerHTML = '';

        snapshot.forEach(childSnapshot => {
            const sale = childSnapshot.val();
            const saleId = childSnapshot.key;

            dataDisplay.innerHTML += `
                <div>
                    <h3>عملية بيع ${saleId}</h3>
                    <p>التاريخ: ${new Date(sale.timestamp).toLocaleString()}</p>
                    <button onclick="deleteSale('${saleId}')">حذف</button>
                    <button onclick="printSale('${saleId}')">طباعة</button>
                </div>
            `;
        });
    });
}

// عرض التقارير
function showReports() {
    showLoader();
    reportsRef.on('value', (snapshot) => {
        hideLoader();
        const dataDisplay = document.getElementById('dataDisplay');
        dataDisplay.innerHTML = '';

        snapshot.forEach(childSnapshot => {
            const report = childSnapshot.val();
            const reportId = childSnapshot.key;

            dataDisplay.innerHTML += `
                <div>
                    <h3>تقرير ${reportId}</h3>
                    <p>التفاصيل: ${report.details}</p>
                    <button onclick="deleteReport('${reportId}')">حذف</button>
                </div>
            `;
        });
    });
}

function deleteProduct(productId) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟')) {
        productsRef.child(productId).remove().then(() => {
            alert('تم حذف المنتج بنجاح.');
        });
    }
}

function deleteSale(saleId) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذه العملية؟')) {
        salesRef.child(saleId).once('value', (snapshot) => {
            const sale = snapshot.val();
            if (sale && sale.items && sale.items['0']) {
                const item = sale.items['0'];
                const productId = item.id; // افترض أن لديك معرف المنتج في العناصر
                const soldQuantity = item.quantity;

                // تحديث الكمية في المخزن
                productsRef.child(productId).once('value', (productSnapshot) => {
                    const product = productSnapshot.val();
                    if (product) {
                        const updatedQuantity = product.quantity + soldQuantity; // زيادة الكمية
                        productsRef.child(productId).update({ quantity: updatedQuantity })
                            .then(() => {
                                // حذف عملية البيع بعد تحديث المخزن
                                salesRef.child(saleId).remove().then(() => {
                                    alert('تم حذف عملية البيع بنجاح. وتم استرجاع الكمية إلى المخزن.');
                                });
                            });
                    } else {
                        alert('لم يتم العثور على المنتج المرافق لهذه العملية.');
                    }
                });
            } else {
                alert('لا توجد بيانات للبيع أو العناصر غير موجودة.');
            }
        });
    }
}
function deleteReport(reportId) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا التقرير؟')) {
        reportsRef.child(reportId).remove().then(() => {
            alert('تم حذف التقرير بنجاح.');
        });
    }
}

function deleteAllData() {
    const password = prompt('أدخل كلمة المرور لمسح جميع البيانات:');
    if (password === '000') {
        if (confirm('هل أنت متأكد أنك تريد مسح كل البيانات؟')) {
            showLoader();
            Promise.all([
                productsRef.remove(),
                salesRef.remove(),
                reportsRef.remove()
            ]).then(() => {
                hideLoader();
                alert('تم مسح جميع البيانات بنجاح.');
            }).catch(error => {
                hideLoader();
                alert('حدث خطأ: ' + error.message);
            });
        }
    } else {
        alert('كلمة المرور غير صحيحة.');
    }
}

// البحث عن المنتجات وعرض جميع النتائج المطابقة
// البحث عن المنتجات وعرض جميع النتائج المطابقة
function searchProduct() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    productsRef.once('value', (snapshot) => {
        const dataDisplay = document.getElementById('dataDisplay');
        dataDisplay.innerHTML = ''; // مسح المحتوى السابق
        let found = false;

        snapshot.forEach(childSnapshot => {
            const product = childSnapshot.val();
            const productId = childSnapshot.key.padStart(3, '0');

            // التحقق من تطابق البحث بالاسم أو ID
            if (productId.includes(query) || product.name.toLowerCase().includes(query)) {
                found = true;
                dataDisplay.innerHTML += `
                    <div>
                        <h3>المنتج ${productId}</h3>
                        <p>الاسم: ${product.name}</p>
                        <p>السعر: ${product.price}</p>
                        <p>الكمية: ${product.quantity}</p>
                        <button onclick="deleteProduct('${childSnapshot.key}')">حذف</button>
                    </div>
                `;
            }
        });

        if (!found) {
            dataDisplay.innerHTML = '<p>لم يتم العثور على نتائج.</p>';
        }
    });
}

// إضافة حدث للبحث عند تغيير قيمة حقل الإدخال
document.getElementById('searchInput').addEventListener('input', searchProduct);

        // اختبر الماسح
        function testScannerInput() {
            // إدخال قيمة افتراضية كاختبار
            document.getElementById('searchInput').value = '001'; // أو أي قيمة ترغب في اختبارها
            searchProduct(); // استدعاء دالة البحث لعرض النتائج
        }


        
// طباعة تفاصيل عملية البيع
function printSale(saleId) {
    salesRef.child(saleId).once('value', (snapshot) => {
        const sale = snapshot.val();

        if (!sale || !sale.items) {
            alert('لا توجد بيانات للبيع أو العناصر غير موجودة.');
            return;
        }

        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write('<html><head><title>طباعة عملية بيع</title></head><body>');
        printWindow.document.write(`<h2>فاتورة بيع - ${saleId}</h2>`);
        printWindow.document.write(`<p><strong>التاريخ:</strong> ${new Date(sale.timestamp).toLocaleString()}</p>`);
        printWindow.document.write('<table border="1" style="width: 100%; border-collapse: collapse; text-align: center;">');
        printWindow.document.write('<thead><tr><th>الصنف</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th></tr></thead>');
        printWindow.document.write('<tbody>');

        let totalAmount = 0;

        // المرور على جميع العناصر
        for (let key in sale.items) {
            const item = sale.items[key];
            const itemTotal = item.price * item.quantity; // حساب الإجمالي لكل عنصر
            totalAmount += itemTotal;

            printWindow.document.write(`
                <tr>
                    <td>${item.name || 'غير معروف'}</td>
                    <td>${item.price ? item.price.toFixed(2) : 'غير متوفر'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${itemTotal.toFixed(2)}</td>
                </tr>
            `);
        }

        printWindow.document.write('</tbody>');
        printWindow.document.write(`
            <tfoot>
                <tr>
                    <td colspan="3"><strong>الإجمالي:</strong></td>
                    <td>${totalAmount.toFixed(2)}</td>
                </tr>
            </tfoot>
        `);
        printWindow.document.write('</table>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    });
}
