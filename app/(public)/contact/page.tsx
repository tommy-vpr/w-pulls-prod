// app/contact/page.tsx
import { HolographicBackground } from "@/components/ui/HolographicBackground";
import { ContactContent } from "@/components/contact/ContactContent";

export const metadata = {
  title: "Contact | W-Pulls",
  description: "Get in touch with the W-Pulls team",
};

export default function ContactPage() {
  return (
    <HolographicBackground
      particles
      particleCount={25}
      hexGrid
      dataStreams
      accentColor="cyan"
    >
      <ContactContent />
    </HolographicBackground>
  );
}
