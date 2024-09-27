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
            <p>الكمية المتاحة: ${product.quantity}</p>
            <button onclick="addToInvoice('${productId}', '${product.name}', ${product.price}, ${product.quantity})">اختيار</button>
        `;
        resultsDiv.appendChild(productItem);
    }

    // دالة لإضافة المنتج إلى الفاتورة
    function addToInvoice(id, name, price, availableQuantity) {
        const quantity = prompt("ادخل الكمية المطلوبة:");

        if (quantity && quantity > 0 && quantity <= availableQuantity) {
            const item = { id, name, price, quantity: parseInt(quantity) };
            invoiceItems.push(item);
            updateInvoice();
        } else {
            alert("كمية غير صحيحة.");
        }
    }

    // دالة لتحديث الفاتورة
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
    }

    // دالة لحذف صنف من الفاتورة
    function removeFromInvoice(index) {
        const removedItem = invoiceItems[index];
        invoiceItems.splice(index, 1); // حذف العنصر من الفاتورة
        updateInvoice();

        // تحديث الكمية في المخزن
        const productRef = productsRef.child(removedItem.id);
        productRef.once('value', (snapshot) => {
            const currentQuantity = snapshot.val().quantity;
            productRef.update({ quantity: currentQuantity + removedItem.quantity });
        });
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
                invoiceItems = []; // إعادة ضبط الفاتورة
                updateInvoice();
                loadSales(); // تحميل العمليات السابقة بعد البيع
            }
        });
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
                const saleId = childSnapshot.key;

                const saleDiv = document.createElement('div');
                saleDiv.innerHTML = `
                    <h4>عملية بيع ${saleId}</h4>
                    <p>الوقت: ${new Date(sale.timestamp).toLocaleString()}</p>
                    <button onclick="printSale('${saleId}')">طباعة العملية</button>
                    <button onclick="deleteSale('${saleId}')">حذف العملية</button>
                `;
                salesListDiv.appendChild(saleDiv);
            });

            loader.style.display = "none"; // إخفاء اللودر بعد الانتهاء من التحميل
        });
    }

    // دالة لطباعة العملية
    function printSale(saleId) {
        salesRef.child(saleId).once('value', (snapshot) => {
            const sale = snapshot.val();
            let printWindow = window.open('', '_blank');
            printWindow.document.write('<h2>فاتورة عملية البيع</h2>');
            printWindow.document.write(`<h4>رقم العملية: ${saleId}</h4>`);
            printWindow.document.write(`<p>الوقت: ${new Date(sale.timestamp).toLocaleString()}</p>`);
            printWindow.document.write('<h3>المنتجات:</h3>');
            sale.items.forEach(item => {
                printWindow.document.write(`<p>${item.name} - سعر الوحدة: ${item.price} - الكمية: ${item.quantity}</p>`);
            });
            printWindow.document.close();
            printWindow.print();
        });
    }


    // دالة لحذف عملية البيع
    function deleteSale(saleId) {
        salesRef.child(saleId).once('value', (snapshot) => {
            if (snapshot.exists()) {
                const sale = snapshot.val();

                // تحديث الكميات في المخزن
                sale.items.forEach(item => {
                    const productRef = productsRef.child(item.id);
                    productRef.once('value', (prodSnapshot) => {
                        const currentQuantity = prodSnapshot.val().quantity;
                        productRef.update({ quantity: currentQuantity + item.quantity });
                    });
                });

                // حذف العملية بعد تحديث الكميات
                salesRef.child(saleId).remove().then(() => {
                    alert("تم حذف العملية بنجاح.");
                    loadSales(); // إعادة تحميل العمليات بعد الحذف
                }).catch(error => {
                    alert("حدث خطأ أثناء حذف العملية.");
                });
            }
        });
    }



    // دالة للبحث عن عملية بيع بالـ ID
    function searchSaleById() {
        const searchSaleId = document.getElementById('searchSaleId').value.trim();
        const salesListDiv = document.getElementById('salesList');

        salesListDiv.innerHTML = ""; // مسح القائمة السابقة

        if (searchSaleId === "") {
            loadSales(); // تحميل جميع العمليات إذا كان الحقل فارغاً
            return;
        }

        salesRef.child(searchSaleId).once('value', (snapshot) => {
            if (snapshot.exists()) {
                const sale = snapshot.val();
                const saleDiv = document.createElement('div');
                saleDiv.innerHTML = `
                    <h4>عملية بيع ${searchSaleId}</h4>
                    <p>الوقت: ${new Date(sale.timestamp).toLocaleString()}</p>
                    <button onclick="printSale('${searchSaleId}')">طباعة العملية</button>
                    <button onclick="deleteSale('${searchSaleId}')">حذف العملية</button>
                `;
                salesListDiv.appendChild(saleDiv);
            } else {
                salesListDiv.innerHTML = "<p>لا توجد عملية بهذا الرقم.</p>";
            }
        });
    }

    // تحميل العمليات عند فتح الصفحة
    loadSales();