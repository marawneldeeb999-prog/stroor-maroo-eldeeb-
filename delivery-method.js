const deliveryFrame = document.getElementById('deliveryMethodFrame');

if (deliveryFrame) {
    const sendFrameMessage = message => deliveryFrame.contentWindow.postMessage(message, '*');

    const updateFrameTheme = () => {
        sendFrameMessage({
            type: 'delivery-method-theme',
            dark: document.body.classList.contains('dark-theme')
        });
    };

    deliveryFrame.addEventListener('load', updateFrameTheme);
    window.addEventListener('storage', event => {
        if (event.key === 'theme') updateFrameTheme();
    });
    window.addEventListener('message', event => {
        if (event.source !== deliveryFrame.contentWindow || !event.data) return;
        if (event.data.type === 'delivery-method-frame-ready') updateFrameTheme();
    });
} else {
    const sendFrameMessage = message => {
        if (window.parent !== window) window.parent.postMessage(message, '*');
    };
    const sendFrameHeight = () => {
        sendFrameMessage({
            type: 'delivery-method-frame-height',
            height: document.documentElement.scrollHeight
        });
    };

    document.querySelectorAll('input[name="deliveryMethod"]').forEach(input => {
        input.addEventListener('change', () => {
            document.querySelectorAll('.delivery-option').forEach(option => {
                option.classList.toggle('active', option.querySelector('input').checked);
            });
            sendFrameMessage({
                type: 'delivery-method-selected',
                value: input.value,
                fee: Number(input.dataset.fee)
            });
        });
    });

    window.addEventListener('message', event => {
        if (event.source !== window.parent || !event.data) return;
        if (event.data.type === 'delivery-method-theme') {
            document.body.classList.toggle('dark-theme', event.data.dark === true);
        }
    });

    if ('ResizeObserver' in window) new ResizeObserver(sendFrameHeight).observe(document.body);
    window.addEventListener('load', sendFrameHeight);
    sendFrameMessage({ type: 'delivery-method-frame-ready' });
    sendFrameMessage({
        type: 'delivery-method-selected',
        value: 'سيارة',
        fee: 7
    });
    sendFrameHeight();
}
