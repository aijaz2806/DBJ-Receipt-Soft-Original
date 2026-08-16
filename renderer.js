function numberToWordsIN(n) {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
        "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const numToWords = (num) => {
        if (num < 20) return a[num];
        if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
        if (num < 1000) return a[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + numToWords(num % 100) : "");
        if (num < 100000) return numToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numToWords(num % 1000) : "");
        if (num < 10000000) return numToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numToWords(num % 100000) : "");
        return numToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + numToWords(num % 10000000) : "");
    }; 4

    return n == 0 ? "Zero" : numToWords(n);
}

document.addEventListener("DOMContentLoaded", () => {

    // 1️⃣ Define your options
    const prefixOptions = [
        { value: "SO", label: "Sabeel Office" },
        { value: "JK", label: "Jamaat Khana" }
    ];

    // 2️⃣ Grab the <select>
    const prefixSelect = document.getElementById("prefix");

    // 3️⃣ Add a placeholder option (disabled, not selected by default)
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Receipt Type";
    placeholderOption.disabled = true;
    prefixSelect.appendChild(placeholderOption);

    // 4️⃣ Now add the real options
    prefixOptions.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        prefixSelect.appendChild(o);
    });

    // 5️⃣ Default to "Jamaat Khana"
    prefixSelect.value = "SO";

    // Function to reset form values
    function resetFormFields() {
        // Reset all input fields
        document.querySelectorAll("input").forEach(input => {
            input.value = "";
        });

        prefixSelect.value = "SO"; // Reset back to Jamaat Khana as default
    }

    flatpickr("#birthday", {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        allowInput: true
    });

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.top = '24px';
        toast.style.right = '24px';
        toast.style.background = 'linear-gradient(135deg, rgba(26,23,39,0.96), rgba(18,16,28,0.98))';
        toast.style.color = '#c8a96e';
        toast.style.padding = '14px 24px';
        toast.style.borderRadius = '10px';
        toast.style.border = '1px solid rgba(200,169,110,0.4)';
        toast.style.boxShadow = '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,169,110,0.1), 0 0 18px rgba(200,169,110,0.15)';
        toast.style.fontSize = '0.95rem';
        toast.style.fontWeight = '600';
        toast.style.fontFamily = "'Inter', sans-serif";
        toast.style.letterSpacing = '0.03em';
        toast.style.backdropFilter = 'blur(16px)';
        toast.style.webkitBackdropFilter = 'blur(16px)';
        toast.style.zIndex = '10000';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.4,0,0.2,1)';

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 450);
        }, 3000);
    }

    const form = document.getElementById("user-form");
    const inputs = document.querySelectorAll("input");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // 1️⃣ Validate prefix selection
        const prefixValue = prefixSelect.value;
        if (!prefixValue) {
            alert("Please select a Receipt Type!");
            prefixSelect.focus();
            return;
        }

        const formData = {};
        inputs.forEach(input => {
            formData[input.id] = input.value.trim();
        });
        formData.prefix = prefixValue;

        const amountRaw = formData["amount"] || ""; // fallback to empty string
        const amount = parseInt(amountRaw.replace(/\D/g, ""));
        formData.amountWords = isNaN(amount) ? "" : numberToWordsIN(amount) + " Rupees Only";

        window.electronAPI.saveData(formData);
        resetFormFields();
    });

    window.electronAPI.onExcelUpdated((message) => {
        console.log(message);
        showToast("Data save to file - " + message);
    });
});
