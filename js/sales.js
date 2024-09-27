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

        // دالة البحث عن المنتج بالاسم
        function searchProductByName() {
            const searchName = document.getElementById('searchName').value.trim();
            const resultsDiv = document.getElementById('searchResults');
            resultsDiv.innerHTML = "";

            if (searchName === "") {
                return;
            }

            productsRef.once('value', (snapshot) => {
                snapshot.forEach(childSnapshot => {
                    const product = childSnapshot.val();
                    const productId = childSnapshot.key;

                    if (product.name.toLowerCase().includes(searchName.toLowerCase())) {
                        displayProduct(product, productId);
                    }
                });
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

            const saleId = 11 + Math.floor(Math.random() * 1000); // توليد ID عشوائي يبدأ من 11
            let totalAmount = 0; // لتخزين المبلغ الإجمالي

            invoiceItems.forEach(item => {
                totalAmount += item.price * item.quantity; // حساب المبلغ الإجمالي
            });

            const saleData = {
                saleId,
                items: invoiceItems,
                timestamp: new Date().toISOString(), // الوقت والتاريخ
                totalAmount // تخزين المبلغ الإجمالي
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
                    const itemsDetails = sale.items.map(item => `${item.name} (سعر الوحدة: ${item.price} - الكمية: ${item.quantity})`).join(', ');
                    saleDiv.innerHTML = `<p>عملية بيع ID: ${saleId} - ${itemsDetails} - المجموع: ${sale.totalAmount} - التاريخ: ${new Date(sale.timestamp).toLocaleString()}</p>`;
                    salesListDiv.appendChild(saleDiv);
                });

                loader.style.display = "none"; // إخفاء اللودر
            });
        }

        // دالة لطباعة الفاتورة
        function printInvoice() {
            const printContents = document.getElementById('invoice').innerHTML;
            const win = window.open('', '', 'height=500,width=800');
            win.document.write('<html><head><title>فاتورة البيع</title></head><body>');
            win.document.write(printContents);
            win.document.write('</body></html>');
            win.document.close();
            win.print();
        }

        // إضافة حدث للتحقق من تحديثات قاعدة البيانات
        salesRef.on('value', (snapshot) => {
            loadSales(); // إعادة تحميل البيانات عند حدوث تغييرات
        }); 
        
        // تحميل العمليات السابقة عند تحميل الصفحة
        window.onload = loadSales;