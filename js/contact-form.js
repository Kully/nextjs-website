/**
 * Submits the contact form to Web3Forms, which emails adam@zyphr.ca.
 * The access key is public by design and is tied to the recipient address.
 */
(() => {
  const ENDPOINT = 'https://api.web3forms.com/submit';
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const status = form.querySelector('.contact-form__status');
  const submit = form.querySelector('[type="submit"]');

  const setStatus = (message, state) => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const buildPayload = () => {
    const data = Object.fromEntries(new FormData(form));
    return {
      ...data,
      access_key: form.dataset.accessKey,
      from_name: 'Zyphr website',
      subject: `Zyphr inquiry: ${data.inquiry} - ${data.name}`,
    };
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    setStatus('Sending...', 'pending');

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Request failed with status ${response.status}`);
      }
      form.reset();
      setStatus('Thanks, your message was sent.', 'success');
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setStatus('Something went wrong. Please email adam@zyphr.ca instead.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
})();
