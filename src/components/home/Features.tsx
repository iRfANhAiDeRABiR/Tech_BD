import {
  Zap,
  ShieldCheck,
  CreditCard,
  Headset,
  BadgeCheck,
  RefreshCw,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast Delivery",
    description:
      "Digital product information is prepared for delivery after order verification.",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    shadow: "rgba(99, 102, 241, 0.35)",
  },
  {
    icon: ShieldCheck,
    title: "Clear Product Details",
    description:
      "Compatibility, validity and activation requirements are displayed before purchase.",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    shadow: "rgba(16, 185, 129, 0.35)",
  },
  {
    icon: CreditCard,
    title: "Local Payments",
    description:
      "Support for popular payment methods used by customers in Bangladesh.",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
    shadow: "rgba(245, 158, 11, 0.35)",
  },
  {
    icon: Headset,
    title: "Customer Support",
    description:
      "Assistance is available for ordering, installation and activation questions.",
    gradient: "linear-gradient(135deg, #ec4899 0%, #e11d48 100%)",
    shadow: "rgba(236, 72, 153, 0.35)",
  },
  {
    icon: BadgeCheck,
    title: "Genuine Licenses",
    description:
      "Products are listed with clear license type, activation notes and usage guidance.",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
    shadow: "rgba(14, 165, 233, 0.35)",
  },
  {
    icon: RefreshCw,
    title: "Replacement Help",
    description:
      "If an eligible product has an activation issue, support will guide you through the next steps.",
    gradient: "linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)",
    shadow: "rgba(168, 85, 247, 0.35)",
  },
];

export function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Why Us</span>

          <h2 className="section-title">
            Why Choose{" "}
            <span className="gradient-text">Tech Solutions BD</span>
          </h2>

          <p className="section-desc">
            A simpler and clearer digital software buying experience
          </p>
        </div>

        <div className="features__grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feature-card" key={feature.title}>
                <div
                  className="feature-card__icon"
                  style={{
                    background: feature.gradient,
                    boxShadow: `0 8px 20px ${feature.shadow}, inset 0 1px 1px rgba(255, 255, 255, 0.4)`,
                    color: "#ffffff",
                  }}
                  aria-hidden="true"
                >
                  <Icon size={24} strokeWidth={2.2} />
                </div>

                <div className="feature-card__body">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}