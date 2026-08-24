import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { FAQItemAccordion } from "@/components/landing/FAQItemAccordion";
import { FAQS } from "@/constants/landing";

export function FAQ() {
  return (
    <section id="faq" className="border-t border-line bg-paper py-28 md:py-40">
      <Container className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <SectionHeading
          eyebrow="Questions"
          title="Before you begin."
          className="md:sticky md:top-32 md:self-start"
        />
        <div className="flex flex-col">
          {FAQS.map((item, index) => (
            <FAQItemAccordion key={item.id} item={item} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
