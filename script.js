 // Data storage and initialization
        const initializeData = () => {
            if (!localStorage.getItem('users')) {
                const users = [
                    
                ];
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            if (!localStorage.getItem('transactions')) {
                const transactions = [
                    
                ];
                localStorage.setItem('transactions', JSON.stringify(transactions));
            }
            
            if (!localStorage.getItem('nextUserId')) {
                localStorage.setItem('nextUserId', '4');
            }
            
            if (!localStorage.getItem('nextTransactionId')) {
                localStorage.setItem('nextTransactionId', '5');
            }
        };

        // Utility functions
        const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];
        const setUsers = (users) => localStorage.setItem('users', JSON.stringify(users));
        
        const getTransactions = () => JSON.parse(localStorage.getItem('transactions')) || [];
        const setTransactions = (transactions) => localStorage.setItem('transactions', JSON.stringify(transactions));
        
        const getNextUserId = () => {
            const nextId = parseInt(localStorage.getItem('nextUserId'));
            localStorage.setItem('nextUserId', (nextId + 1).toString());
            return nextId;
        };
        
        const getNextTransactionId = () => {
            const nextId = parseInt(localStorage.getItem('nextTransactionId'));
            localStorage.setItem('nextTransactionId', (nextId + 1).toString());
            return nextId;
        };
        
        const formatCurrency = (amount) => {
            return parseFloat(amount).toFixed(2);
        };
        
        const formatDate = (dateString) => {
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        };
        
        const showNotification = (message, type = 'success') => {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        };

        // View management
        const showView = (viewId) => {
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
            });
            document.getElementById(viewId).classList.add('active');
            
            // Scroll to top when changing views
            window.scrollTo(0, 0);
        };
        
        const showModal = (modalId) => {
            document.getElementById(modalId).classList.add('active');
        };
        
        const hideModal = (modalId) => {
            document.getElementById(modalId).classList.remove('active');
        };

        // Update header based on login status
        const updateHeader = () => {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            const logoutBtn = document.getElementById('logout-btn');
            const userInfo = document.getElementById('user-info');
            const userName = document.getElementById('user-name');
            
            if (currentUser) {
                // User is logged in
                loginBtn.style.display = 'none';
                registerBtn.style.display = 'none';
                logoutBtn.style.display = 'block';
                userInfo.style.display = 'flex';
                userName.textContent = currentUser.name;
            } else {
                // User is not logged in
                loginBtn.style.display = 'block';
                registerBtn.style.display = 'block';
                logoutBtn.style.display = 'none';
                userInfo.style.display = 'none';
            }
        };

        // Authentication functions
        const login = (email, password, userType) => {
            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password && u.type === userType);
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                updateHeader();
                return user;
            }
            return null;
        };
        
        const register = (name, email, password, userType, initialDeposit = 0) => {
            const users = getUsers();
            
            // Check if email already exists
            if (users.some(u => u.email === email)) {
                showNotification('Email already registered. Please use a different email.', 'error');
                return null;
            }
            
            const newUser = {
                id: getNextUserId(),
                name,
                email,
                password,
                type: userType,
                balance: userType === 'customer' ? parseFloat(initialDeposit) : undefined,
                joined: new Date().toISOString().split('T')[0]
            };
            
            users.push(newUser);
            setUsers(users);
            
            // If customer, create initial deposit transaction
            if (userType === 'customer' && initialDeposit > 0) {
                addTransaction({
                    userId: newUser.id,
                    type: 'deposit',
                    amount: parseFloat(initialDeposit),
                    description: 'Initial deposit',
                    balance: parseFloat(initialDeposit)
                });
            }
            
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            updateHeader();
            return newUser;
        };
        
        const logout = () => {
            localStorage.removeItem('currentUser');
            updateHeader();
            showView('home-view');
            showNotification('You have been logged out successfully.');
        };

        // Transaction functions
        const addTransaction = (transaction) => {
            const transactions = getTransactions();
            transaction.id = getNextTransactionId();
            transaction.date = new Date().toISOString();
            transactions.push(transaction);
            setTransactions(transactions);
            return transaction;
        };
        
        const processDeposit = (userId, amount, description) => {
            const users = getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1 && users[userIndex].type === 'customer') {
                users[userIndex].balance += parseFloat(amount);
                setUsers(users);
                
                const newTransaction = addTransaction({
                    userId,
                    type: 'deposit',
                    amount: parseFloat(amount),
                    description,
                    balance: users[userIndex].balance
                });
                
                // Update current user if it's the same user
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (currentUser && currentUser.id === userId) {
                    currentUser.balance = users[userIndex].balance;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }
                
                return {newBalance: users[userIndex].balance, transaction: newTransaction};
            }
            return null;
        };
        
        const processWithdrawal = (userId, amount, description) => {
            const users = getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1 && users[userIndex].type === 'customer') {
                if (users[userIndex].balance < parseFloat(amount)) {
                    showNotification('Insufficient funds for this withdrawal.', 'error');
                    return null;
                }
                
                users[userIndex].balance -= parseFloat(amount);
                setUsers(users);
                
                const newTransaction = addTransaction({
                    userId,
                    type: 'withdrawal',
                    amount: parseFloat(amount),
                    description,
                    balance: users[userIndex].balance
                });
                
                // Update current user if it's the same user
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (currentUser && currentUser.id === userId) {
                    currentUser.balance = users[userIndex].balance;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }
                
                return {newBalance: users[userIndex].balance, transaction: newTransaction};
            }
            return null;
        };
        
        const processTransfer = (fromUserId, toEmail, amount, description) => {
            const users = getUsers();
            const fromUserIndex = users.findIndex(u => u.id === fromUserId);
            const toUserIndex = users.findIndex(u => u.email === toEmail);
            
            if (fromUserIndex === -1 || users[fromUserIndex].type !== 'customer') {
                showNotification('Invalid sender account.', 'error');
                return null;
            }
            
            if (toUserIndex === -1 || users[toUserIndex].type !== 'customer') {
                showNotification('Recipient not found.', 'error');
                return null;
            }
            
            if (users[fromUserIndex].balance < parseFloat(amount)) {
                showNotification('Insufficient funds for this transfer.', 'error');
                return null;
            }
            
            if (users[fromUserIndex].email === toEmail) {
                showNotification('You cannot transfer money to yourself.', 'error');
                return null;
            }
            
            // Update balances
            users[fromUserIndex].balance -= parseFloat(amount);
            users[toUserIndex].balance += parseFloat(amount);
            setUsers(users);
            
            // Record transaction
            const newTransaction = addTransaction({
                fromUserId,
                toUserId: users[toUserIndex].id,
                type: 'transfer',
                amount: parseFloat(amount),
                description,
                fromBalance: users[fromUserIndex].balance,
                toBalance: users[toUserIndex].balance
            });
            
            // Update current user if it's the same user
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser && currentUser.id === fromUserId) {
                currentUser.balance = users[fromUserIndex].balance;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            
            return {newBalance: users[fromUserIndex].balance, transaction: newTransaction};
        };
        
        const getCustomerTransactions = (userId) => {
            const transactions = getTransactions();
            return transactions.filter(t => 
                t.userId === userId || 
                t.fromUserId === userId || 
                t.toUserId === userId
            ).sort((a, b) => new Date(b.date) - new Date(a.date));
        };
        
        const getAllTransactions = () => {
            return getTransactions().sort((a, b) => new Date(b.date) - new Date(a.date));
        };
        
        const getTodaysTransactions = () => {
            const today = new Date().toISOString().split('T')[0];
            return getTransactions().filter(t => t.date.split('T')[0] === today);
        };

        // UI Update functions
        const updateCustomerDashboard = (user) => {
            document.getElementById('customer-name').textContent = user.name;
            document.getElementById('customer-balance').textContent = formatCurrency(user.balance);
            document.getElementById('balance-date').textContent = new Date().toLocaleDateString();
            
            // Load transactions
            const transactions = getCustomerTransactions(user.id);
            const transactionList = document.getElementById('transaction-list');
            transactionList.innerHTML = '';
            
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                // Determine transaction display text
                let description = transaction.description;
                let balanceChange = '';
                let currentBalance = '';
                
                if (transaction.type === 'transfer') {
                    const users = getUsers();
                    if (transaction.fromUserId === user.id) {
                        const recipient = users.find(u => u.id === transaction.toUserId);
                        description = `Transfer to ${recipient ? recipient.name : 'Unknown'}`;
                        balanceChange = `<span style="color: var(--danger);">-$${formatCurrency(transaction.amount)}</span>`;
                        currentBalance = `$${formatCurrency(transaction.fromBalance)}`;
                    } else {
                        const sender = users.find(u => u.id === transaction.fromUserId);
                        description = `Transfer from ${sender ? sender.name : 'Unknown'}`;
                        balanceChange = `<span style="color: var(--success);">+$${formatCurrency(transaction.amount)}</span>`;
                        currentBalance = `$${formatCurrency(transaction.toBalance)}`;
                    }
                } else {
                    if (transaction.type === 'deposit') {
                        balanceChange = `<span style="color: var(--success);">+$${formatCurrency(transaction.amount)}</span>`;
                    } else {
                        balanceChange = `<span style="color: var(--danger);">-$${formatCurrency(transaction.amount)}</span>`;
                    }
                    currentBalance = `$${formatCurrency(transaction.balance)}`;
                }
                
                row.innerHTML = `
                    <td>${formatDate(transaction.date)}</td>
                    <td>${description}</td>
                    <td><span class="transaction-type ${transaction.type}">${transaction.type}</span></td>
                    <td>${balanceChange}</td>
                    <td>${currentBalance}</td>
                `;
                
                transactionList.appendChild(row);
            });
        };
        
        const updateManagerDashboard = () => {
            const users = getUsers();
            const transactions = getTransactions();
            const todaysTransactions = getTodaysTransactions();
            
            // Update stats
            const customers = users.filter(u => u.type === 'customer');
            document.getElementById('total-customers').textContent = customers.length;
            
            const totalFunds = customers.reduce((sum, customer) => sum + customer.balance, 0);
            document.getElementById('total-funds').textContent = `$${formatCurrency(totalFunds)}`;
            
            document.getElementById('total-transactions').textContent = transactions.length;
            document.getElementById('transactions-today').textContent = todaysTransactions.length;
            
            // Update customers list
            const customersList = document.getElementById('customers-list');
            customersList.innerHTML = '';
            
            customers.forEach(customer => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${customer.id}</td>
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>$${formatCurrency(customer.balance)}</td>
                    <td>
                        <button class="btn btn-primary view-customer-btn" data-id="${customer.id}">View Transactions</button>
                    </td>
                `;
                
                customersList.appendChild(row);
            });
            
            // Add event listeners to view customer buttons
            document.querySelectorAll('.view-customer-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const customerId = parseInt(e.target.getAttribute('data-id'));
                    viewCustomerTransactions(customerId);
                });
            });
            
            // Add search functionality
            const customerSearch = document.getElementById('customer-search');
            customerSearch.addEventListener('input', () => {
                const searchTerm = customerSearch.value.toLowerCase();
                const rows = customersList.querySelectorAll('tr');
                
                rows.forEach(row => {
                    const name = row.cells[1].textContent.toLowerCase();
                    const email = row.cells[2].textContent.toLowerCase();
                    
                    if (name.includes(searchTerm) || email.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        };
        
        const viewCustomerTransactions = (customerId) => {
            const users = getUsers();
            const customer = users.find(u => u.id === customerId);
            const transactions = getCustomerTransactions(customerId);
            
            // Update modal title
            document.getElementById('transaction-view-title').textContent = `Transactions for ${customer.name}`;
            
            // Populate transaction list
            const transactionList = document.getElementById('transaction-view-list');
            transactionList.innerHTML = '';
            
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                // Determine transaction display text
                let description = transaction.description;
                let balanceChange = '';
                let currentBalance = '';
                
                if (transaction.type === 'transfer') {
                    if (transaction.fromUserId === customerId) {
                        const recipient = users.find(u => u.id === transaction.toUserId);
                        description = `Transfer to ${recipient ? recipient.name : 'Unknown'}`;
                        balanceChange = `<span style="color: var(--danger);">-$${formatCurrency(transaction.amount)}</span>`;
                        currentBalance = `$${formatCurrency(transaction.fromBalance)}`;
                    } else {
                        const sender = users.find(u => u.id === transaction.fromUserId);
                        description = `Transfer from ${sender ? sender.name : 'Unknown'}`;
                        balanceChange = `<span style="color: var(--success);">+$${formatCurrency(transaction.amount)}</span>`;
                        currentBalance = `$${formatCurrency(transaction.toBalance)}`;
                    }
                } else {
                    if (transaction.type === 'deposit') {
                        balanceChange = `<span style="color: var(--success);">+$${formatCurrency(transaction.amount)}</span>`;
                    } else {
                        balanceChange = `<span style="color: var(--danger);">-$${formatCurrency(transaction.amount)}</span>`;
                    }
                    currentBalance = `$${formatCurrency(transaction.balance)}`;
                }
                
                row.innerHTML = `
                    <td>${formatDate(transaction.date)}</td>
                    <td>${description}</td>
                    <td><span class="transaction-type ${transaction.type}">${transaction.type}</span></td>
                    <td>${balanceChange}</td>
                    <td>${currentBalance}</td>
                `;
                
                transactionList.appendChild(row);
            });
            
            // Show the transaction view modal
            showModal('transaction-view-modal');
        };

        // Event listeners
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize data
            initializeData();
            
            // Update header based on login status
            updateHeader();
            
            // Mobile menu toggle
            document.querySelector('.mobile-menu-btn').addEventListener('click', () => {
                document.querySelector('nav ul').classList.toggle('show');
            });
            
            // Check if user is logged in
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                if (currentUser.type === 'customer') {
                    updateCustomerDashboard(currentUser);
                    showView('customer-dashboard');
                } else if (currentUser.type === 'manager') {
                    updateManagerDashboard();
                    showView('manager-dashboard');
                }
            }
            
            // Navigation links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    showView('home-view');
                });
            });
            
            // Hero get started button
            document.getElementById('hero-get-started').addEventListener('click', () => {
                showView('register-view');
            });
            
            // Auth buttons
            document.getElementById('login-btn').addEventListener('click', () => {
                showView('login-view');
            });
            
            document.getElementById('register-btn').addEventListener('click', () => {
                showView('register-view');
            });
            
            document.getElementById('goto-register').addEventListener('click', (e) => {
                e.preventDefault();
                showView('register-view');
            });
            
            document.getElementById('goto-login').addEventListener('click', (e) => {
                e.preventDefault();
                showView('login-view');
            });
            
            // User type selector
            document.querySelectorAll('input[name="register-type"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    const managerCodeGroup = document.getElementById('manager-code-group');
                    const initialDepositGroup = document.getElementById('initial-deposit-group');
                    if (radio.value === 'manager') {
                        managerCodeGroup.style.display = 'block';
                        initialDepositGroup.style.display = 'none';
                    } else {
                        managerCodeGroup.style.display = 'none';
                        initialDepositGroup.style.display = 'block';
                    }
                });
            });
            
            document.querySelectorAll('input[name="login-type"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    // You can add specific login form changes here if needed
                });
            });
            
            // Register form
            document.getElementById('do-register').addEventListener('click', () => {
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const userType = document.querySelector('input[name="register-type"]:checked').value;
                const initialDeposit = document.getElementById('initial-deposit').value;
                const managerCode = document.getElementById('manager-code').value;
                
                if (!name || !email || !password) {
                    showNotification('Please fill in all required fields.', 'error');
                    return;
                }
                
                if (userType === 'manager') {
                    if (managerCode !== 'MANAGER2023') {
                        showNotification('Invalid manager authorization code.', 'error');
                        return;
                    }
                }
                
                const user = register(name, email, password, userType, initialDeposit);
                if (user) {
                    if (user.type === 'customer') {
                        updateCustomerDashboard(user);
                        showView('customer-dashboard');
                        showNotification('Registration successful! Welcome to Modern Bank.');
                    } else {
                        updateManagerDashboard();
                        showView('manager-dashboard');
                        showNotification('Manager account created successfully.');
                    }
                }
            });
            
            // Login form
            document.getElementById('do-login').addEventListener('click', () => {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const userType = document.querySelector('input[name="login-type"]:checked').value;
                
                if (!email || !password) {
                    showNotification('Please enter both email and password.', 'error');
                    return;
                }
                
                const user = login(email, password, userType);
                if (user) {
                    if (user.type === 'customer') {
                        updateCustomerDashboard(user);
                        showView('customer-dashboard');
                        showNotification('Login successful! Welcome back.');
                    } else {
                        updateManagerDashboard();
                        showView('manager-dashboard');
                        showNotification('Manager login successful.');
                    }
                } else {
                    showNotification('Invalid email or password.', 'error');
                }
            });
            
            // Logout buttons
            document.getElementById('logout-btn').addEventListener('click', logout);
            document.getElementById('customer-logout').addEventListener('click', logout);
            document.getElementById('manager-logout').addEventListener('click', logout);
            
            // Transaction actions
            document.querySelectorAll('.action-card').forEach(card => {
                card.addEventListener('click', () => {
                    const action = card.getAttribute('data-action');
                    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                    
                    if (!currentUser) return;
                    
                    if (action === 'statement') {
                        // Already viewing statement
                        return;
                    }
                    
                    // Show transaction modal
                    const modal = document.getElementById('transaction-modal');
                    const title = modal.querySelector('#modal-title');
                    const amountInput = document.getElementById('transaction-amount');
                    const recipientGroup = document.getElementById('transfer-recipient-group');
                    const descriptionInput = document.getElementById('transaction-description');
                    const confirmBtn = document.getElementById('confirm-transaction');
                    
                    // Reset form
                    amountInput.value = '';
                    descriptionInput.value = '';
                    
                    // Set up modal based on action
                    if (action === 'deposit') {
                        title.textContent = 'Deposit Funds';
                        recipientGroup.style.display = 'none';
                    } else if (action === 'withdraw') {
                        title.textContent = 'Withdraw Funds';
                        recipientGroup.style.display = 'none';
                    } else if (action === 'transfer') {
                        title.textContent = 'Transfer Funds';
                        recipientGroup.style.display = 'block';
                    }
                    
                    // Set up confirm button
                    confirmBtn.onclick = () => {
                        const amount = parseFloat(amountInput.value);
                        const description = descriptionInput.value;
                        
                        if (!amount || amount <= 0) {
                            showNotification('Please enter a valid amount.', 'error');
                            return;
                        }
                        
                        if (action === 'deposit') {
                            const result = processDeposit(currentUser.id, amount, description);
                            if (result !== null) {
                                updateCustomerDashboard(currentUser);
                                hideModal('transaction-modal');
                                showNotification('Deposit successful!');
                            }
                        } else if (action === 'withdraw') {
                            const result = processWithdrawal(currentUser.id, amount, description);
                            if (result !== null) {
                                updateCustomerDashboard(currentUser);
                                hideModal('transaction-modal');
                                showNotification('Withdrawal successful!');
                            }
                        } else if (action === 'transfer') {
                            const recipientEmail = document.getElementById('transfer-recipient').value;
                            if (!recipientEmail) {
                                showNotification('Please enter recipient email.', 'error');
                                return;
                            }
                            
                            const result = processTransfer(currentUser.id, recipientEmail, amount, description);
                            if (result !== null) {
                                updateCustomerDashboard(currentUser);
                                hideModal('transaction-modal');
                                showNotification('Transfer successful!');
                            }
                        }
                    };
                    
                    showModal('transaction-modal');
                });
            });
            
            // Close modal buttons
            document.querySelectorAll('.close-modal').forEach(button => {
                button.addEventListener('click', () => {
                    hideModal('transaction-modal');
                    hideModal('transaction-view-modal');
                });
            });
            
            // View all transactions (manager)
            document.getElementById('view-all-transactions').addEventListener('click', () => {
                const transactions = getAllTransactions();
                const users = getUsers();
                
                // Update modal title
                document.getElementById('transaction-view-title').textContent = 'All System Transactions';
                
                // Populate transaction list
                const transactionList = document.getElementById('transaction-view-list');
                transactionList.innerHTML = '';
                
                transactions.forEach(transaction => {
                    const row = document.createElement('tr');
                    
                    let userInfo = 'System';
                    if (transaction.userId) {
                        const user = users.find(u => u.id === transaction.userId);
                        userInfo = user ? user.name : 'Unknown';
                    } else if (transaction.fromUserId) {
                        const user = users.find(u => u.id === transaction.fromUserId);
                        userInfo = user ? user.name : 'Unknown';
                    }
                    
                    let amountDisplay = '';
                    if (transaction.type === 'deposit') {
                        amountDisplay = `<span style="color: var(--success);">+$${formatCurrency(transaction.amount)}</span>`;
                    } else if (transaction.type === 'withdrawal') {
                        amountDisplay = `<span style="color: var(--danger);">-$${formatCurrency(transaction.amount)}</span>`;
                    } else {
                        amountDisplay = `$${formatCurrency(transaction.amount)}`;
                    }
                    
                    row.innerHTML = `
                        <td>${formatDate(transaction.date)}</td>
                        <td>${transaction.description}</td>
                        <td><span class="transaction-type ${transaction.type}">${transaction.type}</span></td>
                        <td>${amountDisplay}</td>
                        <td>${userInfo}</td>
                    `;
                    
                    transactionList.appendChild(row);
                });
                
                // Show the transaction view modal
                showModal('transaction-view-modal');
            });
            
            // Transaction filtering
            const setupTransactionFilters = () => {
                const searchInput = document.getElementById('transaction-search');
                const typeFilter = document.getElementById('transaction-type-filter');
                const dateFilter = document.getElementById('transaction-date-filter');
                const transactionList = document.getElementById('transaction-list');
                
                const filterTransactions = () => {
                    const searchTerm = searchInput.value.toLowerCase();
                    const typeValue = typeFilter.value;
                    const dateValue = dateFilter.value;
                    
                    const rows = transactionList.querySelectorAll('tr');
                    
                    rows.forEach(row => {
                        const description = row.cells[1].textContent.toLowerCase();
                        const type = row.cells[2].textContent.toLowerCase();
                        const date = row.cells[0].textContent;
                        
                        const matchesSearch = description.includes(searchTerm);
                        const matchesType = typeValue === 'all' || type === typeValue;
                        const matchesDate = !dateValue || date.includes(dateValue);
                        
                        if (matchesSearch && matchesType && matchesDate) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                };
                
                searchInput.addEventListener('input', filterTransactions);
                typeFilter.addEventListener('change', filterTransactions);
                dateFilter.addEventListener('change', filterTransactions);
            };
            
            // Initialize transaction filters when customer dashboard is shown
            const customerDashboard = document.getElementById('customer-dashboard');
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (customerDashboard.classList.contains('active')) {
                            setupTransactionFilters();
                        }
                    }
                });
            });
            
            observer.observe(customerDashboard, { attributes: true });
        });