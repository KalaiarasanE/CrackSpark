import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-border shadow-sm flex items-center justify-center bg-card shrink-0">
              <img src="/logo.png" className="h-full w-full object-cover rounded-full" alt="Logo" />
            </div>
            <span className="font-display text-lg font-bold">CrackSpark</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            Crack government exams with ease — curated notifications, syllabi, mocks and study
            material in one premium portal.
          </p>
          <div className="flex gap-2 pt-1">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-foreground/80">
            Categories
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {["UPSC", "SSC", "RRB", "IBPS", "SBI", "TNPSC"].map((c) => (
              <li key={c}>
                <Link
                  to="/$category"
                  params={{ category: c.toLowerCase() }}
                  className="hover:text-primary"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-foreground/80">
            Company
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#about" className="hover:text-primary">
                About Us
              </a>
            </li>
            <li>
              <a href="#privacy" className="hover:text-primary">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#terms" className="hover:text-primary">
                Terms &amp; Conditions
              </a>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-foreground/80">
            Reach Us
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-primary" /> kalaiarasane28@gmail.com
            </li>
            <li className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-primary" /> +91 93455 06257
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary" /> Tamil Nadu, India
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CrackSpark. All rights reserved.</p>
          <p>Crafted for India's next generation of public servants.</p>
        </div>
      </div>
    </footer>
  );
}
