import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Target, LineChart } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const valueProps = [
  {
    icon: MessageSquare,
    title: 'Financial Awareness',
    desc: 'Understand your spending habits, income patterns, and overall financial health with clear, actionable insights.',
  },
  {
    icon: Target,
    title: 'Smart Planning',
    desc: 'Set personalized financial goals and track your progress with intelligent milestones and reminders.',
  },
  {
    icon: LineChart,
    title: 'Investment Insights',
    desc: 'Get AI-powered stock analysis and market trends to make informed investment decisions.',
  },
];

const stats = [
  { value: '20%', label: 'Average savings increase' },
  { value: '25%', label: 'Better financial awareness' },
  { value: '30%', label: 'Debt reduction' },
  { value: '500+', label: 'Financial questions answered daily' },
];

const features = [
  {
    title: 'AI Chatbot',
    desc: 'Ask anything about personal finance, budgeting, or investments. Our AI assistant provides instant, personalized answers tailored to your situation.',
    link: '/chat',
    cta: 'Start Chatting',
  },
  {
    title: 'Goal Tracker',
    desc: "Whether it's saving for a vacation or paying off debt, set clear goals and watch your progress grow over time with smart tracking.",
    link: '/goals',
    cta: 'Set a Goal',
  },
  {
    title: 'Stock Analysis',
    desc: 'Get real-time insights on stocks, market trends, and portfolio suggestions powered by AI — no finance degree required.',
    link: '/chat',
    cta: 'Analyze Stocks',
  },
];

const faqs = [
  {
    q: 'Is FinBud free to use?',
    a: 'Yes! FinBud offers a free tier with access to the AI chatbot, goal tracking, and basic stock insights. Premium features may be available in the future.',
  },
  {
    q: 'How does the AI chatbot work?',
    a: "Our chatbot is powered by OpenAI's GPT models. It understands your financial questions and provides concise, informative answers based on your conversation context.",
  },
  {
    q: 'Is my financial data secure?',
    a: 'Absolutely. We never store sensitive financial credentials. Your conversations are private and tied to your account only.',
  },
  {
    q: 'Can FinBud replace a financial advisor?',
    a: "FinBud is a great starting point for financial literacy and planning, but it's not a substitute for professional financial advice. Always consult a certified advisor for major financial decisions.",
  },
];

const featureIcons = [MessageSquare, Target, LineChart];

export default function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ---- Hero (dark dramatic) ---- */}
      <section className="bg-black text-white px-6 py-28 text-center" data-aos="fade-up">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Your AI-Powered<br />
            <span className="text-blue-400">Financial Assistant</span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-xl mx-auto">
            FinBud helps you build smarter money habits, track goals, and get instant answers to your financial questions — all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition"
              >
                Start Chatting
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-8 py-3 rounded-full border border-gray-600 text-white font-medium hover:border-gray-400 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---- Value Props ---- */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8">
          {valueProps.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="rounded-xl p-6 text-center hover:shadow-lg transition"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                }}
                data-aos="fade-up"
              >
                <div
                  className="w-14 h-14 rounded-xl mx-auto flex items-center justify-center mb-4"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <Icon className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {v.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {v.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Stats ---- */}
      <section className="px-6 py-16" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label} data-aos="fade-up">
              <p className="text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {s.value}
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Features ---- */}
      <section className="px-6 py-20 max-w-4xl mx-auto space-y-16">
        {features.map((f, i) => {
          const Icon = featureIcons[i];
          return (
            <div
              key={f.title}
              className={`flex flex-col sm:flex-row items-center gap-8 ${
                i % 2 !== 0 ? 'sm:flex-row-reverse' : ''
              }`}
              data-aos={i % 2 === 0 ? 'fade-right' : 'fade-left'}
            >
              <div
                className="flex-1 shrink-0 w-full sm:w-auto flex items-center justify-center rounded-xl h-48"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <Icon className="w-16 h-16" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {f.title}
                </h3>
                <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>
                  {f.desc}
                </p>
                <Link
                  to={f.link}
                  className="mt-5 inline-block px-6 py-2.5 rounded-full text-sm font-medium transition"
                  style={{ background: 'var(--accent-color)', color: 'var(--bg-primary)' }}
                >
                  {f.cta} &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      {/* ---- FAQ ---- */}
      <section className="px-6 py-16" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-10"
            style={{ color: 'var(--text-primary)' }}
            data-aos="fade-up"
          >
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-xl"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                  data-aos="fade-up"
                  data-aos-delay={i * 100}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {f.q}
                    <span
                      className={`ml-3 shrink-0 transition-transform ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <p className="px-5 pb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {f.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer
        className="px-6 py-8 text-center text-sm"
        style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}
      >
        &copy; {new Date().getFullYear()} FinBud. All rights reserved.
      </footer>
    </div>
  );
}
