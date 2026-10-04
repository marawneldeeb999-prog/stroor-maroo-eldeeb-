const contactFrame = document.getElementById('contactFrame');

if (contactFrame) {
    window.addEventListener('message', event => {
        if (event.source !== contactFrame.contentWindow || !event.data) return;

        if (event.data.type === 'contact-frame-height' && Number.isFinite(event.data.height)) {
            contactFrame.style.height = `${event.data.height}px`;
        }
    });

    const requestContactFrameState = () => {
        contactFrame.contentWindow.postMessage({ type: 'contact-frame-request' }, '*');
    };
    contactFrame.addEventListener('load', requestContactFrameState);
    requestContactFrameState();
} else {
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');

    const sendContactMessage = message => {
        if (window.parent !== window) window.parent.postMessage(message, '*');
    };

    const sendFrameHeight = () => {
        const height = document.documentElement.scrollHeight;
        sendContactMessage({ type: 'contact-frame-height', height });
    };

    document.querySelectorAll('input[name="deliveryPerson"]').forEach(input => {
        input.addEventListener('change', () => {
            document.querySelectorAll('.contact-person').forEach(person => {
                person.classList.toggle('active', person.querySelector('input').checked);
            });
            sendContactMessage({ type: 'selected-delivery-person', value: input.value });
        });
    });

    window.addEventListener('storage', event => {
        if (event.key === 'theme') {
            document.body.classList.toggle('dark-theme', event.newValue === 'dark');
        }
    });
    window.addEventListener('message', event => {
        if (event.source !== window.parent || event.data?.type !== 'contact-frame-request') return;
        sendContactMessage({
            type: 'selected-delivery-person',
            value: document.querySelector('input[name="deliveryPerson"]:checked')?.value || 'مروان'
        });
        sendFrameHeight();
    });

    if ('ResizeObserver' in window) {
        new ResizeObserver(sendFrameHeight).observe(document.body);
    }
    window.addEventListener('load', sendFrameHeight);
    sendContactMessage({
        type: 'selected-delivery-person',
        value: document.querySelector('input[name="deliveryPerson"]:checked')?.value || 'مروان'
    });
    sendFrameHeight();
}
