const form = document.getElementById("transactionForm");

const modal = document.getElementById("modal");
const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");

const description = document.getElementById("description");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const date = document.getElementById("date");

const balanceEl = document.getElementById("balance");
const balanceChange = document.getElementById("balanceChange");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");

const transactionList =
    document.getElementById("transactionList");

const search = document.getElementById("search");
const filter = document.getElementById("filter");

const totalSpent =
    document.getElementById("totalSpent");

const themeBtn =
    document.getElementById("themeBtn");


// ================= DATA =================

let transactions =
    JSON.parse(localStorage.getItem("finovaTransactions")) || [];


// ================= MODAL =================

openModal.addEventListener("click", () => {
    modal.classList.add("show");

    date.value =
        new Date().toISOString().split("T")[0];

    setTimeout(() => description.focus(), 100);
});


closeModal.addEventListener("click", () => {
    modal.classList.remove("show");
});


modal.addEventListener("click", (e) => {

    if (e.target === modal) {
        modal.classList.remove("show");
    }

});


// ================= ADD TRANSACTION =================

form.addEventListener("submit", (e) => {

    e.preventDefault();

    const transaction = {

        id: Date.now(),

        description:
            description.value.trim(),

        amount:
            Number(amount.value),

        type:
            type.value,

        category:
            category.value,

        date:
            date.value

    };


    if (
        !transaction.description ||
        transaction.amount <= 0
    ) {
        return;
    }


    transactions.push(transaction);

    save();

    form.reset();

    modal.classList.remove("show");

    updateDashboard();

});


// ================= SAVE =================

function save() {

    localStorage.setItem(
        "finovaTransactions",
        JSON.stringify(transactions)
    );

}


// ================= DELETE =================

function deleteTransaction(id) {

    transactions =
        transactions.filter(
            transaction =>
                transaction.id !== id
        );

    save();

    updateDashboard();

}


// ================= CURRENCY =================

function money(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(value);

}


// ================= DASHBOARD =================

function updateDashboard() {

    let income = 0;
    let expense = 0;


    transactions.forEach(t => {

        if (t.type === "income") {
            income += t.amount;
        }

        else {
            expense += t.amount;
        }

    });


    const balance = income - expense;


    balanceEl.textContent = money(balance);

    balanceChange.textContent =
        money(balance);

    incomeEl.textContent =
        money(income);

    expenseEl.textContent =
        money(expense);


    // Progress bars

    const total =
        income + expense;

    const incomePercent =
        total ? (income / total) * 100 : 0;

    const expensePercent =
        total ? (expense / total) * 100 : 0;


    document.getElementById(
        "incomeProgress"
    ).style.width =
        incomePercent + "%";


    document.getElementById(
        "expenseProgress"
    ).style.width =
        expensePercent + "%";


    renderTransactions();

    updateSpending();

}


// ================= TRANSACTIONS =================

function renderTransactions() {

    const query =
        search.value.toLowerCase();

    const selectedFilter =
        filter.value;


    let filtered =
        transactions.filter(t => {

            const matchesSearch =
                t.description
                    .toLowerCase()
                    .includes(query) ||

                t.category
                    .toLowerCase()
                    .includes(query);


            const matchesFilter =
                selectedFilter === "all" ||
                t.type === selectedFilter;


            return matchesSearch &&
                   matchesFilter;

        });


    filtered =
        filtered
        .sort((a, b) => b.id - a.id)
        .slice(0, 8);


    if (filtered.length === 0) {

        transactionList.innerHTML = `
            <div class="empty-state">

                <div>₹</div>

                <h3>No transactions found</h3>

                <p>
                    Try adding a transaction
                    or changing your filter.
                </p>

            </div>
        `;

        return;
    }


    transactionList.innerHTML = "";


    filtered.forEach(t => {

        const item =
            document.createElement("div");

        item.className =
            "transaction";


        const sign =
            t.type === "income"
                ? "+"
                : "-";


        item.innerHTML = `

            <div class="transaction-left">

                <div class="transaction-icon">
                    ${getCategoryIcon(t.category)}
                </div>

                <div>

                    <div class="transaction-name">
                        ${escapeHTML(t.description)}
                    </div>

                    <div class="transaction-category">
                        ${escapeHTML(t.category)}
                        · ${formatDate(t.date)}
                    </div>

                </div>

            </div>


            <div class="transaction-right">

                <span
                    class="transaction-amount ${t.type}"
                >
                    ${sign}${money(t.amount)}
                </span>

                <button
                    class="delete-btn"
                    onclick="deleteTransaction(${t.id})"
                >
                    ×
                </button>

            </div>

        `;


        transactionList.appendChild(item);

    });

}


// ================= SPENDING =================

function updateSpending() {

    const categories = {
        Food: 0,
        Shopping: 0,
        Transport: 0,
        Other: 0
    };


    transactions.forEach(t => {

        if (
            t.type === "expense"
        ) {

            if (
                categories[t.category]
                !== undefined
            ) {

                categories[t.category] +=
                    t.amount;

            }

            else {

                categories.Other +=
                    t.amount;

            }

        }

    });


    const total =
        Object.values(categories)
            .reduce((a, b) => a + b, 0);


    totalSpent.textContent =
        money(total);


    document.getElementById(
        "foodAmount"
    ).textContent =
        money(categories.Food);


    document.getElementById(
        "shoppingAmount"
    ).textContent =
        money(categories.Shopping);


    document.getElementById(
        "transportAmount"
    ).textContent =
        money(categories.Transport);


    document.getElementById(
        "otherAmount"
    ).textContent =
        money(categories.Other);


    // Donut chart

    const food =
        categories.Food / total * 360 || 0;

    const shopping =
        categories.Shopping / total * 360 || 0;

    const transport =
        categories.Transport / total * 360 || 0;


    const foodEnd =
        food;

    const shoppingEnd =
        food + shopping;

    const transportEnd =
        shoppingEnd + transport;


    document.querySelector(".donut").style.background = `

        conic-gradient(

            #7767f0 0deg ${foodEnd}deg,

            #f2a45c
            ${foodEnd}deg ${shoppingEnd}deg,

            #5eb9d8
            ${shoppingEnd}deg ${transportEnd}deg,

            #c8cbd1
            ${transportEnd}deg 360deg

        )

    `;

}


// ================= SEARCH =================

search.addEventListener(
    "input",
    renderTransactions
);

filter.addEventListener(
    "change",
    renderTransactions
);


// ================= ICONS =================

function getCategoryIcon(category) {

    const icons = {

        Food: "🍔",

        Shopping: "🛍️",

        Transport: "🚗",

        Bills: "📄",

        Entertainment: "🎮",

        Health: "💊",

        Education: "📚",

        Salary: "💰",

        Other: "•••"

    };

    return icons[category] || "•••";

}


// ================= DATE =================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short"
        }
    );

}


// ================= SECURITY =================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// ================= DARK MODE =================

let dark =
    localStorage.getItem("finovaDark") === "true";


function applyTheme() {

    if (dark) {

        document.body.style.background =
            "#101114";

        document.body.style.color =
            "#f5f5f5";

        themeBtn.textContent = "☾";

    }

    else {

        document.body.style.background =
            "";

        document.body.style.color =
            "";

        themeBtn.textContent = "☼";

    }

}


themeBtn.addEventListener(
    "click",
    () => {

        dark = !dark;

        localStorage.setItem(
            "finovaDark",
            dark
        );

        applyTheme();

    }
);


// ================= INITIALIZE =================

applyTheme();

updateDashboard();