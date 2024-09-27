
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

    let invoiceItems = [];  // لتخزين المنتجات في الفاتورة

    // دالة البحث عن المنتج بالـ ID
    function searchProductById() {
        const searchId = document.getElementById('searchId').value.trim();
        if (searchId === "") {
            document.getElementById('searchResults').innerHTML = "";
            return;
        }

        productsRef.child(searchId).once('value', (snapshot) => {
            const resultsDiv = document.getElementById('searchResults');
            resultsDiv.innerHTML = "";

            if (snapshot.exists()) {
                const product = snapshot.val();
                displayProduct(product, searchId);
            } else {
                resultsDiv.innerHTML = "<p>لا يوجد منتج بهذا الـ ID.</p>";
            }
        });
    }

    // دالة لعرض المنتج
    function displayProduct(product, productId) {
        const resultsDiv = document.getElementById('searchResults');
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <h3>${product.name}</h3>
            <p>السعر: ${product.price}</p>
            <p>الكمية المتاحة: <span id="availableQuantity">${product.quantity}</span></p>
            <label for="requestedQuantity">الكمية المطلوبة:</label>
            <input type="number" id="requestedQuantity" min="1" max="${product.quantity}" oninput="updateAvailableQuantity(${productId}, this.value, ${product.quantity})">
            <button onclick="addToInvoice('${productId}', '${product.name}', ${product.price}, ${product.quantity})">اختيار</button>
        `;
        resultsDiv.appendChild(productItem);
    }

    // دالة لتحديث الكمية المتاحة لحظيًا
    function updateAvailableQuantity(productId, requestedQuantity, availableQuantity) {
        const availableQuantitySpan = document.getElementById('availableQuantity');
        if (requestedQuantity > 0 && requestedQuantity <= availableQuantity) {
            availableQuantitySpan.innerText = availableQuantity - requestedQuantity;
        } else {
            availableQuantitySpan.innerText = availableQuantity;
        }
    }

// دالة لإضافة المنتج إلى الفاتورة
function addToInvoice(id, name, price, availableQuantity) {
    const quantityInput = document.getElementById('requestedQuantity');
    const quantity = parseInt(quantityInput.value);

    if (quantity && quantity > 0 && quantity <= availableQuantity) {
        const item = { id, name, price, quantity: parseInt(quantity) };
        invoiceItems.push(item);
        updateInvoice();

        // تحديث الكمية في المخزن مباشرة
        const productRef = productsRef.child(id);
        productRef.once('value', (snapshot) => {
            const currentQuantity = snapshot.val().quantity;
            productRef.update({ quantity: currentQuantity - quantity });
        });

        // مسح الـ ID من حقل البحث
        document.getElementById('searchId').value = ""; 
        document.getElementById('searchResults').innerHTML = ""; // مسح النتائج
    } else {
        alert("كمية غير صحيحة.");
    }
}


   // تحديث دالة تحديث الفاتورة لإضافة زر الطباعة
function updateInvoice() {
    const invoiceDiv = document.getElementById('invoice');
    invoiceDiv.innerHTML = "";

    let totalPrice = 0;
    let totalCount = 0;

    invoiceItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = `
            <p>${index + 1}. ${item.name} - سعر الوحدة: ${item.price} - الكمية: ${item.quantity} 
            <button onclick="removeFromInvoice(${index})">حذف</button></p>
        `;
        invoiceDiv.appendChild(itemDiv);
        totalPrice += item.price * item.quantity;
        totalCount += item.quantity;
    });

    document.getElementById('totalCount').innerText = `إجمالي عدد الأصناف: ${totalCount}`;
    document.getElementById('totalPrice').innerText = `إجمالي السعر: ${totalPrice}`;

    // إضافة زر الطباعة
    const printButton = document.createElement('button');
    printButton.innerText = "طباعة الفاتورة";
    printButton.onclick = printInvoice; // ربط الزر بدالة الطباعة
    invoiceDiv.appendChild(printButton);
}


// دالة لإتمام عملية البيع
function completeSale() {
    if (invoiceItems.length === 0) {
        alert("لا يوجد منتجات في الفاتورة.");
        return;
    }

    const saleId = 10 + Math.floor(Math.random() * 1000); // توليد ID عشوائي يبدأ من 10
    const saleData = {
        saleId,
        items: invoiceItems,
        timestamp: new Date().toISOString() // الوقت والتاريخ
    };

    salesRef.child(saleId).set(saleData, (error) => {
        if (error) {
            alert("حدث خطأ أثناء إتمام عملية البيع.");
        } else {
            // تحديث الكمية في المخزن بعد إتمام البيع
            invoiceItems.forEach(item => {
                const productRef = productsRef.child(item.id);
                productRef.once('value', (snapshot) => {
                    const currentQuantity = snapshot.val().quantity;
                    productRef.update({ quantity: currentQuantity - item.quantity });
                });
            });

            alert("تم إتمام عملية البيع بنجاح.");
            printInvoice(); // استدعاء دالة الطباعة بعد إتمام العملية
            invoiceItems = []; // إعادة ضبط الفاتورة
            updateInvoice();
            loadSales(); // تحميل العمليات السابقة بعد البيع
        }
    });
}

// دالة لطباعة الفاتورة
function printInvoice() {
    let printContent = document.getElementById('invoice').innerHTML;
    let printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>فاتورة</title>');
    printWindow.document.write('</head><body >');
    printWindow.document.write('<h1>فاتورة البيع</h1>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}




    // دالة لتحميل عمليات البيع السابقة
    function loadSales() {
        const salesListDiv = document.getElementById('salesList');
        const loader = document.getElementById('loader');

        salesListDiv.innerHTML = ""; // مسح القائمة السابقة
        loader.style.display = "block"; // إظهار اللودر

        salesRef.once('value', (snapshot) => {
            snapshot.forEach(childSnapshot => {
                const sale = childSnapshot.val();
                const saleId = sale.saleId;

                const saleItem = document.createElement('div');
                saleItem.innerHTML = `<h4>عملية بيع رقم: ${saleId}</h4>
                                      <p>تاريخ العملية: ${sale.timestamp}</p>`;
                sale.items.forEach(item => {
                    saleItem.innerHTML += `<p>اسم المنتج: ${item.name} - سعر الوحدة: ${item.price} - الكمية: ${item.quantity}</p>`;
                });
                salesListDiv.appendChild(saleItem);
            });
            loader.style.display = "none"; // إخفاء اللودر بعد التحميل
        });
    }

    // دالة للبحث عن عملية بيع برقم العملية
    function searchSaleById() {
        const searchSaleId = document.getElementById('searchSaleId').value.trim();
        const salesListDiv = document.getElementById('salesList');
        salesListDiv.innerHTML = ""; // مسح القائمة السابقة

        if (searchSaleId === "") {
            loadSales(); // تحميل جميع العمليات إذا لم يتم إدخال ID
            return;
        }

        salesRef.child(searchSaleId).once('value', (snapshot) => {
            if (snapshot.exists()) {
                const sale = snapshot.val();
                const saleItem = document.createElement('div');
                saleItem.innerHTML = `<h4>عملية بيع رقم: ${sale.saleId}</h4>
                                      <p>تاريخ العملية: ${sale.timestamp}</p>`;
                sale.items.forEach(item => {
                    saleItem.innerHTML += `<p>اسم المنتج: ${item.name} - سعر الوحدة: ${item.price} - الكمية: ${item.quantity}</p>`;
                });
                salesListDiv.appendChild(saleItem);
            } else {
                salesListDiv.innerHTML = "<p>لا توجد عملية بهذا الرقم.</p>";
            }
        });
    }


// دالة لطباعة الفاتورة
function printInvoice() {
    if (invoiceItems.length === 0) {
        alert("لا يوجد منتجات في الفاتورة.");
        return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write('<html><head><title>فاتورة البيع</title></head><body>');
    printWindow.document.write('<h1>فاتورة البيع</h1>');
    printWindow.document.write(`<h4>تاريخ العملية: ${new Date().toLocaleString()}</h4>`);
    printWindow.document.write('<table border="1"><tr><th>الاسم</th><th>السعر</th><th>الكمية</th></tr>');

    let totalPrice = 0;

    invoiceItems.forEach(item => {
        printWindow.document.write(`<tr><td>${item.name}</td><td>${item.price}</td><td>${item.quantity}</td></tr>`);
        totalPrice += item.price * item.quantity;
    });

    printWindow.document.write('</table>');
    printWindow.document.write(`<h4>الإجمالي: ${totalPrice}</h4>`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// تحديث دالة تحديث الفاتورة لإضافة زر الطباعة
function updateInvoice() {
    const invoiceDiv = document.getElementById('invoice');
    invoiceDiv.innerHTML = "";

    let totalPrice = 0;
    let totalCount = 0;

    invoiceItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = `
            <p>${index + 1}. ${item.name} - سعر الوحدة: ${item.price} - الكمية: ${item.quantity} 
            <button onclick="removeFromInvoice(${index})">حذف</button></p>
        `;
        invoiceDiv.appendChild(itemDiv);
        totalPrice += item.price * item.quantity;
        totalCount += item.quantity;
    });

    document.getElementById('totalCount').innerText = `إجمالي عدد الأصناف: ${totalCount}`;
    document.getElementById('totalPrice').innerText = `إجمالي السعر: ${totalPrice}`;

    // إضافة زر الطباعة
    const printButton = document.createElement('button');
    printButton.innerText = "طباعة الفاتورة";
    printButton.onclick = printInvoice; // ربط الزر بدالة الطباعة
    invoiceDiv.appendChild(printButton);
}




    // تحميل العمليات عند تحميل الصفحة
    window.onload = function() {
        loadSales();
    };