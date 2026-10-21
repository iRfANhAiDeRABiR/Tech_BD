const messages = [
  "⚡ Fast Digital Delivery",
  "🔒 Secure Order Processing",
  "💳 Local Payment Options",
  "📞 Customer Support",
  "🏷️ Competitive Prices",
  "✅ Activation Assistance",
];

export function Marquee() {
  const repeatedMessages = [...messages, ...messages];

  return (
    <section className="marquee-section" aria-label="Store benefits">
      <div className="marquee">
        <div className="marquee__track">
          {repeatedMessages.map((message, index) => (
            <span className="marquee__item" key={`${message}-${index}`}>
              {message}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}