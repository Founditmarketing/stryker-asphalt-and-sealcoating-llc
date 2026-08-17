const CRM_ENDPOINT = 'https://www.founditos.com/api/contact-form/9c2d061e-5464-498b-8029-c05082fd3e64';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const body = req.body || {};
  // _redirect is intentionally discarded, not followed — trusting a client-supplied
  // redirect target would let a direct POST send visitors to an attacker's URL.
  const { _website, _redirect, ...fields } = body;

  // Honeypot: real visitors never fill this hidden field, bots often do.
  const isSpam = typeof _website === 'string' && _website.trim() !== '';

  if (!isSpam) {
    const payload = {
      _fi: 1,
      _source: 'server-form',
      _page_url: req.headers.referer || null,
      _referrer: req.headers.referer || null,
      _user_agent: req.headers['user-agent'] || null,
      ...fields,
    };

    try {
      await fetch(CRM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Failed to forward contact form lead to Found It CRM:', err);
    }
  }

  res.redirect(303, '/thank-you');
}
