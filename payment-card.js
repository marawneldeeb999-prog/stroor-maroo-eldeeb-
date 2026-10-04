const paymentCardFrame = document.getElementById('paymentCardFrame');

if (paymentCardFrame) {
    const requestPaymentCardState = () => {
        paymentCardFrame.contentWindow.postMessage({ type: 'payment-card-request' }, '*');
    };
    const updatePaymentCardTheme = () => {
        paymentCardFrame.contentWindow.postMessage({
            type: 'payment-card-theme',
            dark: document.body.classList.contains('dark-theme')
        }, '*');
    };

    paymentCardFrame.addEventListener('load', () => {
        requestPaymentCardState();
        updatePaymentCardTheme();
    });
    window.addEventListener('storage', event => {
        if (event.key === 'theme') updatePaymentCardTheme();
    });
    window.addEventListener('message', event => {
        if (event.source !== paymentCardFrame.contentWindow || !event.data) return;
        if (event.data.type === 'payment-card-frame-ready') {
            requestPaymentCardState();
            updatePaymentCardTheme();
        }
    });
} else {
    const cardFields = document.querySelector('.card-fields');
    const cardNumberInput = document.getElementById('cardNum');
    const expiryInput = document.getElementById('cardExpiry');
    const cvvInput = document.getElementById('cardCvv');
    const sendToCheckout = message => {
        if (window.parent !== window) window.parent.postMessage(message, '*');
    };
    const sendCardData = () => {
        sendToCheckout({
            type: 'payment-card-data',
            cardNumber: cardNumberInput.value,
            expiry: expiryInput.value,
            cvv: cvvInput.value
        });
    };
    const sendFrameHeight = () => {
        sendToCheckout({
            type: 'payment-card-frame-height',
            height: Math.ceil(cardFields.getBoundingClientRect().height)
        });
    };

    cardNumberInput.addEventListener('input', () => {
        const cursor = cardNumberInput.selectionStart ?? cardNumberInput.value.length;
        const digitsBeforeCursor = cardNumberInput.value.slice(0, cursor).replace(/\D/g, '').length;
        const digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 16);
        const formatted = digits.replace(/\B(?=(\d{4})+(?!\d))/g, ' ');
        cardNumberInput.value = formatted;

        let nextCursor = 0;
        let countedDigits = 0;
        while (nextCursor < formatted.length && countedDigits < digitsBeforeCursor) {
            if (/\d/.test(formatted[nextCursor])) countedDigits++;
            nextCursor++;
        }
        if (formatted[nextCursor] === ' ') nextCursor++;
        cardNumberInput.setSelectionRange(nextCursor, nextCursor);
        sendCardData();
    });

    expiryInput.addEventListener('input', () => {
        const cursor = expiryInput.selectionStart ?? expiryInput.value.length;
        const digitsBeforeCursor = expiryInput.value.slice(0, cursor).replace(/\D/g, '').length;
        const digits = expiryInput.value.replace(/\D/g, '').slice(0, 4);
        expiryInput.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
        const nextCursor = digitsBeforeCursor > 2 ? digitsBeforeCursor + 1 : digitsBeforeCursor;
        expiryInput.setSelectionRange(nextCursor, nextCursor);
        sendCardData();
    });

    cvvInput.addEventListener('input', () => {
        cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 3);
        sendCardData();
    });

    window.addEventListener('message', event => {
        if (event.source !== window.parent || !event.data) return;
        if (event.data.type === 'payment-card-request') sendCardData();
        if (event.data.type === 'payment-card-theme') {
            document.body.classList.toggle('dark-theme', event.data.dark === true);
        }
    });

    if ('ResizeObserver' in window) new ResizeObserver(sendFrameHeight).observe(cardFields);
    window.addEventListener('load', sendFrameHeight);
    sendToCheckout({ type: 'payment-card-frame-ready' });
    sendCardData();
    sendFrameHeight();
}
