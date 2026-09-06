import React, { useState, useRef } from 'react';
import { gsap } from 'gsap';
import { SFXText } from '../../systems/manga/SFXText';
import { SpeechBubble } from '../../systems/manga/SpeechBubble';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export const ContactForm: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        break;
      case 'subject':
        if (!value.trim()) return 'Subject is required';
        if (value.trim().length < 5) return 'Subject must be at least 5 characters';
        break;
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 20) return 'Message must be at least 20 characters';
        break;
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    let hasErrors = false;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setTouched({ name: true, email: true, subject: true, message: true });

    if (hasErrors) return;

    setStatus('submitting');

    const subjectLabels: Record<string, string> = {
      collaboration: 'Collaboration / Project Inquiry',
      freelance: 'Freelance / Contract Work',
      research: 'Research Collaboration',
      speaking: 'Speaking / Workshop',
      mentorship: 'Mentorship / Guidance',
      other: 'Other',
    };

    const subject = encodeURIComponent(`DEEPSIX: ${subjectLabels[formData.subject] || formData.subject}`);
    const body = encodeURIComponent(`From: ${formData.name} <${formData.email}>\n\n${formData.message}`);
    window.location.href = `mailto:atharvakhaire64@gmail.com?subject=${subject}&body=${body}`;

    setStatus('success');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTouched({});
    window.setTimeout(() => setStatus('idle'), 5000);
  };

  const inputClasses = 'w-full px-4 py-3 bg-ink border-2 border-ink-lighter rounded-lg font-body text-paper placeholder-paper/30 transition-all duration-300 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:opacity-50';

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block font-ui text-sm text-paper/60 mb-2">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${inputClasses} ${errors.name && touched.name ? 'border-red-500' : ''}`}
            placeholder="Your name"
            aria-invalid={errors.name && touched.name ? 'true' : 'false'}
            aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
            disabled={status === 'submitting'}
          />
          {errors.name && touched.name && (
            <p id="name-error" className="mt-1 font-ui text-xs text-red-500" role="alert">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block font-ui text-sm text-paper/60 mb-2">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${inputClasses} ${errors.email && touched.email ? 'border-red-500' : ''}`}
            placeholder="your@email.com"
            aria-invalid={errors.email && touched.email ? 'true' : 'false'}
            aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
            disabled={status === 'submitting'}
          />
          {errors.email && touched.email && (
            <p id="email-error" className="mt-1 font-ui text-xs text-red-500" role="alert">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block font-ui text-sm text-paper/60 mb-2">Subject</label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${inputClasses} ${errors.subject && touched.subject ? 'border-red-500' : ''} appearance-none`}
          aria-invalid={errors.subject && touched.subject ? 'true' : 'false'}
          aria-describedby={errors.subject && touched.subject ? 'subject-error' : undefined}
          disabled={status === 'submitting'}
        >
          <option value="" disabled>Select a topic</option>
          <option value="collaboration">Collaboration / Project Inquiry</option>
          <option value="freelance">Freelance / Contract Work</option>
          <option value="research">Research Collaboration</option>
          <option value="speaking">Speaking / Workshop</option>
          <option value="mentorship">Mentorship / Guidance</option>
          <option value="other">Other</option>
        </select>
        {errors.subject && touched.subject && (
          <p id="subject-error" className="mt-1 font-ui text-xs text-red-500" role="alert">{errors.subject}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block font-ui text-sm text-paper/60 mb-2">Message</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={6}
          className={`${inputClasses} resize-y min-h-[150px] ${errors.message && touched.message ? 'border-red-500' : ''}`}
          placeholder="Tell me about your project, idea, or question..."
          aria-invalid={errors.message && touched.message ? 'true' : 'false'}
          aria-describedby={errors.message && touched.message ? 'message-error' : undefined}
          disabled={status === 'submitting'}
        />
        {errors.message && touched.message && (
          <p id="message-error" className="mt-1 font-ui text-xs text-red-500" role="alert">{errors.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn-manga inline-flex items-center gap-3 bg-gold text-ink border-gold hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3"
        >
          {status === 'submitting' ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              Sending...
            </>
          ) : (
            <>
              <span>Send Message</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </>
          )}
        </button>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-500 font-ui text-sm animate-fade-in">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            Message sent! I'll get back to you soon.
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-500 font-ui text-sm animate-fade-in">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            Failed to send. Please try again or email directly.
          </div>
        )}
      </div>

      <p className="font-ui text-xs text-paper/40 text-center">
        Or email directly: <a href="mailto:atharvakhaire64@gmail.com" className="text-gold hover:text-gold/70 underline">atharvakhaire64@gmail.com</a>
      </p>
    </form>
  );
};
