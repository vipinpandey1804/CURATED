import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (!form.subject.trim()) errs.subject = 'Required';
    if (!form.message.trim()) errs.message = 'Required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
  }

  return (
    <main className="pt-[96px] min-h-screen">
      {/* Header */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-16 border-b border-brand-border">
        <p className="section-label mb-3">Get In Touch</p>
        <h1 className="font-serif text-5xl lg:text-7xl font-light text-brand-dark">Contact.</h1>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Contact info */}
        <div>
          <h2 className="font-serif text-2xl font-light text-brand-dark mb-8">We'd love to hear from you.</h2>
          <p className="text-sm text-brand-muted leading-relaxed mb-10">
            Whether you have a question about a product, need help with an order, or just want to say hello — our team is here.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail size={16} className="text-brand-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs tracking-widest uppercase text-brand-muted mb-1">Email</p>
                <p className="text-sm text-brand-dark">hello@curated.store</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone size={16} className="text-brand-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs tracking-widest uppercase text-brand-muted mb-1">Phone</p>
                <p className="text-sm text-brand-dark">+1 (212) 555-0100</p>
                <p className="text-xs text-brand-muted mt-0.5">Mon – Fri, 9am – 6pm EST</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin size={16} className="text-brand-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs tracking-widest uppercase text-brand-muted mb-1">Address</p>
                <p className="text-sm text-brand-dark">248 Designer Row, Suite 10</p>
                <p className="text-sm text-brand-dark">Brooklyn, NY 11201</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div>
          {submitted ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-brand-dark/10 flex items-center justify-center mx-auto mb-4">
                <Mail size={20} className="text-brand-dark" />
              </div>
              <h2 className="font-serif text-2xl font-light text-brand-dark mb-2">Message Sent</h2>
              <p className="text-sm text-brand-muted">We'll get back to you within 1–2 business days.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                className="mt-6 btn-ghost text-xs"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {[
                { name: 'name', label: 'Full Name', type: 'text' },
                { name: 'email', label: 'Email Address', type: 'email' },
                { name: 'subject', label: 'Subject', type: 'text' },
              ].map(({ name, label, type }) => (
                <div key={name}>
                  <label className="block text-xs text-brand-muted mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[name]}
                    onChange={(e) => { setForm({ ...form, [name]: e.target.value }); if (errors[name]) setErrors({ ...errors, [name]: undefined }); }}
                    className={`input-box w-full ${errors[name] ? 'border-red-400' : ''}`}
                  />
                  {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs text-brand-muted mb-1">Message</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => { setForm({ ...form, message: e.target.value }); if (errors.message) setErrors({ ...errors, message: undefined }); }}
                  className={`input-box w-full resize-none ${errors.message ? 'border-red-400' : ''}`}
                />
                {errors.message && <p className="text-xs text-red-500 mt-0.5">{errors.message}</p>}
              </div>
              <button type="submit" className="btn-primary">Send Message</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
